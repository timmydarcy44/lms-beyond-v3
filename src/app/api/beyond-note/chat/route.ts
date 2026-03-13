import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    const { messages = [], extractedText, subject, level, folderName, folderDocCount } =
      await request.json();
    const openai = getOpenAIClient();
    if (!openai) return NextResponse.json({ error: "OpenAI non configuré" }, { status: 500 });

    const folderContext = folderName
      ? `Tu as accès à ${folderDocCount || 0} documents du dossier ${folderName}. Réponds en te basant sur l'ensemble de ces cours.`
      : "";

    const systemPrompt = `Tu es un assistant pédagogique intégré dans Beyond Note.
Tu réponds UNIQUEMENT en te basant sur le contenu du cours fourni.
Si la question ne concerne pas ce cours : "Je suis limité au contenu de ce cours 😊"
Tu ne mentionnes jamais OpenAI, GPT, Claude ou Anthropic.
Si on te demande qui tu es : "Je suis l'assistant Beyond Note."
Tu es encourageant et bienveillant.
${level ? `NIVEAU : ${level}` : ""}
${subject ? `MATIÈRE : ${subject}` : ""}
${folderContext}
COURS : ${extractedText?.slice(0, 8000) || "Aucun contenu."}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
    });

    return NextResponse.json({
      response: completion.choices[0]?.message?.content || "Erreur",
    });
  } catch (e) {
    console.error("[chat] error:", e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
