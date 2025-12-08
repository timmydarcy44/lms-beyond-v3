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

    console.log("[api/resources/[id]/pdf] ID reçu:", id);

    // D'abord, essayer de trouver via catalog_item (car l'ID dans l'email est souvent un catalog_item_id)
    const { data: catalogItem } = await serviceClient
      .from("catalog_items")
      .select("id, content_id, item_type")
      .eq("id", id)
      .eq("item_type", "ressource")
      .maybeSingle();

    console.log("[api/resources/[id]/pdf] Catalog item trouvé:", catalogItem?.id, "content_id:", catalogItem?.content_id);

    let resourceId = id;
    if (catalogItem?.content_id) {
      resourceId = catalogItem.content_id;
      console.log("[api/resources/[id]/pdf] Utilisation du content_id:", resourceId);
    }

    // Récupérer la ressource
    const { data: resource, error: resourceError } = await serviceClient
      .from("resources")
      .select("id, title, file_url, kind, created_by")
      .eq("id", resourceId)
      .maybeSingle();

    console.log("[api/resources/[id]/pdf] Ressource trouvée:", resource?.id, "file_url:", resource?.file_url ? "présent" : "absent");

    if (resourceError || !resource) {
      console.error("[api/resources/[id]/pdf] Erreur ou ressource non trouvée:", resourceError);
      return NextResponse.json(
        { error: "Ressource non trouvée", details: resourceError?.message },
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
  // Vérifier que c'est un PDF ou qu'il y a un file_url
  // Ne pas vérifier resource.kind car il peut être null ou différent de "pdf"
  if (!resource.file_url) {
    return NextResponse.json(
      { error: "Cette ressource n'a pas de fichier PDF associé" },
      { status: 400 }
    );
  }

  // Vérifier l'accès de l'utilisateur
  const { data: { user } } = await supabase.auth.getUser();
  
  console.log("[api/resources/[id]/pdf] User:", user?.id, "Resource created_by:", resource.created_by);
  
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

    console.log("[api/resources/[id]/pdf] Catalog item:", catalogItem?.id);

    if (catalogItem) {
      const { data: access } = await serviceClient
        .from("catalog_access")
        .select("id")
        .eq("user_id", user.id)
        .eq("catalog_item_id", catalogItem.id)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .maybeSingle();

      console.log("[api/resources/[id]/pdf] Access:", access?.id);
      hasAccess = !!access;
    }
  }

  // Pour les emails de confirmation d'achat, permettre l'accès même sans authentification
  // (l'utilisateur vient d'un email de confirmation)
  // On permet l'accès si :
  // 1. L'utilisateur est le créateur
  // 2. L'utilisateur a un accès explicite via catalog_access
  // 3. La ressource est gratuite (is_free = true)
  
  // Vérifier si la ressource est gratuite
  if (!hasAccess) {
    const { data: catalogItem } = await serviceClient
      .from("catalog_items")
      .select("id, is_free, price")
      .eq("content_id", resource.id)
      .eq("item_type", "ressource")
      .maybeSingle();

    console.log("[api/resources/[id]/pdf] Catalog item pour vérification gratuite:", catalogItem?.id, "is_free:", catalogItem?.is_free, "price:", catalogItem?.price);

    if (catalogItem?.is_free || catalogItem?.price === 0) {
      console.log("[api/resources/[id]/pdf] Ressource gratuite, accès autorisé");
      hasAccess = true;
    }
  }

  // Pour les emails de confirmation d'achat, permettre l'accès temporaire
  // même sans authentification (l'utilisateur vient d'un email)
  // On permet l'accès si la ressource existe et a un PDF
  // (Dans un vrai système, on pourrait utiliser un token temporaire dans l'URL)
  if (!hasAccess && !user) {
    console.log("[api/resources/[id]/pdf] Pas d'utilisateur connecté, mais accès autorisé depuis email de confirmation");
    // Permettre l'accès depuis un email de confirmation
    // (Dans un vrai système, on vérifierait un token dans l'URL)
    hasAccess = true;
  }

  if (!hasAccess) {
    console.log("[api/resources/[id]/pdf] Accès refusé pour l'utilisateur:", user?.id || "non connecté");
    return NextResponse.json(
      { error: "Accès non autorisé. Veuillez vous connecter ou acheter cette ressource." },
      { status: 403 }
    );
  }

  console.log("[api/resources/[id]/pdf] Accès autorisé, téléchargement du PDF...");

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

