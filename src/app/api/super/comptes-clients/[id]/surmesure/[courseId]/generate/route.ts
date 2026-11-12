import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";
import { SURMESURE_SELECT } from "@/lib/training-courses/surmesure";
import {
  formatOrgContextForPrompt,
  loadSurMesureOrgContext,
} from "@/lib/training-courses/surmesure-org-context";
import {
  densityTargetsForDuration,
  describeDensityForPrompt,
  parseFormationDuration,
} from "@/lib/training-courses/surmesure-planning";

export const dynamic = "force-dynamic";

function programSchema(targets: ReturnType<typeof densityTargetsForDuration>) {
  return {
    type: "object",
    properties: {
      program: {
        type: "array",
        minItems: targets.minSections,
        maxItems: targets.maxSections,
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            chapters: {
              type: "array",
              minItems: targets.minChaptersPerSection,
              maxItems: 8,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  subchapters: {
                    type: "array",
                    minItems: targets.minSubchaptersPerChapter,
                    maxItems: 10,
                    items: { type: "string" },
                  },
                },
                required: ["title", "subchapters"],
              },
            },
          },
          required: ["title", "description", "chapters"],
        },
      },
    },
    required: ["program"],
  };
}

type Ctx = { params: Promise<{ id: string; courseId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const { id: orgId, courseId } = await context.params;
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: course, error: loadError } = await service
    .from("training_courses")
    .select(SURMESURE_SELECT)
    .eq("id", courseId)
    .eq("organization_id", orgId)
    .eq("source", "surmesure")
    .maybeSingle();

  if (loadError) return NextResponse.json({ error: loadError.message }, { status: 500 });
  if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { brief?: string };
  const brief = String(body.brief ?? "").trim();
  const orgCtx = await loadSurMesureOrgContext(service, orgId);

  const duration = parseFormationDuration(course.duration);
  const targets = densityTargetsForDuration(duration);
  const densityRules = describeDensityForPrompt(duration, targets);

  const systemPrompt =
    "Tu es architecte pédagogique senior pour Byound Business (France), niveau CEGOS/Orsys. " +
    "Réponds UNIQUEMENT en JSON valide, en français. " +
    "program = arborescence EXACTE : SECTION (title + description) → CHAPITRES (title) → SOUS-CHAPITRES (tableau de strings titres). " +
    "PAS de contenu LMS (pas de texte long, pas de slides). Titres concrets, progressifs, opérationnels. " +
    "Chaque sous-chapitre = une activité, cas pratique, outil ou compétence mesurable. " +
    "Ancre les titres dans le secteur d'activité du client (vocabulaire métier). " +
    "Inclure naturellement des points d'évaluation (quiz) et d'ancrage (entretien) via le libellé des sous-chapitres. " +
    "IMPORTANT densite : un programme trop léger est REFUSÉ. " +
    densityRules;

  const userPrompt = `Génère un programme DÉTAILLÉ et DENSE (Section → Chapitre → Sous-chapitre) pour cette formation Sur-mesure Byound.

Contexte entreprise :
${formatOrgContextForPrompt(orgCtx)}

Titre: ${course.title}
Durée: ${course.duration || duration.raw} (≈ ${duration.hours} h / ${duration.days} jour(s) / ${duration.halfDays} demi-journées)
Niveau: ${course.level || "Intermédiaire"}
Domaine: ${course.domain || "—"}
Public: ${Array.isArray(course.audience) ? course.audience.join(", ") : "—"}
Objectifs pédagogiques: ${Array.isArray(course.objectives) ? course.objectives.join(" | ") : "—"}
Prérequis: ${course.prerequisites || "—"}
Besoins spécifiques: ${course.specific_needs || "—"}
Description: ${course.short_description || course.long_description || "—"}
${brief ? `\nBrief commercial / client :\n${brief}` : ""}

Contraintes de densité :
${densityRules}

Le programme doit pouvoir se découper en Matinée 1 / Après-midi 1 / Matinée 2 / Après-midi 2… selon la durée.
Retourne { "program": [ ... ] }. PAS de contenu de chapitre.`;

  const result = await generateJSON<Record<string, unknown>>(
    userPrompt,
    programSchema(targets),
    systemPrompt,
  );
  if (!result) {
    return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
  }

  const program_structure = normalizeAiProgramStructure(result.program ?? result.program_structure);
  const chapterCount = program_structure.reduce((n, s) => n + s.chapters.length, 0);
  const subCount = program_structure.reduce(
    (n, s) => n + s.chapters.reduce((m, c) => m + c.subchapters.length, 0),
    0,
  );

  // Seuil un peu souple (90 %) pour éviter les faux négatifs IA, mais bien au-dessus de l'ancien 2/4/8.
  const minSectionsOk = Math.max(3, Math.floor(targets.minSections * 0.9));
  const minChaptersOk = Math.max(6, Math.floor(targets.minChaptersTotal * 0.85));
  const minSubsOk = Math.max(18, Math.floor(targets.minSubchaptersTotal * 0.8));

  if (
    program_structure.length < minSectionsOk ||
    chapterCount < minChaptersOk ||
    subCount < minSubsOk
  ) {
    return NextResponse.json(
      {
        error:
          `Programme trop léger pour ${duration.hours} h (${program_structure.length} sections / ${chapterCount} chapitres / ${subCount} sous-chapitres). ` +
          `Attendu ≈ ${targets.minSections}+ sections, ${targets.minChaptersTotal}+ chapitres, ${targets.minSubchaptersTotal}+ sous-chapitres. Relancez.`,
        debug: {
          sections: program_structure.length,
          chapters: chapterCount,
          subchapters: subCount,
          targets,
          duration,
        },
      },
      { status: 422 },
    );
  }

  const { data: updated, error: updateError } = await service
    .from("training_courses")
    .update({
      program_structure,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courseId)
    .eq("organization_id", orgId)
    .eq("source", "surmesure")
    .select(SURMESURE_SELECT)
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ course: updated, program_structure, duration, targets });
}
