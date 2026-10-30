"use server";

import { headers } from "next/headers";
import { careBookingInputSchema, resolveCareBookingDomain } from "@/lib/care/booking-schema";
import { sendCareBookingEmails, sendCareCancellationEmails } from "@/lib/care/booking-emails";
import { canCancelCareBooking, loadCareBookingByToken } from "@/lib/care/load-booking";
import { loadAvailableCareSlots } from "@/lib/care/load-available-slots";
import { loadPublishedCareProfile } from "@/lib/care/profile";
import { insertCareExpertAlert } from "@/lib/care/expert-alert";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type CareBookingActionResult =
  | { ok: true; id: string; token: string }
  | { ok: false; code: "validation" | "slot_taken" | "rate_limit" | "error"; message: string; fields?: Record<string, string> };

function fieldErrors(error: { issues: { path: (string | number)[]; message: string }[] }) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-forwarded-for") ?? list.get("x-real-ip") ?? "unknown";
  return forwarded.split(",")[0]?.trim() || "unknown";
}

async function allowThrottle(key: string, max: number) {
  const db = getServiceRoleClient();
  if (!db) return true;
  const { data, error } = await db.from("care_booking_throttle").select("hits, window_start").eq("key", key).maybeSingle();
  if (error) return true;
  const now = Date.now();
  if (!data || now - new Date(String(data.window_start)).getTime() > 60 * 60 * 1000) {
    await db.from("care_booking_throttle").upsert({ key, hits: 1, window_start: new Date().toISOString() });
    return true;
  }
  if (Number(data.hits) >= max) return false;
  await db.from("care_booking_throttle").update({ hits: Number(data.hits) + 1 }).eq("key", key);
  return true;
}

async function slotStillOpen(expertId: string, serviceId: string, startIso: string, format: string) {
  const db = getServiceRoleClient();
  if (!db) return false;
  const start = new Date(startIso);
  const slots = await loadAvailableCareSlots({
    expertId,
    serviceId,
    from: new Date(start.getTime() - 60_000),
    to: new Date(start.getTime() + 60_000),
  });
  if (slots.length) {
    return slots.some((slot) => {
      const sameTime = Math.abs(slot.startsAt.getTime() - start.getTime()) < 1000;
      return sameTime && slot.format === format;
    });
  }
  const { data: clash } = await db
    .from("care_bookings")
    .select("id")
    .eq("expert_id", expertId)
    .eq("status", "confirmed")
    .lt("starts_at", new Date(start.getTime() + 60_000).toISOString())
    .gt("ends_at", start.toISOString())
    .limit(1);
  return !clash?.length;
}

export async function createCareBooking(raw: unknown): Promise<CareBookingActionResult> {
  const parsed = careBookingInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "validation", message: "Vérifiez les champs indiqués.", fields: fieldErrors(parsed.error) };
  }
  const input = parsed.data;
  const profile = await loadPublishedCareProfile(input.slug);
  const service = profile?.services.find((item) => item.id === input.serviceId);
  if (!profile || !service) {
    return { ok: false, code: "error", message: "Cette fiche n’est plus disponible." };
  }
  if (!service.formats.includes(input.format)) {
    return { ok: false, code: "validation", message: "Ce format n’est pas proposé pour cette séance.", fields: { format: "Format indisponible." } };
  }
  const start = new Date(input.start);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, code: "validation", message: "Créneau invalide.", fields: { start: "Créneau invalide." } };
  }
  const ip = await clientIp();
  const emailKey = input.email.trim().toLowerCase();
  if (!(await allowThrottle(`ip:${ip}`, 8)) || !(await allowThrottle(`email:${emailKey}`, 4))) {
    return { ok: false, code: "rate_limit", message: "Trop de tentatives. Réessayez dans une heure." };
  }
  const open = await slotStillOpen(profile.expert_id, service.id, start.toISOString(), input.format);
  if (!open) {
    return {
      ok: false,
      code: "slot_taken",
      message: "Ce créneau vient d’être pris. Choisissez un autre horaire.",
    };
  }
  const db = getServiceRoleClient();
  if (!db) return { ok: false, code: "error", message: "Réservation indisponible pour le moment." };
  const endsAt = new Date(start.getTime() + service.duration_min * 60_000);
  const { data, error } = await db
    .from("care_bookings")
    .insert({
      expert_id: profile.expert_id,
      service_id: service.id,
      starts_at: start.toISOString(),
      ends_at: endsAt.toISOString(),
      format: input.format,
      status: "confirmed",
      for_whom: input.forWhom,
      domain: resolveCareBookingDomain(input.domain, service.domain),
      client_first_name: input.firstName,
      client_last_name: input.lastName,
      client_email: emailKey,
      client_phone: input.phone,
      child_first_name: input.forWhom === "child" ? input.childFirstName : null,
      child_age: input.forWhom === "child" ? input.childAge : null,
      message: input.message?.trim() || null,
      payment_method: "on_site",
      consent_at: new Date().toISOString(),
    })
    .select("id, access_token")
    .single();
  if (error || !data) {
    const taken = String(error?.code ?? "") === "23P01" || /overlap|exclude/i.test(String(error?.message ?? ""));
    return {
      ok: false,
      code: taken ? "slot_taken" : "error",
      message: taken ? "Ce créneau vient d’être pris. Choisissez un autre horaire." : "La réservation n’a pas pu être enregistrée.",
    };
  }
  const token = String(data.access_token);
  const id = String(data.id);
  const when = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(start);
  await insertCareExpertAlert({
    expertId: profile.expert_id,
    message: `${input.firstName} ${input.lastName} · ${service.name} · ${when}`,
  });
  const booking = await loadCareBookingByToken(id, token);
  if (booking) await sendCareBookingEmails(booking);
  return { ok: true, id, token };
}

export async function cancelCareBooking(id: string, token: string): Promise<CareBookingActionResult> {
  const db = getServiceRoleClient();
  if (!db) return { ok: false, code: "error", message: "Annulation indisponible." };
  const { data, error } = await db.rpc("get_care_booking_by_token", { p_id: id, p_token: token });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return { ok: false, code: "error", message: "Réservation introuvable." };
  if (String(row.status) !== "confirmed") {
    return { ok: false, code: "error", message: "Ce rendez-vous n’est plus confirmé." };
  }
  const { data: profile } = await db
    .from("care_profiles")
    .select("display_name, cancellation_hours")
    .eq("expert_id", row.expert_id)
    .maybeSingle();
  const hours = Number(profile?.cancellation_hours) || 24;
  if (!canCancelCareBooking(String(row.starts_at), hours)) {
    return {
      ok: false,
      code: "error",
      message: `L’annulation n’est plus possible (délai de ${hours} h).`,
    };
  }
  const { error: updateError } = await db.from("care_bookings").update({ status: "cancelled_client" }).eq("id", id);
  if (updateError) return { ok: false, code: "error", message: "Annulation impossible." };
  const booking = await loadCareBookingByToken(id, token);
  if (booking) await sendCareCancellationEmails(booking, "client");
  return { ok: true, id, token };
}
