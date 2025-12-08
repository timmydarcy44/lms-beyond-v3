import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { catalogItemId, contentId } = body;

    if (!catalogItemId && !contentId) {
      return NextResponse.json(
        { error: "catalogItemId ou contentId requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Récupérer l'item du catalogue
    // Prioriser catalogItemId, sinon utiliser contentId pour chercher par content_id
    const itemId = catalogItemId || contentId;
    if (!itemId) {
      return NextResponse.json(
        { error: "catalogItemId ou contentId requis" },
        { status: 400 }
      );
    }
    
    const catalogItem = await getCatalogItemById(itemId, undefined, user.id);

    if (!catalogItem) {
      console.error("[stripe/create-checkout-session-jessica] Catalog item not found for itemId:", itemId);
      return NextResponse.json(
        { error: "Item non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà accès à cette ressource
    const serviceClient = getServiceRoleClient();
    const checkClient = serviceClient || supabase;
    
    const { data: existingAccess } = await checkClient
      .from("catalog_access")
      .select("access_status")
      .eq("catalog_item_id", catalogItem.id)
      .eq("user_id", user.id)
      .in("access_status", ["purchased", "free", "manually_granted"])
      .maybeSingle();

    if (existingAccess) {
      return NextResponse.json(
        { 
          error: "Vous avez déjà accès à cette ressource. Rendez-vous dans votre espace pour y accéder.",
          alreadyOwned: true 
        },
        { status: 400 }
      );
    }

    console.log("[stripe/create-checkout-session-jessica] Catalog item retrieved:", {
      id: catalogItem.id,
      item_type: catalogItem.item_type,
      title: catalogItem.title,
      itemId,
    });

    // Accepter les ressources, tests, modules et parcours
    console.log("[stripe/create-checkout-session-jessica] Checking item_type:", catalogItem.item_type);
    if (catalogItem.item_type !== "ressource" && catalogItem.item_type !== "test" && catalogItem.item_type !== "module" && catalogItem.item_type !== "parcours") {
      console.error("[stripe/create-checkout-session-jessica] Unsupported item_type:", catalogItem.item_type);
      return NextResponse.json(
        { error: `Type d'item non supporté: ${catalogItem.item_type}. Types supportés: ressource, test, module, parcours` },
        { status: 400 }
      );
    }

    // Vérifier que Stripe est configuré
    // Essayer plusieurs noms de variables possibles
    // Note: rk_live_ est une clé restreinte, sk_live_ est la clé secrète standard
    const stripeSecretKey = 
      process.env.STRIPE_SECRET_KEY || 
      process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET;
    
    console.log("[stripe/create-checkout-session-jessica] Checking Stripe configuration...");
    console.log("[stripe/create-checkout-session-jessica] STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("[stripe/create-checkout-session-jessica] NEXT_PUBLIC_STRIPE_SECRET_KEY exists:", !!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);
    console.log("[stripe/create-checkout-session-jessica] STRIPE_SECRET exists:", !!process.env.STRIPE_SECRET);
    
    // Log pour debug (sans exposer la clé complète)
    if (stripeSecretKey) {
      console.log("[stripe/create-checkout-session-jessica] ✅ Clé Stripe trouvée:", {
        prefix: stripeSecretKey.substring(0, 7),
        length: stripeSecretKey.length,
        type: stripeSecretKey.startsWith('sk_live_') ? 'Live Secret Key' :
              stripeSecretKey.startsWith('sk_test_') ? 'Test Secret Key' :
              stripeSecretKey.startsWith('rk_live_') ? 'Live Restricted Key' :
              stripeSecretKey.startsWith('rk_test_') ? 'Test Restricted Key' : 'Unknown'
      });
    }
    
    if (!stripeSecretKey) {
      console.error("[stripe/create-checkout-session-jessica] ❌ STRIPE_SECRET_KEY non configuré");
      console.error("[stripe/create-checkout-session-jessica] Variables disponibles:", {
        STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
        NEXT_PUBLIC_STRIPE_SECRET_KEY: !!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY,
        STRIPE_SECRET: !!process.env.STRIPE_SECRET,
        allEnvKeys: Object.keys(process.env).filter(key => key.includes('STRIPE')),
      });
      return NextResponse.json(
        { 
          error: "Stripe n'est pas configuré",
          details: "La variable d'environnement STRIPE_SECRET_KEY n'est pas définie. Vérifiez votre configuration."
        },
        { status: 503 }
      );
    }

    // Vérifier que ce n'est pas une clé restreinte (rk_live_)
    if (stripeSecretKey.startsWith('rk_')) {
      console.error("[stripe/create-checkout-session-jessica] ❌ Clé RESTREINTE détectée (rk_live_)");
      console.error("[stripe/create-checkout-session-jessica] Les clés restreintes (rk_live_) ne fonctionnent pas pour les paiements standards.");
      console.error("[stripe/create-checkout-session-jessica] Utilisez une clé SECRÈTE standard (sk_live_) à la place.");
      return NextResponse.json(
        { 
          error: "Clé Stripe invalide",
          details: "Vous utilisez une clé RESTREINTE (rk_live_). Utilisez une clé SECRÈTE standard (sk_live_) dans STRIPE_SECRET_KEY. Consultez https://dashboard.stripe.com/apikeys pour obtenir la bonne clé."
        },
        { status: 503 }
      );
    }

    try {
      const stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2025-10-29.clover",
      });

      // Créer la session de paiement Stripe
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: catalogItem.title,
                description: catalogItem.description || undefined,
              },
              unit_amount: Math.round((catalogItem.price || 0) * 100), // Stripe utilise les centimes
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: catalogItem.item_type === "test" 
          ? `${baseUrl}/test-confiance-en-soi?payment=success&session_id={CHECKOUT_SESSION_ID}`
          : `${baseUrl}/ressources/${catalogItem.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: catalogItem.item_type === "test"
          ? `${baseUrl}/test-confiance-en-soi`
          : `${baseUrl}/ressources/${catalogItem.id}`,
        metadata: {
          catalog_item_id: catalogItem.id,
          content_id: catalogItem.content_id,
          item_type: catalogItem.item_type,
          user_id: user.id,
        },
      });

      return NextResponse.json({ 
        sessionId: session.id,
        url: session.url,
      });
    } catch (stripeError: any) {
      console.error("[stripe/create-checkout-session-jessica] Stripe error:", stripeError);
      return NextResponse.json(
        { 
          error: "Erreur lors de la création de la session de paiement",
          details: stripeError.message || "Erreur inconnue"
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[stripe/create-checkout-session-jessica] Error:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la création de la session de paiement",
        details: error.message || "Erreur inconnue"
      },
      { status: 500 }
    );
  }
}

