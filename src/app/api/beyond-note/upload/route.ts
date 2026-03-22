import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;
const PROMPT =
  "Extrait le texte du document, genere un titre et un resume court. Reponds uniquement en JSON: {\"title\":\"...\",\"summary\":\"...\",\"text\":\"...\"}.";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  console.log("[CRITICAL] Upload PDF - Analyse Gemini v1");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const sourceType = (formData.get("source_type") as string) || "import";
  const folderId = (formData.get("folder_id") as string) || null;

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");
  const originalName = file.name || "document.pdf";
  const sanitizedName = originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
  const fileExt = sanitizedName.split(".").pop() || "pdf";
  const fileExtLower = fileExt.toLowerCase();
  const timestamp = Date.now();
  const filePath = `${session.id}/${timestamp}.${fileExt}`;

  const contentType = file.type || (fileExtLower === "pdf" ? "application/pdf" : undefined);
  const { error: uploadError } = await supabase.storage
    .from("PDF_documents")
    .upload(filePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from("PDF_documents")
    .createSignedUrl(filePath, 60 * 60);
  const { data: publicData } = supabase.storage.from("PDF_documents").getPublicUrl(filePath);
  const fileUrl = signedData?.signedUrl || publicData.publicUrl;
  if (signedError) {
    console.warn("[upload] signed url error:", signedError.message);
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY manquante" },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf",
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const message = data?.error?.message || "Erreur Gemini";
      await supabase
        .from("beyond_note_documents")
        .update({
          extracted_text: "",
          extraction_status: "error",
        })
        .eq("id", doc.id);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let parsed: { title?: string; summary?: string; text?: string } = {};
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : JSON.parse(rawText);
    } catch {
      parsed = {};
    }

    const extractedText = parsed.text || rawText;
    const title = parsed.title || originalName;
    const summary = parsed.summary || "";

    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: session.id,
        file_name: originalName,
        file_url: fileUrl,
        file_type: file.type,
        file_size: file.size,
        extracted_text: extractedText,
        title,
        summary,
        source_type: sourceType,
        ...(folderId ? { folder_id: folderId } : {}),
      })
      .select()
      .single();

    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("[GEMINI ERROR]:", error);
    const message = error instanceof Error ? error.message : "Erreur Gemini";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
