import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  console.log("[CRITICAL] Upload PDF - Analyse Gemini v1");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
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
  console.log("UPLOAD_OK");

  const { data: signedData, error: signedError } = await supabase.storage
    .from("PDF_documents")
    .createSignedUrl(filePath, 60 * 60);
  const { data: publicData } = supabase.storage.from("PDF_documents").getPublicUrl(filePath);
  const fileUrl = signedData?.signedUrl || publicData.publicUrl;
  if (signedError) {
    console.warn("[upload] signed url error:", signedError.message);
  }

  const { data: doc, error: dbError } = await supabase
    .from("beyond_note_documents")
    .insert({
      title: originalName,
      summary: "Analyse désactivée pour maintenance",
      content: "Texte non extrait",
      status: "success",
      user_id: session.id,
      file_url: fileUrl,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  console.log("DB_OK");
  return NextResponse.json({ success: true, document: doc });
}
