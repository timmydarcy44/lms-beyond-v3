import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendPurchaseConfirmationEmail } from "@/lib/emails/send";

/**
 * Route de test pour simuler un achat complet :
 * 1. Client clique sur "acheter"
 * 2. Session Stripe créée
 * 3. Paiement réussi (simulé)
 * 4. Webhook Stripe déclenché (simulé)
 * 5. Accès accordé
 * 6. Email envoyé
 * 7. Vérification que tout fonctionne
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

    console.log("[test/simulate-full-purchase] 🚀 Démarrage de la simulation complète d'achat");
    console.log("[test/simulate-full-purchase] Email:", email);
    console.log("[test/simulate-full-purchase] Catalog Item ID:", catalogItemId);

    // ÉTAPE 1: Trouver l'utilisateur
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

    console.log("[test/simulate-full-purchase] ✅ ÉTAPE 1: Utilisateur trouvé:", profile.id);

    // ÉTAPE 2: Vérifier que le catalog_item existe
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

    console.log("[test/simulate-full-purchase] ✅ ÉTAPE 2: Catalog item trouvé:", catalogItem.title);

    // ÉTAPE 3: Vérifier si l'utilisateur a déjà accès
    const { data: existingAccess } = await serviceClient
      .from("catalog_access")
      .select("id, access_status")
      .eq("user_id", profile.id)
      .eq("catalog_item_id", catalogItemId)
      .maybeSingle();

    if (existingAccess) {
      console.log("[test/simulate-full-purchase] ⚠️ L'utilisateur a déjà accès, suppression pour la simulation...");
      // Supprimer l'accès existant pour permettre la simulation
      await serviceClient
        .from("catalog_access")
        .delete()
        .eq("id", existingAccess.id);
    }

    // ÉTAPE 4: Simuler le webhook Stripe (paiement réussi)
    console.log("[test/simulate-full-purchase] 🔄 ÉTAPE 3: Simulation du webhook Stripe (paiement réussi)");

    const { data: newAccess, error: accessError } = await serviceClient
      .from("catalog_access")
      .insert({
        user_id: profile.id,
        catalog_item_id: catalogItemId,
        organization_id: null, // B2C
        access_status: "purchased",
        granted_at: new Date().toISOString(),
        transaction_id: `test_sim_${Date.now()}`,
        purchase_amount: catalogItem.price || 0,
        purchase_date: new Date().toISOString(),
      })
      .select("id, access_status, granted_at, purchase_amount")
      .single();

    if (accessError) {
      console.error("[test/simulate-full-purchase] ❌ ÉTAPE 3: Erreur lors de la création de l'accès:", accessError);
      return NextResponse.json(
        { error: `Erreur lors de la création de l'accès: ${accessError.message}` },
        { status: 500 }
      );
    }

    console.log("[test/simulate-full-purchase] ✅ ÉTAPE 3: Accès créé avec succès:", newAccess.id);

    // ÉTAPE 5: Vérifier que l'accès est bien créé
    console.log("[test/simulate-full-purchase] 🔍 ÉTAPE 4: Vérification de l'accès créé");

    const { data: verifyAccess, error: verifyError } = await serviceClient
      .from("catalog_access")
      .select("id, access_status, granted_at, purchase_amount, catalog_item_id, user_id")
      .eq("id", newAccess.id)
      .maybeSingle();

    if (verifyError || !verifyAccess) {
      console.error("[test/simulate-full-purchase] ❌ ÉTAPE 4: Erreur lors de la vérification:", verifyError);
      return NextResponse.json(
        { error: "L'accès a été créé mais n'a pas pu être vérifié" },
        { status: 500 }
      );
    }

    console.log("[test/simulate-full-purchase] ✅ ÉTAPE 4: Accès vérifié avec succès");

    // ÉTAPE 6: Envoyer l'email de confirmation
    console.log("[test/simulate-full-purchase] 📧 ÉTAPE 5: Envoi de l'email de confirmation");

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

    if (!emailResult.success) {
      console.error("[test/simulate-full-purchase] ⚠️ ÉTAPE 5: Erreur lors de l'envoi de l'email:", emailResult.error);
    } else {
      console.log("[test/simulate-full-purchase] ✅ ÉTAPE 5: Email envoyé avec succès:", emailResult.messageId);
    }

    // ÉTAPE 7: Résumé final
    console.log("[test/simulate-full-purchase] ✅ Simulation complète terminée avec succès !");

    return NextResponse.json({
      success: true,
      message: "Simulation d'achat complète réussie",
      steps: {
        step1_user_found: true,
        step2_catalog_item_found: true,
        step3_access_created: true,
        step4_access_verified: true,
        step5_email_sent: emailResult.success,
      },
      access: {
        id: verifyAccess.id,
        access_status: verifyAccess.access_status,
        granted_at: verifyAccess.granted_at,
        purchase_amount: verifyAccess.purchase_amount,
        user_id: verifyAccess.user_id,
        catalog_item_id: verifyAccess.catalog_item_id,
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
        accountLink: accountLink,
      },
      summary: {
        user: {
          email: profile.email,
          id: profile.id,
          name: profile.full_name,
        },
        purchase: {
          item: catalogItem.title,
          price: catalogItem.price,
          date: new Date().toLocaleDateString("fr-FR"),
        },
        access: {
          status: verifyAccess.access_status,
          granted_at: verifyAccess.granted_at,
        },
        nextSteps: [
          "✅ L'accès a été créé dans catalog_access",
          "✅ L'email de confirmation a été envoyé",
          "✅ Le client peut maintenant accéder au contenu via 'mon compte'",
          `✅ Lien vers le compte: ${accountLink}`,
        ],
      },
    });
  } catch (error) {
    console.error("[test/simulate-full-purchase] ❌ Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

