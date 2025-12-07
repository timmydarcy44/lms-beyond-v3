import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

/**
 * Route de test pour simuler un achat et envoyer l'email de confirmation
 * 
 * Usage:
 * POST /api/test/simulate-purchase
 * Body: { email: "user@example.com", catalogItemId: "xxx" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, catalogItemId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email est requis" },
        { status: 400 }
      );
    }

    if (!catalogItemId) {
      return NextResponse.json(
        { error: "catalogItemId est requis" },
        { status: 400 }
      );
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service non disponible" },
        { status: 500 }
      );
    }

    // Trouver l'utilisateur
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: `Erreur lors de la recherche de l'utilisateur: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: `Utilisateur non trouvé avec l'email: ${email}` },
        { status: 404 }
      );
    }

    // Vérifier que le catalog_item existe
    const { data: catalogItem, error: catalogItemError } = await serviceClient
      .from("catalog_items")
      .select("id, title, item_type, content_id, price, is_free")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (catalogItemError) {
      return NextResponse.json(
        { error: `Erreur lors de la recherche du catalog_item: ${catalogItemError.message}` },
        { status: 500 }
      );
    }

    if (!catalogItem) {
      return NextResponse.json(
        { error: `Catalog item non trouvé avec l'ID: ${catalogItemId}` },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà accès
    const { data: existingAccess } = await serviceClient
      .from("catalog_access")
      .select("id, access_status")
      .eq("user_id", profile.id)
      .eq("catalog_item_id", catalogItemId)
      .maybeSingle();

    let newAccess;
    if (existingAccess) {
      // Si l'accès existe déjà, utiliser l'accès existant
      console.log("[test/simulate-purchase] Access already exists, using existing access:", existingAccess.id);
      newAccess = {
        id: existingAccess.id,
        access_status: existingAccess.access_status,
        granted_at: new Date().toISOString(),
        purchase_amount: catalogItem.price || 0,
      };
    } else {
      // Créer l'accès dans catalog_access
      const { data: createdAccess, error: accessError } = await serviceClient
        .from("catalog_access")
        .insert({
          user_id: profile.id,
          catalog_item_id: catalogItemId,
          organization_id: null, // B2C
          access_status: "purchased",
          granted_at: new Date().toISOString(),
          transaction_id: `test_sim_${Date.now()}`, // ID de transaction simulé
          purchase_amount: catalogItem.price || 0,
          purchase_date: new Date().toISOString(),
        })
        .select("id, access_status, granted_at, purchase_amount")
        .single();

      if (accessError) {
        console.error("[test/simulate-purchase] Error creating access:", accessError);
        return NextResponse.json(
          { error: `Erreur lors de la création de l'accès: ${accessError.message}` },
          { status: 500 }
        );
      }

      newAccess = createdAccess;
      console.log("[test/simulate-purchase] ✅ Access created:", newAccess);
    }

    // Envoyer l'email de confirmation
    try {
      const firstName = profile.full_name?.split(" ")[0] || null;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
      const accountLink = `${baseUrl}/jessica-contentin/mon-compte`;

      const emailResult = await sendPurchaseConfirmationEmail(
        email,
        firstName,
        catalogItem.title,
        catalogItem.price || 0,
        new Date().toLocaleDateString("fr-FR"),
        accountLink
      );

      if (emailResult.success) {
        console.log("[test/simulate-purchase] ✅ Email sent successfully:", emailResult.messageId);
      } else {
        console.error("[test/simulate-purchase] ⚠️ Email sending failed:", emailResult.error);
      }

      return NextResponse.json({
        success: true,
        message: existingAccess ? "Email renvoyé avec succès (accès existant)" : "Achat simulé avec succès et email envoyé",
        accessAlreadyExisted: !!existingAccess,
        access: {
          id: newAccess.id,
          access_status: newAccess.access_status,
          granted_at: newAccess.granted_at,
          purchase_amount: newAccess.purchase_amount,
        },
        catalogItem: {
          id: catalogItem.id,
          title: catalogItem.title,
          item_type: catalogItem.item_type,
          price: catalogItem.price,
        },
        email: {
          sent: emailResult.success,
          messageId: emailResult.messageId || null,
          error: emailResult.error || null,
        },
      });
    } catch (emailError) {
      console.error("[test/simulate-purchase] Error sending email:", emailError);
      // Ne pas échouer la requête si l'email échoue, l'accès a été créé
      return NextResponse.json({
        success: true,
        message: existingAccess ? "Email non envoyé (accès existant)" : "Achat simulé avec succès, mais l'email n'a pas pu être envoyé",
        accessAlreadyExisted: !!existingAccess,
        access: {
          id: newAccess.id,
          access_status: newAccess.access_status,
          granted_at: newAccess.granted_at,
          purchase_amount: newAccess.purchase_amount,
        },
        catalogItem: {
          id: catalogItem.id,
          title: catalogItem.title,
          item_type: catalogItem.item_type,
          price: catalogItem.price,
        },
        email: {
          sent: false,
          error: emailError instanceof Error ? emailError.message : "Erreur inconnue",
        },
      });
    }
  } catch (error) {
    console.error("[test/simulate-purchase] Error:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

