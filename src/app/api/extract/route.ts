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

  const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];
  let lastError = "Erreur Gemini";

  for (const modelName of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    console.log("[GEMINI] Tentative modèle: " + modelName);

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

    let data: any = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.ok) {
      console.log("[GEMINI] VICTOIRE avec " + modelName);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return NextResponse.json({ text });
    }

    const errorMessage = data?.error?.message || "Erreur Gemini";
    console.error(
      "[GEMINI] FAILED " +
        modelName +
        " Status: " +
        response.status +
        " Error: " +
        errorMessage,
    );
    lastError = `Status: ${response.status} Error: ${errorMessage}`;
  }

  return NextResponse.json({ error: lastError }, { status: 500 });
}
