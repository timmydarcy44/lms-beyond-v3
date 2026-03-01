import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, culture, city, salary } = body ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "Le prompt est requis." }, { status: 400 });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json({ error: "OpenAI non configuré." }, { status: 500 });
    }

    const system = "Tu es un expert RH. Rédige une offre d'alternance claire, structurée et professionnelle.";
    const user = `Brief : ${prompt}
${city ? `\nVille : ${city}` : ""}
${salary ? `\nSalaire : ${salary}` : ""}
${culture ? `\nCulture / ambiance : ${culture}` : ""}

Structure attendue :
1. Titre du poste
2. Missions
3. Profil recherché
4. Infos pratiques`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1200,
    });

    const result = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[beyond-connect/generate-preview] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération." }, { status: 500 });
  }
}
