import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI non configuré" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4000,
      messages: [
        {
          role: "system",
          content: `Tu es un expert en ingénierie pédagogique.
À partir du contenu de formation ci-dessous,
génère exactement ${body.nb_questions} questions de quiz
de type ${body.type} avec un niveau ${body.niveau}.

Pour chaque question retourne UNIQUEMENT ce JSON :
{
  'questions': [
    {
      'question': string,
      'options': [string, string, string, string],
      'correct': number (index 0-3),
      'explication': string
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

    const rawText = response.choices[0].message.content || "";
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Impossible d'extraire le JSON" }, { status: 500 });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[api/formateur/quiz/generate] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
