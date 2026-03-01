import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

const DIMENSIONS = [
  "Gestion des émotions",
  "Communication",
  "Persévérance",
  "Organisation",
  "Empathie",
  "Résolution de problèmes",
  "Collaboration",
  "Créativité",
  "Leadership",
  "Confiance en soi",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "Le prompt est requis." }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const system =
      "Tu es un expert RH. Sélectionne 5 soft skills prioritaires parmi la liste fournie. Réponds en JSON strict.";
    const user = `Mission: ${prompt}
Liste disponible: ${DIMENSIONS.join(", ")}
Format attendu: { "skills": ["...", "..."] }`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content);
    const skills = Array.isArray(parsed?.skills)
      ? parsed.skills.filter((skill: string) => DIMENSIONS.includes(skill)).slice(0, 5)
      : [];

    return NextResponse.json({ skills });
  } catch (error) {
    console.error("[beyond-connect/generate-soft-skills] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
