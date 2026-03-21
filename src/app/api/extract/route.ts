import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Extrait le texte de ce PDF." },
              { inlineData: { mimeType: "application/pdf", data: base64Data } },
            ],
          },
        ],
      }),
    },
  );

  console.log("[GEMINI] Payload sent to V1 Stable");

  if (!response.ok) {
    const errorBody = await response.text();
    return NextResponse.json({ error: errorBody || "Erreur Gemini" }, { status: 500 });
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return NextResponse.json({ text });
}
