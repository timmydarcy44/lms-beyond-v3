import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  try {
    const Stripe = require("stripe").default;
    return new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover" as any,
    });
  } catch (error) {
    console.error("[stripe] Error initializing Stripe:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { itemId, itemType, itemTitle, price } = body;

    if (!itemId || !itemType || !itemTitle || price === undefined) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
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

    // Vérifier que Stripe est configuré
    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe n'est pas configuré" },
        { status: 503 }
      );
    }

    // Créer la session de paiement Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: itemTitle,
              description: `${itemType === "ressource" ? "Ressource" : itemType === "test" ? "Test" : itemType === "module" ? "Module" : "Parcours"}: ${itemTitle}`,
            },
            unit_amount: Math.round(price * 100), // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/catalogue/${itemType}/${itemId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/catalogue/${itemType}/${itemId}`,
      metadata: {
        itemId,
        itemType,
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("[stripe/create-checkout-session] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}





