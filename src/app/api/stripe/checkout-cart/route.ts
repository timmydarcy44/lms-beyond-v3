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
      apiVersion: "2024-11-20.acacia" as any,
    });
  } catch (error) {
    console.error("[stripe] Error initializing Stripe:", error);
    return null;
  }
}

/**
 * Crée une session Stripe Checkout pour plusieurs items du panier
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Panier vide" }, { status: 400 });
    }

    // Calculer le total
    const total = items.reduce((sum: number, item: any) => sum + (item.price || 0), 0);

    if (total <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    // Créer les line items pour Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title,
          description: `${item.content_type === "module" ? "Module" : item.content_type === "test" ? "Test" : item.content_type === "ressource" ? "Ressource" : "Parcours"}: ${item.title}`,
        },
        unit_amount: Math.round((item.price || 0) * 100), // Stripe utilise les centimes
      },
      quantity: 1,
    }));

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
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/catalogue/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/catalogue/checkout`,
      metadata: {
        user_id: user.id,
        items_count: items.length.toString(),
        items: JSON.stringify(items.map((item: any) => ({
          content_id: item.content_id,
          content_type: item.content_type,
        }))),
      },
    });

    // Créer une commande en attente
    await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        total_amount: total,
        currency: "eur",
        status: "pending",
        metadata: {
          items: items,
        },
      });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("[stripe/checkout-cart] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    );
  }
}





