import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const voice = typeof body?.voice === "string" ? body.voice : "nova";

    if (!text) {
      return NextResponse.json({ error: "Texte manquant" }, { status: 400 });
    }

    const client = getOpenAIClient();
    if (!client) {
      console.error("[api/audio/speech] Missing OPENAI_API_KEY");
      return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });
    }

    console.log("[api/audio/speech] Generating audio", { voice, length: text.length });
    const response = await client.audio.speech.create({
      model: "tts-1",
      voice,
      input: text.slice(0, 300),
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[api/audio/speech] OpenAI error object:", error);
    return NextResponse.json({ error: "Erreur de synthèse vocale" }, { status: 500 });
  }
}
