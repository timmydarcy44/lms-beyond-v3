import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

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
          chapitres?: unknown;
          nb_questions?: number;
          type?: string;
          niveau?: string;
          formation_titre?: string;
        }
      | null;

    if (!body?.chapitres || !body?.nb_questions || !body?.type || !body?.niveau) {
      return NextResponse.json({ error: "Données manquantes pour générer le quiz" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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
            formation_titre: body.formation_titre ?? "",
            chapitres: body.chapitres,
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

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[api/formateur/quiz/generate] error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
