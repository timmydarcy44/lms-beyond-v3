import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Route proxy pour servir les PDFs via notre domaine
 * Exemple: /api/resources/[id]/pdf
 * 
 * Cette route :
 * 1. Vérifie que l'utilisateur a accès à la ressource
 * 2. Récupère le PDF depuis Supabase Storage
 * 3. Le sert via notre domaine (sans exposer l'URL Supabase)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "ID de ressource requis" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    const serviceClient = getServiceRoleClient();
    
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service non disponible" },
        { status: 500 }
      );
    }

    // Récupérer la ressource
    const { data: resource, error: resourceError } = await serviceClient
      .from("resources")
      .select("id, title, file_url, kind, created_by")
      .eq("id", id)
      .maybeSingle();

    if (resourceError || !resource) {
      // Essayer de trouver via catalog_item
      const { data: catalogItem } = await serviceClient
        .from("catalog_items")
        .select("content_id, item_type")
        .eq("id", id)
        .eq("item_type", "ressource")
        .maybeSingle();

      if (catalogItem?.content_id) {
        const { data: resourceByCatalog } = await serviceClient
          .from("resources")
          .select("id, title, file_url, kind, created_by")
          .eq("id", catalogItem.content_id)
          .maybeSingle();

        if (resourceByCatalog) {
          return await servePdf(resourceByCatalog, supabase, serviceClient);
        }
      }

      return NextResponse.json(
        { error: "Ressource non trouvée" },
        { status: 404 }
      );
    }

    return await servePdf(resource, supabase, serviceClient);
  } catch (error) {
    console.error("[api/resources/[id]/pdf] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function servePdf(
  resource: { id: string; title: string; file_url: string | null; kind: string | null; created_by: string | null },
  supabase: any,
  serviceClient: any
) {
  // Vérifier que c'est un PDF
  if (resource.kind !== "pdf" || !resource.file_url) {
    return NextResponse.json(
      { error: "Cette ressource n'est pas un PDF" },
      { status: 400 }
    );
  }

  // Vérifier l'accès de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser();
  
  // Si l'utilisateur est le créateur, accès garanti
  const isCreator = user?.id && resource.created_by && String(user.id) === String(resource.created_by);
  
  // Vérifier l'accès via catalog_access
  let hasAccess = isCreator;
  
  if (!hasAccess && user?.id) {
    const { data: catalogItem } = await serviceClient
      .from("catalog_items")
      .select("id")
      .eq("content_id", resource.id)
      .eq("item_type", "ressource")
      .maybeSingle();

    if (catalogItem) {
      const { data: access } = await serviceClient
        .from("catalog_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("catalog_item_id", catalogItem.id)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .maybeSingle();

      hasAccess = !!access;
    }
  }

  // Pour les ressources publiques ou si l'utilisateur a accès
  // (Vous pouvez ajuster cette logique selon vos besoins)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Accès non autorisé" },
      { status: 403 }
    );
  }

  // Extraire le chemin du fichier depuis l'URL Supabase
  // Exemple: https://xxx.supabase.co/storage/v1/object/public/pdfs/filename.pdf
  // -> pdfs/filename.pdf
  const urlMatch = resource.file_url.match(/\/storage\/v1\/object\/public\/(.+)$/);
  
  if (!urlMatch) {
    return NextResponse.json(
      { error: "URL de PDF invalide" },
      { status: 400 }
    );
  }

  const filePath = urlMatch[1];
  const bucketName = filePath.split("/")[0];
  const fileName = filePath.split("/").slice(1).join("/");

  // Télécharger le PDF depuis Supabase Storage
  const { data: pdfData, error: downloadError } = await serviceClient.storage
    .from(bucketName)
    .download(fileName);

  if (downloadError || !pdfData) {
    console.error("[api/resources/[id]/pdf] Erreur téléchargement:", downloadError);
    return NextResponse.json(
      { error: "Erreur lors du téléchargement du PDF" },
      { status: 500 }
    );
  }

  // Convertir en ArrayBuffer
  const arrayBuffer = await pdfData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Servir le PDF avec les bons headers
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${resource.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

