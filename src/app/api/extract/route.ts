import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

  console.log("[ANTHROPIC] Tentative avec Sonnet");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
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
              {
                type: "text",
                text:
                  "Extrait tout le texte de ce document PDF. Conserve la structure des tableaux en utilisant le format Markdown.",
              },
            ],
          },
        ],
      }),
    });

    const data = (await response.json()) as {
      content?: Array<{ type?: string; text?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      console.error("[ANTHROPIC] Error:", data?.error?.message || "Erreur Anthropic");
      return NextResponse.json(
        { error: data?.error?.message || "Erreur Anthropic" },
        { status: 500 },
      );
    }

    const text =
      data?.content?.find((item) => item.type === "text")?.text ||
      data?.content?.[0]?.text ||
      "";
    return NextResponse.json({ text });
  } catch (error) {
    console.error("[ANTHROPIC] Error:", error);
    return NextResponse.json({ error: "Erreur Anthropic" }, { status: 500 });
  }
}
