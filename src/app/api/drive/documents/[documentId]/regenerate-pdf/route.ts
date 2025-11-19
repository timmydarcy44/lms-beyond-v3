import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { generatePdfForDocument } from "../../generate-pdf/generate-pdf-utils";
import { getFormateurLearners } from "@/lib/queries/formateur";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const supabase = await getServerClient();
    
    if (!supabase) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = authData.user.id;

    // Utiliser le service role client pour récupérer le document
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Service role client non disponible" }, { status: 500 });
    }

    // Récupérer le document
    const { data: document, error: docError } = await serviceClient
      .from("drive_documents")
      .select("id, title, content, author_id, status, shared_with")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès au document
    // 1. Si c'est l'auteur
    // 2. Si c'est un formateur et que l'auteur est un de ses apprenants
    // 3. Si le document est partagé avec l'utilisateur
    const isAuthor = document.author_id === userId;
    const isSharedWith = document.shared_with === userId && document.status === "shared";
    
    // Vérifier si l'utilisateur est formateur et que l'auteur est un de ses apprenants
    let isFormateurWithAccess = false;
    if (!isAuthor && !isSharedWith) {
      const learners = await getFormateurLearners();
      const learnerIds = learners.map((l) => l.id);
      isFormateurWithAccess = learnerIds.includes(document.author_id) && document.status === "shared";
    }

    if (!isAuthor && !isSharedWith && !isFormateurWithAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    console.log("[drive/documents/[documentId]/regenerate-pdf] Document found:", {
      id: document.id,
      title: document.title,
      hasContent: !!document.content,
      contentLength: document.content?.length || 0,
      status: document.status,
      authorId: document.author_id,
    });

    if (!document.content || document.content.trim().length === 0) {
      console.error("[drive/documents/[documentId]/regenerate-pdf] Document has no content");
      return NextResponse.json({ 
        error: "Document incomplet", 
        details: "Le document n'a pas de contenu. Impossible de générer un PDF sans contenu." 
      }, { status: 400 });
    }

    if (!document.title || document.title.trim().length === 0) {
      console.error("[drive/documents/[documentId]/regenerate-pdf] Document has no title");
      return NextResponse.json({ 
        error: "Document incomplet", 
        details: "Le document n'a pas de titre. Impossible de générer un PDF sans titre." 
      }, { status: 400 });
    }

    // Générer le PDF en utilisant le service role client
    console.log("[drive/documents/[documentId]/regenerate-pdf] Regenerating PDF for document:", documentId);
    const fileUrl = await generatePdfForDocument({
      documentId: document.id,
      htmlContent: document.content,
      title: document.title,
      userId: document.author_id,
      supabase: serviceClient as any,
      skipAuthCheck: true, // Bypasser la vérification car on utilise le service role client
    });

    return NextResponse.json({
      success: true,
      fileUrl,
      documentId: document.id,
    });
  } catch (error) {
    console.error("[drive/documents/[documentId]/regenerate-pdf] Unexpected error:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la régénération du PDF", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

