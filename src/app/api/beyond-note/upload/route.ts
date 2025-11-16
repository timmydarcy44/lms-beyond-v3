import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { PDFParse } from "pdf-parse";
import { extractTextWithVision } from "@/lib/ai/openai-client";

export async function POST(request: NextRequest) {
  try {
    console.log("[beyond-note/upload] Starting upload...");
    
    const session = await getSession();
    if (!session) {
      console.error("[beyond-note/upload] No session found");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    
    if (!session.id) {
      console.error("[beyond-note/upload] Session id is missing:", session);
      return NextResponse.json({ error: "Session utilisateur invalide" }, { status: 401 });
    }
    
    console.log("[beyond-note/upload] Session found:", session.id);

    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[beyond-note/upload] Supabase not configured");
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }
    console.log("[beyond-note/upload] Supabase client created");

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("[beyond-note/upload] No file provided");
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }
    console.log("[beyond-note/upload] File received:", file.name, file.type, file.size);

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop();
    const fileName = `${session.id}/${Date.now()}.${fileExt}`;
    // Le filePath ne doit PAS inclure le nom du bucket car on utilise .from("beyond-note")
    const filePath = fileName;

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload vers Supabase Storage
    console.log("[beyond-note/upload] Uploading to storage, filePath:", filePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("beyond-note")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[beyond-note/upload] Upload error:", uploadError);
      console.error("[beyond-note/upload] Upload error message:", uploadError.message);
      console.error("[beyond-note/upload] Upload error statusCode:", uploadError.statusCode);
      
      // Si le bucket n'existe pas, retourner une erreur explicite
      if (uploadError.message?.includes("Bucket not found") || 
          uploadError.message?.includes("not found") ||
          uploadError.statusCode === "404") {
        return NextResponse.json({ 
          error: "Le bucket de stockage 'beyond-note' n'existe pas. Veuillez le créer dans Supabase Dashboard > Storage.",
          details: uploadError.message,
          statusCode: uploadError.statusCode
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: uploadError.message || "Erreur lors de l'upload",
        details: uploadError.message,
        statusCode: uploadError.statusCode
      }, { status: 500 });
    }
    console.log("[beyond-note/upload] File uploaded successfully:", uploadData);

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from("beyond-note")
      .getPublicUrl(filePath);

    // Extraire le texte du document
    let extractedText = "";
    
    if (file.type === "application/pdf") {
      try {
        // D'abord, essayer d'extraire le texte avec pdf-parse (pour les PDFs textuels)
        const pdfBuffer = Buffer.from(arrayBuffer);
        const pdfParser = new PDFParse({ data: pdfBuffer });
        let pdfData;
        try {
          pdfData = await pdfParser.getText();
        } finally {
          await pdfParser.destroy();
        }
        extractedText = pdfData.text.trim();
        
        console.log("[beyond-note/upload] PDF parsed - Pages:", pdfData.total, "Text length:", extractedText.length);
        
        // Si le texte est vide ou très court, le PDF est probablement scanné (image)
        // Utiliser OpenAI Vision OCR pour extraire le texte
        if (!extractedText || extractedText.length < 50) {
          console.warn("[beyond-note/upload] PDF text is too short or empty, trying OpenAI Vision OCR...");
          
          const ocrText = await extractTextWithVision(pdfBuffer, file.type);
          if (ocrText && ocrText.length > 0) {
            extractedText = ocrText;
            console.log("[beyond-note/upload] Text extracted using OpenAI Vision OCR, length:", extractedText.length);
          } else {
            console.warn("[beyond-note/upload] OpenAI Vision OCR did not extract any text");
            extractedText = "";
          }
        } else {
          console.log("[beyond-note/upload] PDF text extracted successfully with pdf-parse, length:", extractedText.length);
        }
      } catch (pdfError) {
        console.error("[beyond-note/upload] Error extracting PDF text:", pdfError);
        
        // En cas d'erreur avec pdf-parse, essayer OpenAI Vision OCR
        try {
          console.log("[beyond-note/upload] Trying OpenAI Vision OCR as fallback...");
          const pdfBuffer = Buffer.from(arrayBuffer);
          const ocrText = await extractTextWithVision(pdfBuffer, file.type);
          if (ocrText && ocrText.length > 0) {
            extractedText = ocrText;
            console.log("[beyond-note/upload] Text extracted using OpenAI Vision OCR (fallback), length:", extractedText.length);
          } else {
            extractedText = "";
          }
        } catch (ocrError) {
          console.error("[beyond-note/upload] Error with OpenAI Vision OCR:", ocrError);
          extractedText = "";
        }
      }
    } else if (file.type.startsWith("image/")) {
      // Pour les images, utiliser OpenAI Vision OCR
      console.log("[beyond-note/upload] Extracting text from image using OpenAI Vision OCR...");
      const ocrText = await extractTextWithVision(buffer, file.type);
      if (ocrText && ocrText.length > 0) {
        extractedText = ocrText;
        console.log("[beyond-note/upload] Text extracted from image using OpenAI Vision OCR, length:", extractedText.length);
      } else {
        console.warn("[beyond-note/upload] OpenAI Vision OCR did not extract any text from image");
        extractedText = "";
      }
    }

    // Enregistrer le document dans la base de données
    const { data: documentData, error: dbError } = await supabase
      .from("beyond_note_documents")
      .insert({
        user_id: session.id,
        file_name: file.name,
        file_path: `beyond-note/${filePath}`,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
        extracted_text: extractedText,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[beyond-note/upload] DB error:", dbError);
      // Si la table n'existe pas (code 42P01), retourner quand même l'URL
      if (dbError.code === "42P01") {
        console.warn("[beyond-note/upload] Table beyond_note_documents n'existe pas encore. Exécutez CREATE_BEYOND_NOTE_TABLES.sql");
        return NextResponse.json({
          url: urlData.publicUrl,
          extractedText,
          documentId: null,
          warning: "Table non créée - document uploadé mais non enregistré en DB",
        });
      }
      // Pour les autres erreurs DB, retourner l'erreur
      return NextResponse.json({
        error: "Erreur lors de l'enregistrement en base de données",
        details: dbError.message,
        code: dbError.code,
      }, { status: 500 });
    }

    if (!documentData || !documentData.id) {
      console.error("[beyond-note/upload] Document data is missing or has no id:", documentData);
      return NextResponse.json({
        error: "Erreur lors de l'enregistrement : données manquantes",
        url: urlData.publicUrl,
        extractedText,
        documentId: null,
      }, { status: 500 });
    }

    console.log("[beyond-note/upload] Document saved successfully:", documentData.id);

    return NextResponse.json({
      url: urlData.publicUrl,
      extractedText,
      documentId: documentData.id,
    });
  } catch (error) {
    console.error("[beyond-note/upload] Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "UnknownError";
    
    console.error("[beyond-note/upload] Error details:", { 
      errorName,
      errorMessage, 
      errorStack,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: errorMessage,
        errorName,
        ...(process.env.NODE_ENV === "development" && { 
          stack: errorStack,
          fullError: error instanceof Error ? error.toString() : String(error)
        })
      },
      { status: 500 }
    );
  }
}

