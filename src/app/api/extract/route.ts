import { NextRequest, NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/ai/openai-client";

const PROMPT =
  "Extrait tout le texte de ce document PDF. Conserve la structure des tableaux en utilisant le format Markdown.";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString("base64");

  const openai = getOpenAIClient();
  if (!openai) {
    return NextResponse.json({ error: "OPENAI_API_KEY manquante" }, { status: 500 });
  }

  const runWithDocument = async () => {
    const dataUrl = `data:${file.type || "application/pdf"};base64,${base64Data}`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 4000,
    });
    return response.choices[0]?.message?.content || "";
  };

  try {
    const text = await runWithDocument();
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[OPENAI ERROR]:", error);
    return NextResponse.json({ error: "Erreur OpenAI" }, { status: 500 });
  }
}
