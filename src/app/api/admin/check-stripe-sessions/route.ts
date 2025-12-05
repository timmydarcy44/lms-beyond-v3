import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Stripe from "stripe";

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("[check-stripe-sessions] Stripe secret key not configured.");
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: "2025-10-29.clover",
  });
};

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est super admin
    const isSuper = await isSuperAdmin();
    if (!isSuper) {
      console.warn("[check-stripe-sessions] Unauthorized attempt to check Stripe sessions.");
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const days = parseInt(searchParams.get("days") || "7", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe non configuré" },
        { status: 500 }
      );
    }

    const now = Math.floor(Date.now() / 1000);
    const createdAfter = now - (days * 24 * 60 * 60); // X days ago in seconds

    // Récupérer les sessions Stripe
    const sessions = await stripe.checkout.sessions.list({
      customer_email: email || undefined,
      created: { gte: createdAfter },
      limit: limit,
      expand: ["data.payment_intent"],
    });

    // Formater les résultats
    const formattedSessions = sessions.data.map((session) => ({
      id: session.id,
      customer_email: session.customer_email || session.customer_details?.email,
      payment_status: session.payment_status,
      amount_total: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency,
      created: new Date(session.created * 1000).toISOString(),
      metadata: session.metadata,
      success_url: session.success_url,
      cancel_url: session.cancel_url,
      payment_intent: session.payment_intent
        ? (typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent.id)
        : null,
      status: session.status,
    }));

    return NextResponse.json({
      total: sessions.data.length,
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("[check-stripe-sessions] Error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des sessions Stripe",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

