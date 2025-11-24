import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";

// Initialiser Stripe uniquement si la clé est disponible
const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
};

// URL Stripe Checkout pour "Pourquoi les enfants se mettent il en colère ?"
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/dRmdRaeay8Ni8Sg8bh33W01";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { session_id, user_id, catalog_item_id } = body;

    if (!session_id || !user_id || !catalog_item_id) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Vérifier la session Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Accorder l'accès au contenu
    const { error: accessError } = await supabase
      .from("catalog_access")
      .upsert({
        user_id: user_id,
        catalog_item_id: catalog_item_id,
        organization_id: null, // B2C, pas d'organisation
        access_status: "purchased",
        granted_at: new Date().toISOString(),
        purchase_date: new Date().toISOString(),
        metadata: {
          stripe_session_id: session_id,
          stripe_payment_intent: session.payment_intent,
        },
      });

    if (accessError) {
      console.error("[stripe/checkout-success] Error granting access:", accessError);
      return NextResponse.json(
        { error: "Failed to grant access" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/checkout-success] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}


