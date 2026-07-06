import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendAccompagnementConfirmationEmails } from "@/lib/particulier/accompagnement-emails";
import { getBookableOffer } from "@/lib/particulier/accompagnement-booking";

const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: "2025-10-29.clover" });
};

const webhookSecret =
  process.env.STRIPE_EDGE_ACCOMPAGNEMENT_WEBHOOK_SECRET?.trim() ||
  process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
  "";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe/edge-accompagnement/webhook] signature:", err);
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }

    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.tenant !== "edge_accompagnement") {
      return NextResponse.json({ received: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const service = getServiceRoleClient();
    if (!service) {
      console.error("[stripe/edge-accompagnement/webhook] service role missing");
      return NextResponse.json({ received: true });
    }

    const reservationId = session.metadata.reservation_id;
    const userId = session.metadata.user_id;
    const offerSlug = session.metadata.offer_id;
    const selectedSlot = session.metadata.selected_slot;
    const email = session.metadata.email || session.customer_email || session.customer_details?.email;

    if (!reservationId || !userId || !offerSlug || !selectedSlot || !email) {
      console.error("[stripe/edge-accompagnement/webhook] metadata incomplete", session.metadata);
      return NextResponse.json({ received: true });
    }

    const { data: existing } = await service
      .from("edge_accompagnement_reservations")
      .select("id, status, payment_status, user_name, offer_name, amount_cents")
      .eq("id", reservationId)
      .maybeSingle();

    if (!existing) {
      console.error("[stripe/edge-accompagnement/webhook] reservation not found:", reservationId);
      return NextResponse.json({ received: true });
    }

    if (existing.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    const paidAt = new Date().toISOString();
    const { error: updateError } = await service
      .from("edge_accompagnement_reservations")
      .update({
        status: "confirmed",
        payment_status: "paid",
        paid_at: paidAt,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
        stripe_checkout_session_id: session.id,
        updated_at: paidAt,
      })
      .eq("id", reservationId);

    if (updateError) {
      console.error("[stripe/edge-accompagnement/webhook] update:", updateError);
      return NextResponse.json({ received: true });
    }

    const offer = getBookableOffer(offerSlug);
    if (offer) {
      await sendAccompagnementConfirmationEmails({
        reservationId,
        userId,
        userName: existing.user_name || email.split("@")[0],
        userEmail: email,
        offer,
        amountCents: existing.amount_cents,
        selectedSlot,
      }).catch((err) => console.error("[stripe/edge-accompagnement/webhook] email:", err));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/edge-accompagnement/webhook] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
