import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;
const PROMPT =
  "Extrait tout le texte de ce document PDF en gardant la structure Markdown et les tableaux.";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  console.log("[CRITICAL] Route Upload recréée - Extraction Gemini");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const sourceType = (formData.get("source_type") as string) || "import";
  const folderId = (formData.get("folder_id") as string) || null;

  const base64Data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const buffer = Buffer.from(base64Data, "base64");
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
    .from("beyond-note")
    .upload(filePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("beyond-note").getPublicUrl(filePath);

  let extractedText = "Extraction en cours...";
  let extractionStatus: "done" | "error" | "pending" = "pending";

  const { data: doc, error: dbError } = await supabase
    .from("beyond_note_documents")
    .insert({
      user_id: session.id,
      file_name: originalName,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      extracted_text: extractedText,
      extraction_status: extractionStatus,
      source_type: sourceType,
      ...(folderId ? { folder_id: folderId } : {}),
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY manquante");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel(
      { model: "gemini-1.5-flash" },
      { apiVersion: "v1" },
    );

    const result = await model.generateContent([
      "Extraits tout le texte de ce document PDF de manière structurée.",
      {
        inlineData: {
          data: base64Data,
          mimeType: "application/pdf",
        },
      },
    ]);
    const text = result.response.text() || "";
    await supabase
      .from("beyond_note_documents")
      .update({
        extracted_text: text || "",
        extraction_status: text ? "done" : "error",
      })
      .eq("id", doc.id);
  } catch (error) {
    console.error("[GEMINI ERROR]:", error);
    await supabase
      .from("beyond_note_documents")
      .update({
        extracted_text: "",
        extraction_status: "error",
      })
      .eq("id", doc.id);
  }

  return NextResponse.json({ success: true, document: doc });
}
