import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await request.json();
    const { first_name, disc_profile, mai_scores, stress_level, dys_indicators, soft_skills } = body ?? {};

    if (!first_name || !disc_profile) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const system = `Tu es un expert référent handicap en CFA. Rédige une synthèse concise, professionnelle et actionnable.`;
    const user = `Rédige une synthèse de profil pour un référent handicap. Analyse les forces et les points d'attention de ${first_name}
en croisant ses difficultés de concentration et sa métacognition.

Données:
- DISC: ${disc_profile}
- MAI: ${JSON.stringify(mai_scores)}
- Stress: ${stress_level}
- DYS: ${JSON.stringify(dys_indicators)}
- Soft Skills: ${JSON.stringify(soft_skills)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 220,
      temperature: 0.4,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";
    if (!content) {
      return NextResponse.json({ error: "Réponse IA vide." }, { status: 502 });
    }

    return NextResponse.json({ summary: content });
  } catch (error) {
    console.error("[beyond-care/profile-analysis] Error:", error);
    console.error("[beyond-care/profile-analysis] Payload reçu:", Object.keys(body || {}));
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
