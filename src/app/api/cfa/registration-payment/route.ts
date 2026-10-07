import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getServiceRoleClient } from "@/lib/supabase/server";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  return key ? new Stripe(key, { apiVersion: "2025-10-29.clover" }) : null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const token = String(body?.token ?? "").trim();
  const action = String(body?.action ?? "create");
  if (!token) return NextResponse.json({ error: "Candidature invalide." }, { status: 400 });

  const db = getServiceRoleClient();
  const stripe = getStripe();
  if (!db || !stripe) {
    return NextResponse.json({ error: "Le paiement est temporairement indisponible." }, { status: 503 });
  }

  const { data: application } = await db
    .from("cfa_applications")
    .select("*")
    .eq("resume_token", token)
    .maybeSingle();
  if (!application || application.status !== "administrative") {
    return NextResponse.json({ error: "Paiement non disponible pour ce dossier." }, { status: 403 });
  }

  if (action === "confirm") {
    const sessionId = String(body?.sessionId ?? "");
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.payment_status !== "paid" ||
      session.metadata?.cfa_application_id !== application.id
    ) {
      return NextResponse.json({ error: "Paiement non confirmé." }, { status: 400 });
    }
    const { data, error } = await db
      .from("cfa_applications")
      .update({
        registration_fee_session_id: session.id,
        registration_fee_paid_at: new Date().toISOString(),
      })
      .eq("id", application.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ application: data });
  }

  const origin =
    request.headers.get("origin") ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://edgebs.fr";
  const returnUrl = `${origin.replace(/\/$/, "")}/ecole/candidater?resume=${encodeURIComponent(token)}`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: String(application.email),
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: 25_000,
          product_data: {
            name: "Frais d’inscription Byound School",
            description:
              "Remboursés à la signature du contrat d’alternance, après validation de la période d’essai.",
          },
        },
        quantity: 1,
      },
    ],
    metadata: { cfa_application_id: application.id },
    success_url: `${returnUrl}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}&payment=cancelled`,
  });

  await db
    .from("cfa_applications")
    .update({ registration_fee_session_id: session.id })
    .eq("id", application.id);

  return NextResponse.json({ url: session.url });
}
