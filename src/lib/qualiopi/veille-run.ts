import { generateJSON } from "@/lib/ai/openai-client";
import { sendEmail, resolveAdminBccEmail } from "@/lib/email/resend-client";
import { collectVeilleSnippets } from "@/lib/qualiopi/veille-fetch";
import {
  VEILLE_KIND_LABELS,
  VEILLE_KINDS,
  weekStartMonday,
  type VeilleDigestItem,
  type VeilleKind,
} from "@/lib/qualiopi/veille-shared";
import { buildVeilleWeeklyEmailHtml } from "@/lib/qualiopi/veille-email";
import { getServiceRoleClient } from "@/lib/supabase/server";

function itemId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

async function synthesizeKind(input: {
  kind: VeilleKind;
  snippets: Awaited<ReturnType<typeof collectVeilleSnippets>>;
}): Promise<{ title: string; summary: string; items: VeilleDigestItem[] }> {
  const label = VEILLE_KIND_LABELS[input.kind];
  const fallbackItems: VeilleDigestItem[] = input.snippets.slice(0, 6).map((snippet, index) => ({
    id: itemId(input.kind, index),
    title: snippet.title,
    summary: snippet.summary.slice(0, 400),
    url: snippet.url ?? null,
    sourceLabel: snippet.sourceLabel ?? null,
    isPriority: Boolean(snippet.isPriority),
  }));

  if (input.snippets.length === 0) {
    return {
      title: `${label} — semaine en cours`,
      summary:
        "Aucun signal collecté cette semaine. Ajoutez des URL prioritaires dans /super/crm/qualiopi/veilles, ou vérifiez la clé Brave Search.",
      items: [],
    };
  }

  const payload = await generateJSON(
    [
      `Tu rédiges une synthèse de veille Qualiopi (${label}) pour un organisme de formation.`,
      "Réponds uniquement en JSON.",
      "Clés : title (string), summary (2 à 4 phrases), items (tableau de 3 à 6 objets).",
      "Chaque item : title, summary (1 à 3 phrases utiles), url (string ou null), sourceLabel (string ou null), isPriority (boolean).",
      "Priorise les URL marquées prioritaires. Reste factuel. Français.",
      "",
      "Sources :",
      JSON.stringify(
        input.snippets.map((s) => ({
          title: s.title,
          summary: s.summary.slice(0, 700),
          url: s.url ?? null,
          isPriority: Boolean(s.isPriority),
          sourceLabel: s.sourceLabel ?? null,
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
              url: { type: ["string", "null"] },
              sourceLabel: { type: ["string", "null"] },
              isPriority: { type: "boolean" },
            },
            required: ["title", "summary"],
          },
        },
      },
      required: ["title", "summary", "items"],
    },
    "Tu aides un organisme de formation à documenter sa veille Qualiopi.",
  );

  if (!payload || typeof payload !== "object") {
    return {
      title: `${label} — semaine en cours`,
      summary: "Synthèse automatique à partir des sources collectées.",
      items: fallbackItems,
    };
  }

  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const items: VeilleDigestItem[] = rawItems.slice(0, 8).map((row: Record<string, unknown>, index: number) => ({
    id: itemId(input.kind, index),
    title: String(row.title ?? "").trim() || `Point ${index + 1}`,
    summary: String(row.summary ?? "").trim() || "",
    url: row.url ? String(row.url) : null,
    sourceLabel: row.sourceLabel ? String(row.sourceLabel) : null,
    isPriority: Boolean(row.isPriority),
  }));

  return {
    title: String(payload.title ?? "").trim() || `${label} — semaine en cours`,
    summary: String(payload.summary ?? "").trim() || "Synthèse de la semaine.",
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

  const digests: Array<{ kind: VeilleKind; id: string; title: string; itemCount: number }> = [];

  for (const kind of VEILLE_KINDS) {
    const kindSources = (sources ?? []).filter((row) => row.kind === kind);
    const priorityUrls = kindSources
      .filter((row) => row.is_priority !== false)
      .map((row) => ({ url: String(row.url), title: (row.title as string | null) ?? null }));

    const snippets = await collectVeilleSnippets({ kind, priorityUrls });
    const synthesized = await synthesizeKind({ kind, snippets });
    const sourcesUsed = [
      ...priorityUrls.map((row) => ({ url: row.url, title: row.title ?? undefined, priority: true })),
      ...snippets
        .filter((row) => !row.isPriority && row.url)
        .slice(0, 8)
        .map((row) => ({ url: row.url, title: row.title, priority: false })),
    ];

    const { data, error } = await supabase
      .from("crm_qualiopi_veille_digests")
      .upsert(
        {
          week_start: weekStart,
          kind,
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
      console.error("[qualiopi-veille] upsert", kind, error?.message);
      continue;
    }

    digests.push({
      kind,
      id: data.id as string,
      title: data.title as string,
      itemCount: synthesized.items.length,
    });
  }

  let email: { success: boolean; error?: string } | null = null;
  if (options?.sendEmail !== false && digests.length > 0) {
    const { data: full } = await supabase
      .from("crm_qualiopi_veille_digests")
      .select("*")
      .eq("week_start", weekStart)
      .order("kind");

    const to = resolveAdminBccEmail() || "timmydarcy44@gmail.com";
    const html = buildVeilleWeeklyEmailHtml({
      weekStart,
      digests: (full ?? []).map((row) => ({
        kind: row.kind as VeilleKind,
        title: String(row.title ?? ""),
        summary: String(row.summary ?? ""),
        items: Array.isArray(row.items) ? (row.items as VeilleDigestItem[]) : [],
      })),
    });

    email = await sendEmail({
      to,
      subject: `Veilles Qualiopi — semaine du ${weekStart}`,
      html,
      skipBcc: false,
    });

    if (email.success) {
      await supabase
        .from("crm_qualiopi_veille_digests")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("week_start", weekStart);
    }
  }

  return { ok: true as const, weekStart, digests, email };
}
