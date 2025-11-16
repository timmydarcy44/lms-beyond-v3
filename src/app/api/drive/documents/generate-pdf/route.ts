import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { generatePdfForDocument } from "./generate-pdf-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;
    const body = await request.json();
    const { documentId, htmlContent, title } = body;

    if (!documentId || !htmlContent || !title) {
      return NextResponse.json(
        { error: "documentId, htmlContent et title sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est bien l'auteur du document
    const { data: document, error: docError } = await supabase
      .from("drive_documents")
      .select("author_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    if (document.author_id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Générer le PDF en utilisant la fonction utilitaire
    console.log("[drive/documents/generate-pdf] Generating PDF for document:", documentId);
    const fileUrl = await generatePdfForDocument({
      documentId,
      htmlContent,
      title,
      userId,
      supabase,
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      documentId,
    });
  } catch (error) {
    console.error("[drive/documents/generate-pdf] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

