import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resourceTitle, email } = body;

    if (!resourceTitle) {
      return NextResponse.json(
        { error: "resourceTitle est requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    // Chercher la ressource par titre
    const { data: resource, error: resourceError } = await supabase
      .from("resources")
      .select("id, title, description, price, file_url, kind")
      .ilike("title", `%${resourceTitle}%`)
      .maybeSingle();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: `Ressource "${resourceTitle}" non trouvée` },
        { status: 404 }
      );
    }

    // Vérifier que c'est un PDF
    if (resource.kind !== "pdf" || !resource.file_url) {
      return NextResponse.json(
        { error: "Cette ressource n'a pas de PDF associé" },
        { status: 400 }
      );
    }

    // Récupérer le catalog_item pour obtenir le prix
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, price")
      .eq("content_id", resource.id)
      .eq("item_type", "ressource")
      .maybeSingle();

    const price = catalogItem?.price || resource.price || 0;

    // Utiliser l'URL proxy via notre domaine au lieu de l'URL Supabase directe
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
    const resourceId = catalogItem?.id || resource.id;
    const pdfProxyUrl = `${baseUrl}/api/resources/${resourceId}/pdf`;

    // Envoyer l'email avec le lien proxy vers le PDF
    const result = await sendPurchaseConfirmationEmail(
      email || "timmydarcy44@gmail.com",
      "Timmy",
      resource.title,
      price,
      new Date().toLocaleDateString("fr-FR"),
      pdfProxyUrl // Lien proxy vers le PDF (masque l'URL Supabase)
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Email envoyé avec succès",
        resource: {
          title: resource.title,
          pdfProxyUrl: pdfProxyUrl, // URL proxy utilisée dans l'email
          pdfUrl: resource.file_url, // URL Supabase originale (pour référence)
          price: price,
        },
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Erreur lors de l'envoi de l'email",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[admin/resend-resource-email] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

