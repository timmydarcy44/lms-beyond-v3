import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { generatePdfForDocument } from "../generate-pdf/generate-pdf-utils";

/**
 * API route pour régénérer les PDFs manquants pour les documents partagés
 * Usage: POST /api/drive/documents/regenerate-pdfs
 * Body: { documentIds?: string[] } (optionnel, si non fourni, régénère tous les documents partagés sans PDF)
 */
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

    // Vérifier que l'utilisateur est admin ou super admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { documentIds } = body;

    // Utiliser le service role client pour bypass RLS
    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "Service role client non disponible" }, { status: 500 });
    }

    // Récupérer les documents à régénérer
    let documents;
    
    if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
      // Récupérer les documents spécifiés
      const { data, error } = await serviceClient
        .from("drive_documents")
        .select("id, title, content, author_id, file_url, status")
        .eq("status", "shared")
        .in("id", documentIds);
      
      if (error) {
        throw error;
      }
      documents = data;
    } else {
      // Récupérer tous les documents partagés sans PDF
      const { data, error } = await serviceClient
        .from("drive_documents")
        .select("id, title, content, author_id, file_url, status")
        .eq("status", "shared")
        .is("file_url", null);
      
      if (error) {
        throw error;
      }
      documents = data;
    }


    if (!documents || documents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun document à régénérer",
        processed: 0,
        succeeded: 0,
        failed: 0,
      });
    }

    console.log(`[regenerate-pdfs] Found ${documents.length} documents to regenerate`);

    const results = {
      processed: 0,
      succeeded: [] as string[],
      failed: [] as Array<{ id: string; error: string }>,
    };

    // Régénérer les PDFs un par un
    for (const doc of documents) {
      if (!doc.content || !doc.title) {
        console.warn(`[regenerate-pdfs] Skipping document ${doc.id}: missing content or title`);
        results.failed.push({
          id: doc.id,
          error: "Contenu ou titre manquant",
        });
        continue;
      }

      try {
        console.log(`[regenerate-pdfs] Regenerating PDF for document ${doc.id}: ${doc.title}`);
        
        // Utiliser le service role client avec skipAuthCheck pour bypasser la vérification d'autorisation
        await generatePdfForDocument({
          documentId: doc.id,
          htmlContent: doc.content,
          title: doc.title,
          userId: doc.author_id,
          supabase: serviceClient as any,
          skipAuthCheck: true, // Bypasser la vérification car on utilise le service role client
        });

        results.succeeded.push(doc.id);
        console.log(`[regenerate-pdfs] Successfully regenerated PDF for document ${doc.id}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[regenerate-pdfs] Error regenerating PDF for document ${doc.id}:`, errorMessage);
        results.failed.push({
          id: doc.id,
          error: errorMessage,
        });
      }

      results.processed++;
    }

    return NextResponse.json({
      success: true,
      message: `Traitement terminé: ${results.succeeded.length} réussis, ${results.failed.length} échoués`,
      ...results,
    });
  } catch (error) {
    console.error("[regenerate-pdfs] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

