import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadQualiopiCertified } from "@/lib/qualiopi/of-qualiopi-certified";
import { OF_STAFF_OWNERS } from "@/lib/qualiopi/of-staff";
import {
  VEILLE_AXES,
  mergeVeilleHighlightNote,
  splitVeilleHighlightNote,
  type VeillePlanDraft,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const NO_IMPACT_TITLE = "Aucun impact pour Byound — pas d'action";

function dueInDays(days: number | null | undefined): string | null {
  if (!days || !Number.isFinite(days) || days <= 0) return null;
  const d = new Date();
  d.setDate(d.getDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

/** Génère une proposition IA (brouillon) de plan d’action pour un surlignage. */
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await context.params;
  const { data: highlight, error } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!highlight) return NextResponse.json({ error: "Surlignage introuvable" }, { status: 404 });

  const theme = (highlight.theme || "transversal") as VeilleTheme;
  const axis = VEILLE_AXES.find((a) => a.theme === theme);
  const themeLabel = axis
    ? `Ind. ${axis.indicatorId} — ${axis.title}`
    : "Veille transversale";
  const { preface } = splitVeilleHighlightNote(highlight.note);
  const certified = await loadQualiopiCertified(supabase);
  const ownerHints = OF_STAFF_OWNERS.map((o) => o.label).join(" | ");

  const payload = await generateJSON(
    [
      "Tu es le responsable qualité / direction pédagogique de Byound, organisme de formation B2B (formation continue).",
      "Périmètre STRICT : OF B2B uniquement. PAS d’alternance, PAS de CFA, PAS d’apprentissage.",
      "À partir d’une information de veille surlignée, propose un PLAN D’ACTION opérationnel (brouillon IA).",
      "Réponds uniquement en JSON.",
      "Clés : summary (2–3 phrases d’enjeu), actions (1 à 3 objets maximum).",
      `Chaque action : title (phrase d’action concrète), owner_name (un parmi : ${ownerHints} | null), due_days (entier 7/15/30 ou null).`,
      "Ajoute TOUJOURS en dernière action : title exact « Aucun impact pour Byound — pas d'action », owner_name null, due_days null.",
      "Ne pas inventer d’engagements (réunions, rapports, comités) non demandés.",
      certified
        ? "Byound est certifié Qualiopi : tu peux parler de maintien de la certification si pertinent."
        : "IMPORTANT : Byound n’est PAS encore certifié Qualiopi. Interdit d’écrire « maintenir notre certification », « rester certifié », ou toute formulation qui affirme une certification déjà obtenue. Parle d’audit / préparation / conformité.",
      "Rappel indicateurs : 23 = veille légale et réglementaire ; 24 = compétences et métiers ; 25 = innovations pédagogiques.",
      "",
      `Titre : ${String(highlight.title ?? "")}`,
      `Axe : ${themeLabel}`,
      `Synthèse / extrait : ${String(highlight.excerpt ?? "").slice(0, 2500)}`,
      `Note actuelle : ${preface.slice(0, 800)}`,
      highlight.url ? `URL : ${highlight.url}` : "",
    ].join("\n"),
    {
      type: "object",
      properties: {
        summary: { type: "string" },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              owner_name: { type: ["string", "null"] },
              due_days: { type: ["number", "null"] },
            },
            required: ["title"],
          },
        },
      },
      required: ["summary", "actions"],
    },
    "Tu produis des plans d’action OF B2B actionnables pour Byound.",
  );

  const rawActions =
    payload && typeof payload === "object" && Array.isArray((payload as { actions?: unknown }).actions)
      ? ((payload as { actions: Array<Record<string, unknown>> }).actions)
      : [];

  const items = rawActions
    .slice(0, 4)
    .map((row, index) => ({
      id: `a${index + 1}`,
      title: String(row.title ?? "").trim(),
      owner_name: row.owner_name ? String(row.owner_name).trim() : null,
      due_at: dueInDays(typeof row.due_days === "number" ? row.due_days : null),
      selected: false,
    }))
    .filter((item) => item.title);

  if (!items.some((item) => item.title.toLowerCase().includes("aucun impact"))) {
    items.push({
      id: `a${items.length + 1}`,
      title: NO_IMPACT_TITLE,
      owner_name: null,
      due_at: null,
      selected: false,
    });
  }

  if (!items.length) {
    return NextResponse.json({ error: "Génération du plan d’action impossible" }, { status: 502 });
  }

  const planDraft: VeillePlanDraft = {
    version: 1,
    summary:
      payload && typeof payload === "object"
        ? String((payload as { summary?: string }).summary ?? "").trim() || undefined
        : undefined,
    items: items.slice(0, 4),
  };

  const note = mergeVeilleHighlightNote(preface, planDraft);
  const { data: updated, error: updateError } = await supabase
    .from("crm_qualiopi_veille_highlights")
    .update({
      note,
      status: highlight.status === "done" ? "done" : "in_progress",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ highlight: updated, planDraft });
}
