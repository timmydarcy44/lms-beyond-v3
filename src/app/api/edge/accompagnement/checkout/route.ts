import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { publicAppUrl } from "@/lib/env";
import {
  formatSlotLabel,
  getBookableOffer,
  getStripeCheckoutSuccessUrl,
  getStripePriceIdForOffer,
} from "@/lib/particulier/accompagnement-booking";
import {
  holdExpiresAt,
  isAccompagnementSlotAvailable,
  purgeExpiredSlotHolds,
} from "@/lib/particulier/accompagnement-slot-lock";
import {
  EDGE_ACCOMPAGNEMENT_STRIPE_TENANT,
  edgeAccompagnementStripeNotConfiguredError,
  getEdgeAccompagnementStripeClient,
} from "@/lib/stripe/edge-accompagnement-config";

type CheckoutBody = {
  offerSlug: string;
  selectedSlot: string;
  userName?: string;
  userPhone?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const stripe = getEdgeAccompagnementStripeClient();
    if (!stripe) {
      return NextResponse.json({ error: edgeAccompagnementStripeNotConfiguredError() }, { status: 503 });
    }

    const service = getServiceRoleClient();
    if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const body = (await request.json()) as CheckoutBody;
    const offer = getBookableOffer(body.offerSlug);
    if (!offer?.bookable) {
      return NextResponse.json({ error: "Offre invalide" }, { status: 400 });
    }
    if (!body.selectedSlot) return NextResponse.json({ error: "Créneau requis" }, { status: 400 });

    const slotDate = new Date(body.selectedSlot);
    if (Number.isNaN(slotDate.getTime()) || slotDate.getTime() <= Date.now()) {
      return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });
    }

    await purgeExpiredSlotHolds(service);

    const userName =
      body.userName?.trim() ||
      String(user.user_metadata?.full_name ?? "").trim() ||
      user.email.split("@")[0];

    const { data: existingPaid } = await service
      .from("edge_accompagnement_reservations")
      .select("id")
      .eq("user_id", user.id)
      .eq("selected_slot", body.selectedSlot)
      .eq("offer_slug", offer.slug)
      .eq("payment_status", "paid")
      .maybeSingle();

    if (existingPaid) {
      return NextResponse.json({
        error: "Vous avez déjà réservé ce créneau.",
        alreadyBooked: true,
      }, { status: 409 });
    }

    const { data: userHold } = await service
      .from("edge_accompagnement_slot_holds")
      .select("stripe_checkout_session_id")
      .eq("user_id", user.id)
      .eq("selected_slot", body.selectedSlot)
      .eq("offer_slug", offer.slug)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (userHold?.stripe_checkout_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(userHold.stripe_checkout_session_id);
        if (existingSession.status === "open" && existingSession.url) {
          return NextResponse.json({ url: existingSession.url, reused: true });
        }
      } catch {
        await service.from("edge_accompagnement_slot_holds").delete().eq("stripe_checkout_session_id", userHold.stripe_checkout_session_id);
      }
    }

    const availability = await isAccompagnementSlotAvailable(service, body.selectedSlot, user.id);
    if (!availability.available) {
      const msg =
        availability.reason === "taken"
          ? "Ce créneau vient d'être réservé. Choisissez un autre horaire."
          : "Ce créneau est temporairement indisponible.";
      return NextResponse.json({ error: msg }, { status: 409 });
    }

    const stripePriceId = getStripePriceIdForOffer(offer);
    const lineItem = stripePriceId
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
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: {
        tenant: EDGE_ACCOMPAGNEMENT_STRIPE_TENANT,
        user_id: user.id,
        offer_id: offer.slug,
        offer_name: offer.title,
        selected_slot: body.selectedSlot,
        email: user.email,
        user_name: userName,
        user_phone: body.userPhone?.trim() || "",
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Session Stripe introuvable" }, { status: 500 });
    }

    const { error: holdError } = await service.from("edge_accompagnement_slot_holds").insert({
      user_id: user.id,
      offer_slug: offer.slug,
      offer_name: offer.title,
      selected_slot: body.selectedSlot,
      stripe_checkout_session_id: session.id,
      user_email: user.email,
      user_name: userName,
      user_phone: body.userPhone?.trim() || null,
      amount_cents: offer.priceCents,
      duration_label: offer.duration,
      expires_at: holdExpiresAt(),
    });

    if (holdError) {
      console.error("[edge/accompagnement/checkout] hold:", holdError);
      if (holdError.code === "23505") {
        return NextResponse.json({ error: "Ce créneau n'est plus disponible." }, { status: 409 });
      }
      return NextResponse.json({ error: "Impossible de verrouiller le créneau" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[edge/accompagnement/checkout] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
