import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;

const extractWithGemini = async (prompt: string, mimeType: string, base64: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY manquante");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent([
    { text: prompt },
    { inlineData: { data: base64, mimeType } },
  ]);
  return result.response.text() || "";
};

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const userId = session.id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  console.log("[DEBUG] API Route hit by userId:", userId);

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configure" }, { status: 500 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const sourceType = (formData.get("source_type") as string) || "import";
  console.log("[upload] file received:", {
    name: file.name,
    type: file.type,
    size: file.size,
    sourceType,
  });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const originalName = file.name || "photo.jpg";
  const sanitizedName = originalName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
  const fileExt = sanitizedName.split(".").pop() || "jpg";
  const fileExtLower = fileExt.toLowerCase();
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.${fileExt}`;
  console.log("[upload] sanitized path:", filePath);

  const contentType = file.type || (fileExtLower === "pdf" ? "application/pdf" : undefined);
  const { error: uploadError } = await supabase.storage
    .from("beyond-note")
    .upload(filePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("beyond-note").getPublicUrl(filePath);

  let extractedText = "";
  const isPdf = file.type?.includes("pdf") || fileExtLower === "pdf";

  try {
    const base64 = buffer.toString("base64");
    const mimeType = isPdf
      ? "application/pdf"
      : file.type || "application/octet-stream";
    const prompt = isPdf
      ? "Extrait tout le texte visible, garde la structure, et ne renvoie que le texte extrait."
      : "Extrait tout le texte visible dans cette image, garde la structure, et ne renvoie que le texte extrait.";
    extractedText = await extractWithGemini(prompt, mimeType, base64);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Gemini";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!extractedText) {
    return NextResponse.json(
      { error: "Extraction impossible pour ce fichier.", code: "EXTRACTION_FAILED" },
      { status: 422 },
    );
  }

  const { data: doc, error: dbError } = await supabase
    .from("beyond_note_documents")
    .insert({
      user_id: userId,
      file_name: originalName,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      extracted_text: extractedText || null,
      extraction_status: extractedText ? "done" : "pending",
      source_type: sourceType,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true, document: doc });
}
