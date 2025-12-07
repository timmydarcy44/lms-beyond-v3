import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

/**
 * Upload un PDF pour une ressource
 * POST /api/upload/resource-pdf
 * Body: FormData avec:
 *   - file: File (le PDF)
 *   - resourceId: string (ID de la ressource)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est Jessica Contentin
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.email !== JESSICA_CONTENTIN_EMAIL) {
      return NextResponse.json(
        { error: "Accès non autorisé. Seul Jessica Contentin peut uploader des PDFs." },
        { status: 403 }
      );
    }

    // Récupérer le FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const resourceId = formData.get("resourceId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    if (!resourceId) {
      return NextResponse.json(
        { error: "ID de ressource manquant" },
        { status: 400 }
      );
    }

    // Vérifier que c'est un PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Le fichier doit être un PDF" },
        { status: 400 }
      );
    }

    // Vérifier que la ressource existe
    const { data: resource } = await supabase
      .from("resources")
      .select("id, title")
      .eq("id", resourceId)
      .maybeSingle();

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Convertir le fichier en buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const sanitizedTitle = resource.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .substring(0, 50);
    const fileName = `${sanitizedTitle}-${timestamp}.pdf`;
    const filePath = `Jessica CONTENTIN/${fileName}`;

    // Utiliser le service role client pour l'upload (bypass RLS)
    const serviceClient = getServiceRoleClient();
    
    // Uploader dans le bucket "Public" ou "Jessica CONTENTIN"
    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from("Public")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[upload/resource-pdf] Upload error:", uploadError);
      // Essayer avec le bucket "Jessica CONTENTIN" si "Public" échoue
      const { data: uploadData2, error: uploadError2 } = await serviceClient.storage
        .from("Jessica CONTENTIN")
        .upload(filePath, buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError2) {
        return NextResponse.json(
          { error: `Erreur lors de l'upload: ${uploadError2.message}` },
          { status: 500 }
        );
      }

      // Construire l'URL publique
      const { data: { publicUrl } } = serviceClient.storage
        .from("Jessica CONTENTIN")
        .getPublicUrl(filePath);

      // Mettre à jour la ressource avec l'URL du PDF
      const { error: updateError } = await serviceClient
        .from("resources")
        .update({ file_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", resourceId);

      if (updateError) {
        console.error("[upload/resource-pdf] Update error:", updateError);
        return NextResponse.json(
          { error: `Erreur lors de la mise à jour: ${updateError.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        fileUrl: publicUrl,
        message: "PDF uploadé avec succès",
      });
    }

    // Construire l'URL publique
    const { data: { publicUrl } } = serviceClient.storage
      .from("Public")
      .getPublicUrl(filePath);

    // Mettre à jour la ressource avec l'URL du PDF
    const { error: updateError } = await serviceClient
      .from("resources")
      .update({ file_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", resourceId);

    if (updateError) {
      console.error("[upload/resource-pdf] Update error:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      message: "PDF uploadé avec succès",
    });
  } catch (error) {
    console.error("[upload/resource-pdf] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

