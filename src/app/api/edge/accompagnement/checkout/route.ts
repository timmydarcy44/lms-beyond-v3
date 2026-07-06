import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { publicAppUrl } from "@/lib/env";
import {
  formatSlotLabel,
  getBookableOffer,
  getStripeCheckoutSuccessUrl,
  getStripePriceIdForOffer,
} from "@/lib/particulier/accompagnement-booking";

type CheckoutBody = {
  offerSlug: string;
  selectedSlot: string;
  userName?: string;
  userPhone?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = (await request.json()) as CheckoutBody;
    const offer = getBookableOffer(body.offerSlug);

    if (!offer?.bookable) {
      return NextResponse.json({ error: "Offre invalide ou non réservable en ligne" }, { status: 400 });
    }

    if (!body.selectedSlot) {
      return NextResponse.json({ error: "Créneau requis" }, { status: 400 });
    }

    const slotDate = new Date(body.selectedSlot);
    if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Paiement temporairement indisponible" }, { status: 503 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const userName =
      body.userName?.trim() ||
      String(user.user_metadata?.full_name ?? "").trim() ||
      `${String(user.user_metadata?.first_name ?? "")} ${String(user.user_metadata?.last_name ?? "")}`.trim() ||
      user.email.split("@")[0];

    const { data: reservation, error: insertError } = await service
      .from("edge_accompagnement_reservations")
      .insert({
        user_id: user.id,
        offer_slug: offer.slug,
        offer_name: offer.title,
        amount_cents: offer.priceCents,
        duration_label: offer.duration,
        selected_slot: body.selectedSlot,
        user_email: user.email,
        user_name: userName,
        user_phone: body.userPhone?.trim() || null,
        status: "pending",
        payment_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !reservation) {
      console.error("[edge/accompagnement/checkout] insert:", insertError);
      return NextResponse.json({ error: "Impossible de créer la réservation" }, { status: 500 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-10-29.clover" });
    const stripePriceId = getStripePriceIdForOffer(offer);

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = stripePriceId
      ? { price: stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: "eur",
            unit_amount: offer.priceCents,
            product_data: {
              name: offer.title,
              description: `${offer.duration} — ${formatSlotLabel(body.selectedSlot)}`,
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [lineItem],
      success_url: getStripeCheckoutSuccessUrl(),
      cancel_url: `${publicAppUrl()}/dashboard/accompagnement/reserver?offer=${offer.slug}&cancelled=1`,
      metadata: {
        tenant: "edge_accompagnement",
        user_id: user.id,
        offer_id: offer.slug,
        offer_name: offer.title,
        selected_slot: body.selectedSlot,
        email: user.email,
        reservation_id: reservation.id,
      },
    });

    if (!session.url) {
      await service.from("edge_accompagnement_reservations").delete().eq("id", reservation.id);
      return NextResponse.json({ error: "Session Stripe introuvable" }, { status: 500 });
    }

    await service
      .from("edge_accompagnement_reservations")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[edge/accompagnement/checkout] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
