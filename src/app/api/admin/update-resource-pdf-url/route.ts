import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

/**
 * Mettre à jour manuellement l'URL du PDF pour une ressource
 * POST /api/admin/update-resource-pdf-url
 * Body: { resourceId: string, fileUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceId, fileUrl } = body;

    if (!resourceId || !fileUrl) {
      return NextResponse.json(
        { error: "resourceId et fileUrl sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase client unavailable" },
        { status: 500 }
      );
    }

    // Vérifier que la ressource existe
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, title")
      .eq("id", resourceId)
      .maybeSingle();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    // Mettre à jour l'URL du PDF
    const { error: updateError } = await supabase
      .from("resources")
      .update({
        file_url: fileUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resourceId);

    if (updateError) {
      console.error("[update-resource-pdf-url] Erreur lors de la mise à jour:", updateError);
      return NextResponse.json(
        { error: `Erreur lors de la mise à jour: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Vérifier la mise à jour
    const { data: updatedResource } = await supabase
      .from("resources")
      .select("id, title, file_url")
      .eq("id", resourceId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: "URL du PDF mise à jour avec succès",
      resource: updatedResource,
    });
  } catch (error) {
    console.error("[update-resource-pdf-url] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

