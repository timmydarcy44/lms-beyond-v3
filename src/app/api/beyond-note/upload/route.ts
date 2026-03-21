import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;

const PROMPT = "Extrait uniquement le texte brut du PDF, sans ajout ni reformulation.";

const getTextFromResponse = (response: Anthropic.Messages.Message) => {
  const textBlock = response.content?.find((item) => item.type === "text") as
    | { text?: string }
    | undefined;
  const firstBlock = response.content?.[0] as { text?: string } | undefined;
  return textBlock?.text || firstBlock?.text || "";
};

export async function POST(request: NextRequest) {
  console.log("Clé Anthropic présente:", !!process.env.ANTHROPIC_API_KEY);
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

  console.log("[CRITICAL] Route Upload recréée - Tentative Anthropic");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });

  const sourceType = (formData.get("source_type") as string) || "import";
  const folderId = (formData.get("folder_id") as string) || null;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString("base64");

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante" }, { status: 500 });
  }

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

  const anthropic = new Anthropic({ apiKey });

  const extractFromDocument = async () => {
    console.log("[ANTHROPIC] Tentative avec Sonnet");
    console.log("[ANTHROPIC] Envoi du PDF natif...");
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

  const { data: doc, error: dbError } = await supabase
    .from("beyond_note_documents")
    .insert({
      user_id: session.id,
      file_name: originalName,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      extracted_text: "Extraction en cours...",
      extraction_status: "pending",
      source_type: sourceType,
      ...(folderId ? { folder_id: folderId } : {}),
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  try {
    const response = await extractFromDocument();
    const extractedText = getTextFromResponse(response);
    const { data: updatedDoc, error: updateError } = await supabase
      .from("beyond_note_documents")
      .update({
        extracted_text: extractedText || "",
        extraction_status: extractedText ? "done" : "pending",
      })
      .eq("id", doc.id)
      .select()
      .single();

    if (updateError) {
      console.error("[ANTHROPIC ERROR]:", updateError);
      return NextResponse.json({ success: true, document: doc });
    }

    return NextResponse.json({ success: true, document: updatedDoc });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur Anthropic";
    console.error("[ANTHROPIC ERROR]:", error);
    await supabase
      .from("beyond_note_documents")
      .update({
        extracted_text: `ERREUR CLAUDE: ${message}`,
        extraction_status: "error",
      })
      .eq("id", doc.id);
    return NextResponse.json({ success: true, document: doc });
  }
}
