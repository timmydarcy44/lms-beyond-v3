import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getNevoStripeClient } from "@/lib/stripe/nevo-client";

export async function POST(request: NextRequest) {
  try {
    const { priceId, email } = await request.json();
    console.log("[nevo/stripe/checkout] priceId:", priceId);
    console.log("[nevo/stripe/checkout] email:", email || "none");
    if (!priceId || typeof priceId !== "string") {
      return NextResponse.json({ error: "priceId requis" }, { status: 400 });
    }

    const supabase = await getServerClient();
    console.log("[nevo/stripe/checkout] supabase client:", !!supabase);
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log("[nevo/stripe/checkout] user:", user?.id || "none");
    const resolvedEmail = email || user?.email || "";
    if (!resolvedEmail) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const stripe = getNevoStripeClient();
    console.log("[nevo/stripe/checkout] stripe client:", !!stripe);
    if (!stripe) {
      return NextResponse.json({ error: "Stripe n'est pas configuré" }, { status: 503 });
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3001";

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { trial_period_days: 7 },
        success_url: `${origin}/app-landing/check-email`,
        cancel_url: "https://www.nevo-app.fr/tarifs",
        allow_promotion_codes: true,
        customer_email: resolvedEmail,
        metadata: {
          user_id: user?.id || "",
          tenant: "nevo",
          email: resolvedEmail,
        },
      });
    } catch (stripeError: any) {
      console.error("[nevo/stripe/checkout] Stripe error:", {
        message: stripeError?.message,
        type: stripeError?.type,
        code: stripeError?.code,
        param: stripeError?.param,
      });
      throw stripeError;
    }

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message, stack: error?.stack },
      { status: 500 },
    );
  }
}
