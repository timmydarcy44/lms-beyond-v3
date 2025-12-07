import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Vérifier si une ressource a un PDF associé
 * GET /api/admin/check-resource-pdf?resourceId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resourceId = searchParams.get("resourceId") || "f2a961f4-bc0e-49cd-b683-ad65e834213b";

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    // Récupérer la ressource avec son PDF
    const { data: resource, error } = await supabase
      .from("resources")
      .select(`
        id,
        title,
        file_url,
        video_url,
        audio_url,
        kind,
        description
      `)
      .eq("id", resourceId)
      .maybeSingle();

    if (error) {
      console.error("[check-resource-pdf] Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!resource) {
      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier le statut du fichier
    let fileStatus = "Aucun fichier associé";
    let fileType = null;
    let fileName = null;

    if (resource.file_url) {
      fileStatus = "✅ PDF disponible";
      fileType = "PDF";
      // Extraire le nom du fichier de l'URL
      const urlParts = resource.file_url.split("/");
      fileName = urlParts[urlParts.length - 1];
    } else if (resource.video_url) {
      fileStatus = "✅ Vidéo disponible";
      fileType = "Vidéo";
      const urlParts = resource.video_url.split("/");
      fileName = urlParts[urlParts.length - 1];
    } else if (resource.audio_url) {
      fileStatus = "✅ Audio disponible";
      fileType = "Audio";
      const urlParts = resource.audio_url.split("/");
      fileName = urlParts[urlParts.length - 1];
    }

    return NextResponse.json({
      success: true,
      resource: {
        id: resource.id,
        title: resource.title,
        kind: resource.kind,
        file_url: resource.file_url,
        video_url: resource.video_url,
        audio_url: resource.audio_url,
        fileStatus,
        fileType,
        fileName,
      },
    });
  } catch (error) {
    console.error("[check-resource-pdf] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

