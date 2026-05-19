import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
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
    const body = await request.json().catch(() => ({}));
    const expertId = String(body?.expertId ?? "").trim();
    if (!expertId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    if (user.id !== expertId) {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe n'est pas configuré" }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Beyond Certified — Parcours Premium",
              description: "Accès à la formation + certification Beyond Certified (Open Badge).",
            },
            unit_amount: 7500,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/expert/certification?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/expert/certification?payment=cancel`,
      metadata: {
        expertId: user.id,
        purpose: "expert_certification",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[stripe/create-checkout] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}

