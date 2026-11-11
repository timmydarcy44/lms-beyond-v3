import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { generateJSON } from "@/lib/ai/openai-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { normalizeAiProgramStructure } from "@/lib/training-courses/normalize-ai-program";
import { SURMESURE_SELECT } from "@/lib/training-courses/surmesure";

export const dynamic = "force-dynamic";

const PROGRAM_SCHEMA = {
  type: "object",
  properties: {
    program: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          chapters: {
            type: "array",
            minItems: 2,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                subchapters: {
                  type: "array",
                  minItems: 2,
                  maxItems: 8,
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

  const systemPrompt =
    "Tu es architecte pédagogique senior pour Byound Business (France). Réponds UNIQUEMENT en JSON valide, en français. " +
    "program = arborescence EXACTE : SECTION (title + description) → CHAPITRES (title) → SOUS-CHAPITRES (tableau de strings titres). " +
    "PAS de contenu LMS (pas de texte long, pas de slides). Titres concrets, progressifs, opérationnels. " +
    "Chaque sous-chapitre = une activité ou compétence mesurable. " +
    "Adapte le volume à la durée (1 jour ≈ 3 sections ; 2 jours ≈ 4 sections ; 3 jours ≈ 5 sections). " +
    "Inclure naturellement des points d'évaluation (quiz) et d'ancrage (entretien) via le libellé des sous-chapitres si pertinent.";

  const userPrompt = `Génère le programme détaillé (Section → Chapitre → Sous-chapitre) pour cette formation Sur-mesure Byound, co-construite avec le client.

Titre: ${course.title}
Durée: ${course.duration || "2 jours"}
Niveau: ${course.level || "Intermédiaire"}
Domaine: ${course.domain || "—"}
Public: ${Array.isArray(course.audience) ? course.audience.join(", ") : "—"}
Objectifs pédagogiques: ${Array.isArray(course.objectives) ? course.objectives.join(" | ") : "—"}
Prérequis: ${course.prerequisites || "—"}
Besoins spécifiques: ${course.specific_needs || "—"}
Description: ${course.short_description || course.long_description || "—"}
${brief ? `\nBrief commercial / client :\n${brief}` : ""}

Retourne { "program": [ ... ] }. Densité adaptée à la durée. PAS de contenu de chapitre.`;

  const result = await generateJSON<Record<string, unknown>>(userPrompt, PROGRAM_SCHEMA, systemPrompt);
  if (!result) {
    return NextResponse.json({ error: "IA indisponible — vérifiez OPENAI_API_KEY" }, { status: 503 });
  }

  const program_structure = normalizeAiProgramStructure(result.program ?? result.program_structure);
  const chapterCount = program_structure.reduce((n, s) => n + s.chapters.length, 0);
  const subCount = program_structure.reduce(
    (n, s) => n + s.chapters.reduce((m, c) => m + c.subchapters.length, 0),
    0,
  );

  if (program_structure.length < 2 || chapterCount < 4 || subCount < 8) {
    return NextResponse.json(
      {
        error:
          "L'IA n'a pas produit un programme assez dense. Enrichissez le brief Qualiopi et relancez.",
        debug: { sections: program_structure.length, chapters: chapterCount, subchapters: subCount },
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

  return NextResponse.json({ course: updated, program_structure });
}
