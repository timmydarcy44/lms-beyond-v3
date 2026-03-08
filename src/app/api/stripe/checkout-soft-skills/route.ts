import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(_request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    // 1) Si deja paye, redirection immediate vers le test.
    const { data: profileById } = await supabase
      .from("profiles")
      .select("id, has_paid_soft_skills")
      .eq("id", user.id)
      .maybeSingle();

    let hasPaid = Boolean(profileById?.has_paid_soft_skills);

    if (!profileById && user.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id, has_paid_soft_skills")
        .eq("email", user.email)
        .maybeSingle();
      hasPaid = Boolean(profileByEmail?.has_paid_soft_skills);
    }

    if (hasPaid) {
      return NextResponse.json({ url: "/dashboard/apprenant/soft-skills" });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe non configure" }, { status: 503 });
    }
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-10-29.clover",
    });

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    console.log(
      "[stripe] Clé utilisée:",
      process.env.STRIPE_SECRET_KEY?.substring(0, 20) + "..."
    );
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 2990,
            product_data: {
              name: "Test Soft Skills Beyond",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/apprenant/soft-skills?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/apprenant/soft-skills-intro`,
      metadata: {
        user_id: user.id,
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json({ error: "URL de checkout introuvable" }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[stripe/checkout-soft-skills] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
