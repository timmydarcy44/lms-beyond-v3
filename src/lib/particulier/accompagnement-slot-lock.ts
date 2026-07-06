import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  EDGE_ACCOMPAGNEMENT_HOLD_MINUTES,
  EDGE_ACCOMPAGNEMENT_STRIPE_TENANT,
} from "@/lib/stripe/edge-accompagnement-config";
import { getBookableOffer } from "@/lib/particulier/accompagnement-booking";

export async function purgeExpiredSlotHolds(service: SupabaseClient) {
  await service
    .from("edge_accompagnement_slot_holds")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

export async function isAccompagnementSlotAvailable(
  service: SupabaseClient,
  selectedSlot: string,
  userId?: string,
): Promise<{ available: boolean; reason?: "taken" | "held" }> {
  await purgeExpiredSlotHolds(service);

  const { data: confirmed } = await service
    .from("edge_accompagnement_reservations")
    .select("id")
    .eq("selected_slot", selectedSlot)
    .eq("payment_status", "paid")
    .eq("status", "confirmed")
    .maybeSingle();

  if (confirmed) return { available: false, reason: "taken" };

  const { data: hold } = await service
    .from("edge_accompagnement_slot_holds")
    .select("user_id")
    .eq("selected_slot", selectedSlot)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (hold && hold.user_id !== userId) return { available: false, reason: "held" };

  return { available: true };
}

export async function getTakenAccompagnementSlots(service: SupabaseClient): Promise<Set<string>> {
  await purgeExpiredSlotHolds(service);
  const taken = new Set<string>();
  const now = new Date().toISOString();

  const [{ data: reservations }, { data: holds }] = await Promise.all([
    service
      .from("edge_accompagnement_reservations")
      .select("selected_slot")
      .eq("payment_status", "paid")
      .eq("status", "confirmed"),
    service
      .from("edge_accompagnement_slot_holds")
      .select("selected_slot")
      .gt("expires_at", now),
  ]);

  for (const row of reservations ?? []) taken.add(row.selected_slot);
  for (const row of holds ?? []) taken.add(row.selected_slot);
  return taken;
}

export type FulfillResult =
  | { ok: true; reservationId: string; alreadyExisted: boolean }
  | { ok: false; error: string };

/** Crée la réservation confirmée après paiement Stripe (idempotent). */
export async function fulfillAccompagnementCheckout(
  service: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<FulfillResult> {
  if (session.metadata?.tenant !== EDGE_ACCOMPAGNEMENT_STRIPE_TENANT) {
    return { ok: false, error: "not_edge_accompagnement" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, error: "not_paid" };
  }

  const userId = session.metadata.user_id;
  const offerSlug = session.metadata.offer_id;
  const selectedSlot = session.metadata.selected_slot;
  const email = session.metadata.email || session.customer_email || session.customer_details?.email;
  const userName = session.metadata.user_name || email?.split("@")[0] || "Client EDGE";
  const userPhone = session.metadata.user_phone || null;

  if (!userId || !offerSlug || !selectedSlot || !email) {
    return { ok: false, error: "metadata_incomplete" };
  }

  const offer = getBookableOffer(offerSlug);
  if (!offer) return { ok: false, error: "offer_invalid" };

  const { data: existingBySession } = await service
    .from("edge_accompagnement_reservations")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingBySession) {
    return { ok: true, reservationId: existingBySession.id, alreadyExisted: true };
  }

  const slotCheck = await isAccompagnementSlotAvailable(service, selectedSlot);
  if (!slotCheck.available && slotCheck.reason === "taken") {
    return { ok: false, error: "slot_already_taken" };
  }

  const paidAt = new Date().toISOString();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { data: reservation, error: insertError } = await service
    .from("edge_accompagnement_reservations")
    .insert({
      user_id: userId,
      offer_slug: offer.slug,
      offer_name: offer.title,
      amount_cents: offer.priceCents,
      duration_label: offer.duration,
      selected_slot: selectedSlot,
      user_email: email,
      user_name: userName,
      user_phone: userPhone,
      coach_name: "Expert EDGE",
      status: "confirmed",
      payment_status: "paid",
      paid_at: paidAt,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: paidAt,
    })
    .select("id")
    .single();

  if (insertError || !reservation) {
    if (insertError?.code === "23505") {
      const { data: dup } = await service
        .from("edge_accompagnement_reservations")
        .select("id")
        .eq("stripe_checkout_session_id", session.id)
        .maybeSingle();
      if (dup) return { ok: true, reservationId: dup.id, alreadyExisted: true };
    }
    console.error("[accompagnement/fulfill] insert:", insertError);
    return { ok: false, error: "insert_failed" };
  }

  await service
    .from("edge_accompagnement_slot_holds")
    .delete()
    .eq("stripe_checkout_session_id", session.id);

  return { ok: true, reservationId: reservation.id, alreadyExisted: false };
}

export function holdExpiresAt(): string {
  return new Date(Date.now() + EDGE_ACCOMPAGNEMENT_HOLD_MINUTES * 60 * 1000).toISOString();
}
