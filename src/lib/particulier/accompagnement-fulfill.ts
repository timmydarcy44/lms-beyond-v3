import { getServiceRoleClient } from "@/lib/supabase/server";
import { getBookableOffer } from "@/lib/particulier/accompagnement-booking";
import { sendAccompagnementConfirmationEmails } from "@/lib/particulier/accompagnement-emails";
import { fulfillAccompagnementCheckout } from "@/lib/particulier/accompagnement-slot-lock";
import type Stripe from "stripe";

export async function processAccompagnementPaidSession(session: Stripe.Checkout.Session) {
  const service = getServiceRoleClient();
  if (!service) return { ok: false as const, error: "no_service" };

  const result = await fulfillAccompagnementCheckout(service, session);
  if (!result.ok) return result;

  if (!result.alreadyExisted) {
    const { data: reservation } = await service
      .from("edge_accompagnement_reservations")
      .select(
        "id, manage_token, user_id, user_name, user_email, offer_slug, amount_cents, selected_slot, coach_name, duration_label, visio_url",
      )
      .eq("id", result.reservationId)
      .single();

    const offer = getBookableOffer(session.metadata?.offer_id);
    if (reservation && offer) {
      await sendAccompagnementConfirmationEmails({
        reservationId: reservation.id,
        manageToken: reservation.manage_token,
        userId: reservation.user_id,
        userName: reservation.user_name || reservation.user_email,
        userEmail: reservation.user_email,
        offer,
        amountCents: reservation.amount_cents,
        selectedSlot: reservation.selected_slot,
        coachName: reservation.coach_name || "Expert EDGE",
        durationLabel: reservation.duration_label,
        visioUrl: reservation.visio_url,
      }).catch((err) => console.error("[accompagnement/fulfill] email:", err));
    }
  }

  return result;
}
