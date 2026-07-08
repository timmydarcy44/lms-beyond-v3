import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import { capChapitresForQuiz, AI_CONTEXT_LIMITS, truncateText } from "@/lib/ai/context-limits";
import { logAIUsageEvent } from "@/lib/ai/usage-logger";

export const maxDuration = 60;

type ChapterPayload = {
  section?: string;
  chapters?: Array<{
    section?: string;
    chapter?: string;
    content?: string;
    subchapters?: Array<{ title?: string; content?: string }>;
  }>;
};

function buildChapitresFromSnapshot(snapshot: CourseBuilderSnapshot): ChapterPayload[] {
  return (snapshot.sections ?? [])
    .map((section) => ({
      section: truncateText(String(section.title ?? ""), 200),
      chapters: (section.chapters ?? [])
        .map((chapter) => ({
          section: truncateText(String(section.title ?? ""), 200),
          chapter: truncateText(String(chapter.title ?? ""), 200),
          content: truncateText(
            String(chapter.content ?? chapter.summary ?? ""),
            AI_CONTEXT_LIMITS.CHAPTER_TEXT_MAX,
          ),
          subchapters: (chapter.subchapters ?? []).map((sub) => ({
            title: truncateText(String(sub.title ?? ""), 120),
            content: truncateText(
              String(sub.content ?? sub.summary ?? ""),
              AI_CONTEXT_LIMITS.SUBCHAPTER_TEXT_MAX,
            ),
          })),
        }))
        .filter((chapter) => chapter.chapter || chapter.content || (chapter.subchapters?.length ?? 0) > 0),
    }))
    .filter((section) => section.section || (section.chapters?.length ?? 0) > 0);
}

function sanitizeClientChapitres(chapitres: unknown): ChapterPayload[] {
  if (!Array.isArray(chapitres)) return [];
  return chapitres.map((section) => ({
    section: truncateText(String((section as ChapterPayload)?.section ?? ""), 200),
    chapters: Array.isArray((section as ChapterPayload)?.chapters)
      ? (section as ChapterPayload).chapters!.map((chapter) => ({
          section: truncateText(String(chapter?.section ?? ""), 200),
          chapter: truncateText(String(chapter?.chapter ?? ""), 200),
          content: truncateText(String(chapter?.content ?? ""), AI_CONTEXT_LIMITS.CHAPTER_TEXT_MAX),
          subchapters: Array.isArray(chapter?.subchapters)
            ? chapter.subchapters.map((sub) => ({
                title: truncateText(String(sub?.title ?? ""), 120),
                content: truncateText(String(sub?.content ?? ""), AI_CONTEXT_LIMITS.SUBCHAPTER_TEXT_MAX),
              }))
            : [],
        }))
      : [],
  }));
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          formation_id?: string;
          chapitres?: unknown;
          nb_questions?: number;
          type?: string;
          niveau?: string;
          formation_titre?: string;
        }
      | null;

    if (!body?.nb_questions || !body?.type || !body?.niveau) {
      return NextResponse.json({ error: "Données manquantes pour générer le quiz" }, { status: 400 });
    }

    let chapitres = sanitizeClientChapitres(body.chapitres);
    let formationTitre = String(body.formation_titre ?? "").trim();

    const formationId = String(body.formation_id ?? "").trim();
    if ((!chapitres.length || chapitres.every((s) => !(s.chapters?.length ?? 0))) && formationId) {
      const snapshot = (await getCourseBuilderSnapshot(formationId)) as CourseBuilderSnapshot | null;
      if (snapshot) {
        chapitres = buildChapitresFromSnapshot(snapshot);
        formationTitre = formationTitre || String(snapshot.general?.title ?? "").trim();
      }
    }

    if (!chapitres.length) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un chapitre ou enregistrez la formation avant de générer." },
        { status: 400 },
      );
    }

    chapitres = capChapitresForQuiz(chapitres);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI non configuré sur le serveur (OPENAI_API_KEY manquante)" },
        { status: 503 },
      );
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Tu es un expert en ingénierie pédagogique.
À partir du contenu de formation ci-dessous,
génère exactement ${body.nb_questions} questions de quiz
de type ${body.type} avec un niveau ${body.niveau}.

Retourne UNIQUEMENT un objet JSON valide avec cette structure :
{
  "questions": [
    {
      "question": "string",
      "image_keyword": "minimalist, editorial photography, high-end, theme en anglais",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explication": "string"
    }
  ]
}`,
        },
        {
          role: "user",
          content: JSON.stringify({
            formation_titre: formationTitre || "Formation",
            chapitres,
          }),
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content || "";
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'extraire le JSON généré" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { questions?: unknown[] };
    const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
    if (!questions.length) {
      return NextResponse.json({ error: "Aucune question générée par l'IA" }, { status: 500 });
    }

    await logAIUsageEvent(supabase, {
      userId: user.id,
      route: "formateur/quiz/generate",
      action: String(body.type),
      provider: "openai",
      model: "gpt-4o-mini",
      costEur: 0.01,
      metadata: {
        nb_questions: body.nb_questions,
        formation_id: formationId || null,
      },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[api/formateur/quiz/generate] error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return NextResponse.json(
        {
          error:
            "Quota OpenAI dépassé — rechargez votre compte sur platform.openai.com ou contactez l'administrateur.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
