import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const runWithDocument = async () => {
    console.log("[ANTHROPIC] Tentative avec Sonnet");
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64Data,
              },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    });
    console.log("[ANTHROPIC] Response:", response);
    return response;
  };

  const runWithText = async (text: string) => {
    console.log("[ANTHROPIC] Tentative fallback texte");
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: `${PROMPT}\n\nContenu:\n${text}` }],
        },
      ],
    });
    console.log("[ANTHROPIC] Response:", response);
    return response;
  };

  try {
    const response = await runWithDocument();
    const text =
      response.content?.find((item) => item.type === "text")?.text ||
      response.content?.[0]?.text ||
      "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[ANTHROPIC ERROR]:", error);
  }

  try {
    const { default: pdfParse } = await import("pdf-parse");
    const parsed = await pdfParse(buffer);
    const response = await runWithText(parsed?.text || "");
    const text =
      response.content?.find((item) => item.type === "text")?.text ||
      response.content?.[0]?.text ||
      "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[ANTHROPIC ERROR]:", error);
    return NextResponse.json({ error: "Erreur Anthropic" }, { status: 500 });
  }
}
