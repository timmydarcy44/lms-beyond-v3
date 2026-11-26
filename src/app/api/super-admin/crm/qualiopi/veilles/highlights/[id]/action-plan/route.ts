import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/openai-client";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  VEILLE_THEME_LABELS,
  mergeVeilleHighlightNote,
  splitVeilleHighlightNote,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Génère un plan d’action Byound (FC / alternance) pour un surlignage. */
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
  const themeLabel = VEILLE_THEME_LABELS[theme] ?? theme;
  const { preface } = splitVeilleHighlightNote(highlight.note);

  const payload = await generateJSON(
    [
      "Tu es le responsable qualité / direction pédagogique de Byound (OF Qualiopi + CFA / alternance).",
      "À partir d’une information de veille surlignée, propose un PLAN D’ACTION opérationnel.",
      "Réponds uniquement en JSON avec la clé actionPlan (string).",
      "actionPlan = texte structuré en français, 8 à 16 lignes, avec :",
      "1) Enjeu pour Byound (formation continue et/ou alternance)",
      "2) Actions concrètes numérotées (qui fait quoi : Timmy, Jessica, formateurs, process)",
      "3) Preuves Qualiopi liées si pertinent (indicateurs 23/24/25 ou autres)",
      "4) Délai sugeré (cette semaine / 15 jours / prochain PAQ)",
      "5) Risque si on n’agit pas",
      "Pas de markdown lourd, pas de titres # — utilise des lignes claires.",
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
        actionPlan: { type: "string" },
      },
      required: ["actionPlan"],
    },
    "Tu produis des plans d’action OF actionnables pour Byound.",
  );

  const actionPlan =
    payload && typeof payload === "object"
      ? String((payload as { actionPlan?: string }).actionPlan ?? "").trim()
      : "";

  if (!actionPlan) {
    return NextResponse.json({ error: "Génération du plan d’action impossible" }, { status: 502 });
  }

  const note = mergeVeilleHighlightNote(preface, actionPlan);
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
  return NextResponse.json({ highlight: updated, actionPlan });
}
