import { generateJSON } from "@/lib/ai/openai-client";
import { sendEmail, resolveAdminBccEmail } from "@/lib/email/resend-client";
import { collectVeilleSnippets } from "@/lib/qualiopi/veille-fetch";
import {
  VEILLE_KIND,
  VEILLE_KIND_LABEL,
  parseVeilleRag,
  parseVeilleTheme,
  weekStartMonday,
  type VeilleDigestItem,
} from "@/lib/qualiopi/veille-shared";
import { buildVeilleWeeklyEmailHtml } from "@/lib/qualiopi/veille-email";
import { getServiceRoleClient } from "@/lib/supabase/server";

function itemId(index: number) {
  return `actu-${index + 1}`;
}

async function synthesizeDigest(input: {
  snippets: Awaited<ReturnType<typeof collectVeilleSnippets>>;
}): Promise<{ title: string; summary: string; items: VeilleDigestItem[] }> {
  const fallbackItems: VeilleDigestItem[] = input.snippets.slice(0, 8).map((snippet, index) => ({
    id: itemId(index),
    title: snippet.title,
    summary: snippet.summary.slice(0, 420),
    url: snippet.url ?? null,
    theme: "transversal",
    rag: snippet.rag,
    sourceLabel: snippet.sourceLabel ?? null,
    isPriority: Boolean(snippet.isPriority),
  }));

  if (input.snippets.length === 0) {
    return {
      title: `${VEILLE_KIND_LABEL} — semaine en cours`,
      summary:
        "Aucun signal cette semaine. Ajoutez des sources RAG 1 (URLs prioritaires), ou vérifiez la clé Brave Search pour le RAG 2.",
      items: [],
    };
  }

  const payload = await generateJSON(
    [
      "Tu rédiges UNE veille unique pour un organisme de formation (Qualiopi).",
      "Fusionne réglementaire, métier et pédagogie : ce sont des actualités / informations utiles, pas une liste de sites.",
      "Réponds uniquement en JSON.",
      "Clés : title (string), summary (2 à 4 phrases sur les faits marquants), items (tableau de 5 à 10 actualités).",
      "Chaque item : title (accroche d'actualité), summary (ce qui change + pourquoi ça compte pour un OF), theme (reglementaire|metier|pedagogie|transversal), rag (rag1|rag2), url (string ou null).",
      "RAG 1 = contenus issus des sources prioritaires fournies. RAG 2 = web formation continue.",
      "Priorise les faits issus du RAG 1. Ne liste pas de sites pour eux-mêmes. Français, factuel.",
      "",
      "Extraits collectés :",
      JSON.stringify(
        input.snippets.map((s) => ({
          title: s.title,
          summary: s.summary.slice(0, 900),
          url: s.url ?? null,
          rag: s.rag,
        })),
      ),
    ].join("\n"),
    {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              theme: { type: "string" },
              rag: { type: "string" },
              url: { type: ["string", "null"] },
            },
            required: ["title", "summary"],
          },
        },
      },
      required: ["title", "summary", "items"],
    },
    "Tu aides un organisme de formation à documenter sa veille Qualiopi sous forme d'actualités.",
  );

  if (!payload || typeof payload !== "object") {
    return {
      title: `${VEILLE_KIND_LABEL} — semaine en cours`,
      summary: "Synthèse automatique à partir des signaux collectés.",
      items: fallbackItems,
    };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: VeilleDigestItem[] = rawItems.slice(0, 12).map((row: Record<string, unknown>, index: number) => {
    const rag = parseVeilleRag(row.rag) ?? (index < 3 ? "rag1" : "rag2");
    return {
      id: itemId(index),
      title: String(row.title ?? "").trim() || `Actualité ${index + 1}`,
      summary: String(row.summary ?? "").trim() || "",
      url: row.url ? String(row.url) : null,
      theme: parseVeilleTheme(row.theme) ?? "transversal",
      rag,
      sourceLabel: rag === "rag1" ? "RAG 1" : "RAG 2",
      isPriority: rag === "rag1",
    };
  });

  return {
    title: String(payload.title ?? "").trim() || `${VEILLE_KIND_LABEL} — semaine en cours`,
    summary: String(payload.summary ?? "").trim() || "Actualités de la semaine.",
    items: items.length ? items : fallbackItems,
  };
}

export async function runQualiopiWeeklyVeilles(options?: { sendEmail?: boolean }) {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return { ok: false as const, error: "Service indisponible" };
  }

  const weekStart = weekStartMonday();
  const { data: sources } = await supabase
    .from("crm_qualiopi_veille_sources")
    .select("id, kind, url, title, is_priority, is_active")
    .eq("is_active", true);

  const priorityUrls = (sources ?? [])
    .filter((row) => row.is_priority !== false)
    .map((row) => ({ url: String(row.url), title: (row.title as string | null) ?? null }));

  const snippets = await collectVeilleSnippets({ priorityUrls });
  const synthesized = await synthesizeDigest({ snippets });

  const sourcesUsed = [
    ...priorityUrls.map((row) => ({
      url: row.url,
      title: row.title ?? undefined,
      priority: true,
      rag: "rag1" as const,
    })),
    ...snippets
      .filter((row) => row.rag === "rag2" && row.url)
      .slice(0, 6)
      .map((row) => ({
        url: row.url,
        title: row.title,
        priority: false,
        rag: "rag2" as const,
      })),
  ];

  const { data, error } = await supabase
    .from("crm_qualiopi_veille_digests")
    .upsert(
      {
        week_start: weekStart,
        kind: VEILLE_KIND,
        title: synthesized.title,
        summary: synthesized.summary,
        items: synthesized.items,
        sources_used: sourcesUsed,
      },
      { onConflict: "week_start,kind" },
    )
    .select("id, title")
    .single();

  if (error || !data) {
    console.error("[qualiopi-veille] upsert", error?.message);
    return { ok: false as const, error: error?.message || "Échec enregistrement" };
  }

  const digests = [
    {
      kind: VEILLE_KIND,
      id: data.id as string,
      title: data.title as string,
      itemCount: synthesized.items.length,
    },
  ];

  let email: { success: boolean; error?: string } | null = null;
  if (options?.sendEmail !== false) {
    const to = resolveAdminBccEmail() || "timmydarcy44@gmail.com";
    const html = buildVeilleWeeklyEmailHtml({
      weekStart,
      title: synthesized.title,
      summary: synthesized.summary,
      items: synthesized.items,
    });

    email = await sendEmail({
      to,
      subject: `Veille formation continue — semaine du ${weekStart}`,
      html,
      skipBcc: false,
    });

    if (email.success) {
      await supabase
        .from("crm_qualiopi_veille_digests")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", data.id);
    }
  }

  return { ok: true as const, weekStart, digests, email };
}
