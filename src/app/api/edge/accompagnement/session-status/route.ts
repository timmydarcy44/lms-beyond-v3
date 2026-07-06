import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import {
  edgeAccompagnementStripeNotConfiguredError,
  getEdgeAccompagnementStripeClient,
  EDGE_ACCOMPAGNEMENT_STRIPE_TENANT,
} from "@/lib/stripe/edge-accompagnement-config";
import { processAccompagnementPaidSession } from "@/lib/particulier/accompagnement-fulfill";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { formatSlotLabel } from "@/lib/particulier/accompagnement-booking";

/** Vérifie et finalise une session Stripe (backup si webhook retardé). */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId) return NextResponse.json({ error: "session_id requis" }, { status: 400 });

    const supabase = await getServerClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });

    const stripe = getEdgeAccompagnementStripeClient();
    if (!stripe) {
      return NextResponse.json({ state: "stripe_unconfigured", error: edgeAccompagnementStripeNotConfiguredError() });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.tenant !== EDGE_ACCOMPAGNEMENT_STRIPE_TENANT) {
      return NextResponse.json({ error: "Session invalide" }, { status: 400 });
    }
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    if (session.payment_status === "paid") {
      await processAccompagnementPaidSession(session);
    }

    const service = getServiceRoleClient();
    if (!service) return NextResponse.json({ state: "pending" });

    const { data: reservation } = await service
      .from("edge_accompagnement_reservations")
      .select(
        "id, offer_name, selected_slot, amount_cents, coach_name, payment_status, status, duration_label, visio_url, manage_token",
      )
      .eq("stripe_checkout_session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (reservation?.payment_status === "paid") {
      const slot = reservation.selected_slot;
      const d = new Date(slot);
      return NextResponse.json({
        state: "paid",
        reservation: {
          ...reservation,
          dateLabel: new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Paris",
          }).format(d),
          timeLabel: new Intl.DateTimeFormat("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Paris",
          }).format(d),
          slotLabel: formatSlotLabel(slot),
        },
      });
    }

    if (session.status === "expired" || session.payment_status === "unpaid") {
      return NextResponse.json({ state: session.status === "expired" ? "cancelled" : "pending" });
    }

    return NextResponse.json({ state: "pending" });
  } catch (error) {
    console.error("[edge/accompagnement/session-status]", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
