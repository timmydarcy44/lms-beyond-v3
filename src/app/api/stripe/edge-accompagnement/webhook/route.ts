import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  getEdgeAccompagnementStripeClient,
  getEdgeAccompagnementStripeWebhookSecret,
} from "@/lib/stripe/edge-accompagnement-config";
import { processAccompagnementPaidSession } from "@/lib/particulier/accompagnement-fulfill";

export async function POST(request: NextRequest) {
  try {
    const stripe = getEdgeAccompagnementStripeClient();
    const webhookSecret = getEdgeAccompagnementStripeWebhookSecret();
    if (!stripe || !webhookSecret) {
      return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[stripe/edge-accompagnement/webhook] signature:", err);
      return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }

    const service = getServiceRoleClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await processAccompagnementPaidSession(session);
    }

    if (event.type === "checkout.session.expired" && service) {
      const session = event.data.object as Stripe.Checkout.Session;
      await service
        .from("edge_accompagnement_slot_holds")
        .delete()
        .eq("stripe_checkout_session_id", session.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/edge-accompagnement/webhook] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
