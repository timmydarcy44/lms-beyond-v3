import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { estimateAIUsageScore } from "@/lib/drive/ai-usage";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
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
    const { documentId } = await params;
    const body = await request.json();
    const { status, title, content } = body;

    // Vérifier que l'utilisateur est bien l'auteur du document
    const { data: document, error: docError } = await supabase
      .from("drive_documents")
      .select("author_id, status")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    if (document.author_id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Si le document est partagé, trouver l'ID du formateur
    let sharedWith: string | null = null;
    if (status === "shared") {
      // Récupérer toutes les organisations de l'apprenant
      const { data: learnerMemberships } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", userId)
        .eq("role", "learner");

      if (learnerMemberships && learnerMemberships.length > 0) {
        const orgIds = learnerMemberships.map(m => m.org_id);
        
        // Trouver un formateur dans ces organisations
        const { data: instructorMemberships } = await supabase
          .from("org_memberships")
          .select("user_id")
          .in("org_id", orgIds)
          .eq("role", "instructor")
          .limit(1)
          .maybeSingle();

        if (instructorMemberships?.user_id) {
          sharedWith = instructorMemberships.user_id;
        }
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;
      updateData.shared_with = sharedWith;
      if (status === "shared" && !(document as any).submitted_at) {
        updateData.submitted_at = new Date().toISOString();
      }
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (content !== undefined) {
      updateData.content = content;
      // Recalculer le nombre de mots
      const wordCount = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
      updateData.word_count = wordCount;
      updateData.ai_usage_score = estimateAIUsageScore(content);
    }

    const { data: updatedDocument, error: updateError } = await supabase
      .from("drive_documents")
      .update(updateData)
      .eq("id", documentId)
      .select("id, title, status, shared_with, content")
      .single();

    if (updateError || !updatedDocument) {
      console.error("[drive/documents/[documentId]] Error updating document:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise à jour", details: updateError?.message },
        { status: 500 }
      );
    }

    // Si le document est maintenant partagé et qu'il n'a pas encore de PDF, générer le PDF
    // IMPORTANT: On génère le PDF de manière synchrone pour s'assurer qu'il est créé
    if (status === "shared" && updatedDocument.id && updatedDocument.content) {
      console.log("[drive/documents/PATCH] Document is now shared, generating PDF synchronously for:", updatedDocument.id);
      try {
        // Utiliser le service role client pour bypass RLS
        const { getServiceRoleClient } = await import("@/lib/supabase/server");
        const serviceClient = getServiceRoleClient();
        if (!serviceClient) {
          console.error("[drive/documents/PATCH] Service role client not available for PDF generation");
        } else {
          // Importer et appeler directement la fonction de génération PDF
          const { generatePdfForDocument } = await import("@/app/api/drive/documents/generate-pdf/generate-pdf-utils");
          
          console.log("[drive/documents/PATCH] Starting PDF generation for document:", updatedDocument.id, "title:", updatedDocument.title || title || "Document");
          await generatePdfForDocument({
            documentId: updatedDocument.id,
            htmlContent: updatedDocument.content,
            title: updatedDocument.title || title || "Document",
            userId,
            supabase: serviceClient as any, // Utiliser le service role client
            skipAuthCheck: true, // Bypasser la vérification d'autorisation
          });
          console.log("[drive/documents/PATCH] PDF generated successfully for document:", updatedDocument.id);
        }
      } catch (pdfError) {
        console.error("[drive/documents/PATCH] Error generating PDF for document:", updatedDocument.id, {
          error: pdfError,
          message: pdfError instanceof Error ? pdfError.message : String(pdfError),
          stack: pdfError instanceof Error ? pdfError.stack : undefined,
        });
        // Ne pas échouer la mise à jour si la génération PDF échoue
        // Le PDF pourra être régénéré plus tard via l'endpoint de régénération
      }
    } else {
      console.log("[drive/documents/PATCH] Document is not shared or missing content, skipping PDF generation. Status:", status, "Has content:", !!updatedDocument.content);
    }

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    });
  } catch (error) {
    console.error("[drive/documents/[documentId]] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}



