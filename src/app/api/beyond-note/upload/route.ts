import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non authentifie" }, { status: 401 });

  const userId = session.id;
  if (!userId) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

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
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.${fileExt}`;
  console.log("[upload] sanitized path:", filePath);

  const fileExtLower = fileExt.toLowerCase();
  const contentType = file.type || (fileExtLower === "pdf" ? "application/pdf" : undefined);
  const { error: uploadError } = await supabase.storage
    .from("beyond-note")
    .upload(filePath, buffer, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("beyond-note").getPublicUrl(filePath);

  let extractedText = "";

  const isImage =
    file.type?.startsWith("image/") ||
    ["jpg", "jpeg", "png", "webp", "gif"].includes(fileExtLower);
  if (isImage) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const base64 = buffer.toString("base64");
        console.log("[Anthropic Request] Sending request with model: claude-3-5-sonnet-latest");
        console.log("[DEPLOYMENT_CHECK] Model is now LATEST");
        console.log("[DEBUG API] Request body sent to Anthropic");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-latest",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extrait tout le texte visible dans cette image. Reponds uniquement avec le texte extrait, sans introduction.",
                  },
                  {
                    type: "image",
                    source: {
                      type: "base64",
                      media_type: file.type || "image/jpeg",
                      data: base64,
                    },
                  },
                ],
              },
            ],
          }),
        });

        const data = await res.json();
        extractedText = data?.content?.[0]?.text || "";
      } catch (e) {
        console.error("[upload] Claude Vision error:", e);
      }
    }
    if (!extractedText) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        try {
          const base64 = buffer.toString("base64");
          const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`;
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text:
                        "Extrait tout le texte visible dans cette image. " +
                        "Si une partie est illisible, remplace-la par [...]. " +
                        "Reponds uniquement avec le texte extrait, sans introduction.",
                    },
                    { type: "image_url", image_url: { url: dataUrl } },
                  ],
                },
              ],
              max_tokens: 4096,
            }),
          });
          const data = await res.json();
          if (res.ok) {
            extractedText = data?.choices?.[0]?.message?.content || "";
          }
        } catch (e) {
          console.error("[upload] OpenAI Vision error:", e);
        }
      }
    }
  }

  const isPdf = file.type?.includes("pdf") || fileExtLower === "pdf";
  if (!extractedText && isPdf) {
    let claudePdfAttempted = false;
    let claudePdfOk = false;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const base64 = buffer.toString("base64");
        claudePdfAttempted = true;
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "document",
                    source: {
                      type: "base64",
                      media_type: "application/pdf",
                      data: base64,
                    },
                  },
                  {
                    type: "text",
                    text:
                      "Extrait tout le texte visible dans ce PDF. " +
                      "Garde la structure et ne renvoie que le texte extrait.",
                  },
                ],
              },
            ],
          }),
        });

        const data = await res.json();
        console.log("[Claude Debug]", JSON.stringify(data));
        console.log("[Anthropic Debug] Status:", res.status, "Error:", JSON.stringify(data?.error));
        if (!res.ok) {
          const apiMessage = data?.error?.message || "Erreur inconnue";
          return NextResponse.json(
            { error: `Error from Anthropic: ${apiMessage}`, code: "ANTHROPIC_ERROR" },
            { status: res.status || 502 },
          );
        }
        claudePdfOk = true;
        extractedText = data?.content?.[0]?.text || "";
      } catch (e) {
        console.error("[upload] claude pdf error:", e);
      }
    }
    if (claudePdfAttempted && claudePdfOk && !extractedText) {
      return NextResponse.json(
        { error: "PDF non lisible.", code: "EXTRACTION_FAILED" },
        { status: 422 },
      );
    }
    if (!claudePdfAttempted) {
      return NextResponse.json(
        { error: "Error from Anthropic: Missing API key", code: "ANTHROPIC_ERROR" },
        { status: 500 },
      );
    }
  }

  const isDocx =
    file.type?.includes("wordprocessingml.document") || fileExtLower === "docx";

  if (!extractedText && (isPdf || isDocx)) {
    console.error("[upload] extraction failed", {
      name: originalName,
      type: file.type,
      ext: fileExt,
    });
    const errorMessage = isPdf
      ? "Error from Anthropic: Request failed"
      : "Extraction impossible pour ce fichier.";
    return NextResponse.json(
      { error: errorMessage, code: "EXTRACTION_FAILED" },
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
