import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getCourseBuilderSnapshot } from "@/lib/queries/formateur";
import type { CourseBuilderSnapshot } from "@/types/course-builder";
import { AI_CONTEXT_LIMITS, capChapitresForQuiz, truncateText } from "@/lib/ai/context-limits";

type GeneratedQuestion =
  | {
      id?: string;
      type: "single" | "multiple";
      title: string;
      options: string[];
      correct_answer: number | number[];
      feedback?: string;
      explanation_wrong?: string;
    }
  | {
      id?: string;
      type: "text";
      title: string;
      placeholder?: string;
      correct_answer?: string | string[];
      feedback?: string;
      explanation_wrong?: string;
    };

function buildChapitresPayload(snapshot: CourseBuilderSnapshot) {
  const sections = Array.isArray(snapshot.sections) ? snapshot.sections : [];
  const raw = sections
    .map((section: any) => {
      const chapters = Array.isArray(section?.chapters) ? section.chapters : [];
      return {
        section: truncateText(String(section?.title ?? "").trim(), 120),
        chapters: chapters
          .map((chapter: any) => {
            const subs = Array.isArray(chapter?.subchapters) ? chapter.subchapters : [];
            return {
              section: truncateText(String(section?.title ?? "").trim(), 120),
              chapter: truncateText(String(chapter?.title ?? "").trim(), 200),
              content: truncateText(
                String(chapter?.content ?? chapter?.summary ?? "").trim(),
                AI_CONTEXT_LIMITS.CHAPTER_TEXT_MAX,
              ),
              subchapters: subs.map((sub: any) => ({
                title: truncateText(String(sub?.title ?? "").trim(), 120),
                content: truncateText(
                  String(sub?.content ?? sub?.summary ?? "").trim(),
                  AI_CONTEXT_LIMITS.SUBCHAPTER_TEXT_MAX,
                ),
              })),
            };
          })
          .filter((x: any) => x.chapter || x.content || (x.subchapters?.length ?? 0) > 0),
      };
    })
    .filter((x: any) => x.section || (x.chapters?.length ?? 0) > 0);
  return capChapitresForQuiz(raw);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          formation_id?: string;
          formation_titre?: string;
          nb_questions?: number;
        }
      | null;

    const formationId = String(body?.formation_id ?? "").trim();
    const nb = typeof body?.nb_questions === "number" ? body.nb_questions : 20;
    if (!formationId) {
      return NextResponse.json({ error: "formation_id manquant" }, { status: 400 });
    }

    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const snapshot = (await getCourseBuilderSnapshot(formationId)) as CourseBuilderSnapshot | null;
    if (!snapshot) {
      return NextResponse.json({ error: "Formation introuvable ou snapshot absent" }, { status: 404 });
    }

    const chapitres = buildChapitresPayload(snapshot);
    const formationTitre =
      String(body?.formation_titre ?? "").trim() || String(snapshot?.general?.title ?? "").trim() || "Formation";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });

    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en ingénierie pédagogique.

Génère un quiz de validation basé sur l'intégralité de la formation.
Objectif: évaluer la compréhension (mix de difficulté) sans pièges inutiles.

Contraintes:
- EXACTEMENT ${nb} questions.
- Mix de types: single (choix unique), multiple (choix multiples), text (réponse libre / texte à trou).
- Pour single/multiple: 4 options. Les options doivent être courtes et non ambiguës.
- Pour text: donne un correct_answer (string ou string[]) et un placeholder si utile.

Retourne UNIQUEMENT ce JSON (pas de markdown):
{
  "questions": [
    {
      "type": "single" | "multiple" | "text",
      "title": string,
      "options"?: [string, string, string, string],
      "correct_answer"?: number | number[] | string | string[],
      "feedback"?: string,
      "explanation_wrong"?: string
    }
  ]
}`,
        },
        {
          role: "user",
          content: JSON.stringify({ formation_titre: formationTitre, chapitres }),
        },
      ],
    });

    const rawText = response.choices[0].message.content || "";
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'extraire le JSON" }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]) as { questions?: unknown };
    const questions = Array.isArray(parsed?.questions) ? (parsed.questions as GeneratedQuestion[]) : [];
    if (!questions.length) {
      return NextResponse.json({ error: "Aucune question générée" }, { status: 500 });
    }

    return NextResponse.json({ questions, formation_titre: formationTitre });
  } catch (error) {
    console.error("[api/formateur/trigger-quiz/generate] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

