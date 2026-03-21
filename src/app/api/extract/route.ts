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

  const models = ["gemini-2.0-flash-exp", "gemini-2.0-flash", "gemini-1.5-flash"];
  let lastError = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log("Full URL called:", url.replace(apiKey, "HIDDEN"));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "Extrait le texte de ce PDF." },
              { inline_data: { mime_type: "application/pdf", data: base64Data } },
            ],
          },
        ],
      }),
    });

    console.log("[GEMINI] Payload sent to V1 Stable");

    if (!response.ok) {
      lastError = await response.text();
      continue;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("[GEMINI] Model success:", model);
    return NextResponse.json({ text });
  }

  return NextResponse.json({ error: lastError || "Erreur Gemini" }, { status: 500 });
}
