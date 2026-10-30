import {
  addDaysYmd,
  parisWallToUtc,
  weekdayFromYmd,
  type CareAvailabilityException,
  type CareAvailabilityRule,
  type CareSessionFormat,
} from "@/lib/care/available-slots";
import { ensureCareProfile, ensureDefaultCareService } from "@/lib/care/ensure-profile";
import { revalidateCarePublicProfile } from "@/lib/care/revalidate-profile";
import { revalidateTag } from "next/cache";
import type { ExpertSlot, SlotFormat, SlotKind } from "@/lib/expert/space-model";
import { getServiceRoleClient } from "@/lib/supabase/server";

function asTime(value: unknown) {
  const text = String(value ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : "09:00";
}

function slotFormatFromCare(format: string | null | undefined): SlotFormat {
  return format === "cabinet" || format === "presentiel" ? "presentiel" : "visio";
}

function careFormatFromSlot(format: SlotFormat): CareSessionFormat {
  return format === "presentiel" ? "cabinet" : "visio";
}

function ruleFormatFromSlot(format: SlotFormat): "visio" | "cabinet" {
  return format === "presentiel" ? "cabinet" : "visio";
}

export function expandCareRulesToAgendaSlots(input: {
  rules: Array<CareAvailabilityRule & { id?: string }>;
  exceptions: Array<CareAvailabilityException & { id?: string }>;
  fromYmd: string;
  toYmd: string;
}): ExpertSlot[] {
  const slots: ExpertSlot[] = [];
  for (let cursor = input.fromYmd; cursor <= input.toYmd; cursor = addDaysYmd(cursor, 1)) {
    const weekday = weekdayFromYmd(cursor);
    const dayExceptions = input.exceptions.filter((item) => item.date === cursor);
    for (const rule of input.rules.filter((item) => item.weekday === weekday)) {
      const start = parisWallToUtc(cursor, rule.startTime);
      const end = parisWallToUtc(cursor, rule.endTime);
      if (end <= start) continue;
      const closed = dayExceptions.some((item) => {
        if (!item.isClosed) return false;
        if (!item.startTime && !item.endTime) return true;
        const closedStart = parisWallToUtc(cursor, item.startTime || "00:00");
        const closedEnd = parisWallToUtc(cursor, item.endTime || "23:59");
        return start < closedEnd && end > closedStart;
      });
      if (closed) continue;
      slots.push({
        id: `care-rule:${rule.id ?? `${weekday}-${rule.startTime}`}:${cursor}`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        format: slotFormatFromCare(rule.format === "both" ? "visio" : rule.format),
        kind: "disponible",
        location: rule.format === "cabinet" ? "Cabinet" : "Visio",
        missionId: null,
        title: null,
        client: null,
      });
    }
    for (const item of dayExceptions) {
      if (item.isClosed) {
        const start = parisWallToUtc(cursor, item.startTime || "00:00");
        const end = item.endTime ? parisWallToUtc(cursor, item.endTime) : parisWallToUtc(addDaysYmd(cursor, 1), "00:00");
        slots.push({
          id: `care-exc:${item.id ?? `${cursor}-closed`}`,
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          format: "visio",
          kind: "indisponible",
          location: "",
          missionId: null,
          title: null,
          client: null,
        });
        continue;
      }
      if (!item.startTime || !item.endTime) continue;
      slots.push({
        id: `care-exc:${item.id ?? `${cursor}-open`}`,
        startsAt: parisWallToUtc(cursor, item.startTime).toISOString(),
        endsAt: parisWallToUtc(cursor, item.endTime).toISOString(),
        format: "visio",
        kind: "disponible",
        location: "Visio",
        missionId: null,
        title: null,
        client: null,
      });
    }
  }
  return slots;
}

export async function loadCareAgendaSlots(expertId: string): Promise<ExpertSlot[]> {
  const db = getServiceRoleClient();
  if (!db) return [];
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + 56);
  const fromYmd = from.toISOString().slice(0, 10);
  const toYmd = to.toISOString().slice(0, 10);
  const [rules, exceptions, bookings, profile] = await Promise.all([
    db.from("care_availability_rules").select("id, weekday, start_time, end_time, format").eq("expert_id", expertId),
    db.from("care_availability_exceptions").select("id, date, is_closed, start_time, end_time").eq("expert_id", expertId),
    db
      .from("care_bookings")
      .select("id, service_id, starts_at, ends_at, format, status, client_first_name, client_last_name, client_email, client_phone, message")
      .eq("expert_id", expertId)
      .in("status", ["confirmed", "completed"])
      .gte("ends_at", from.toISOString())
      .lte("starts_at", to.toISOString()),
    db.from("care_profiles").select("slug").eq("expert_id", expertId).maybeSingle(),
  ]);
  const slug = profile.data?.slug ? String(profile.data.slug) : null;
  if (rules.error && /does not exist|schema cache|PGRST205/i.test(rules.error.message ?? "")) return [];
  const expanded = expandCareRulesToAgendaSlots({
    rules: (rules.data ?? []).map((row) => ({
      id: String(row.id),
      weekday: Number(row.weekday),
      startTime: asTime(row.start_time),
      endTime: asTime(row.end_time),
      format: row.format === "cabinet" || row.format === "both" ? row.format : "visio",
    })),
    exceptions: (exceptions.data ?? []).map((row) => ({
      id: String(row.id),
      date: String(row.date).slice(0, 10),
      isClosed: row.is_closed !== false,
      startTime: row.start_time ? asTime(row.start_time) : null,
      endTime: row.end_time ? asTime(row.end_time) : null,
    })),
    fromYmd,
    toYmd,
  });
  const serviceIds = [...new Set((bookings.data ?? []).map((row) => String(row.service_id ?? "")).filter(Boolean))];
  const { data: services } = serviceIds.length
    ? await db.from("care_services").select("id, name").in("id", serviceIds)
    : { data: [] as Array<{ id: string; name: string | null }> };
  const serviceName = new Map((services ?? []).map((row) => [String(row.id), String(row.name ?? "Séance")]));
  const booked: ExpertSlot[] = (bookings.data ?? []).map((row) => ({
    id: `care-book:${row.id}`,
    startsAt: String(row.starts_at),
    endsAt: String(row.ends_at),
    format: slotFormatFromCare(String(row.format)),
    kind: "rendez_vous" as SlotKind,
    location: row.format === "cabinet" ? "Cabinet" : "Visio",
    missionId: String(row.id),
    title: serviceName.get(String(row.service_id)) || "Rendez-vous",
    client: [row.client_first_name, row.client_last_name].filter(Boolean).join(" ").trim() || null,
    clientEmail: row.client_email ? String(row.client_email) : null,
    clientPhone: row.client_phone ? String(row.client_phone) : null,
    serviceName: serviceName.get(String(row.service_id)) || "Rendez-vous",
    notes: row.message ? String(row.message) : null,
    practitionerSlug: slug,
  }));
  return [...expanded, ...booked];
}

export async function writeCareAgendaSlot(input: {
  expertId: string;
  date: string;
  start: string;
  end: string;
  format: SlotFormat;
  kind: SlotKind;
  weekly?: boolean;
  client?: { first_name: string; last_name: string; email: string } | null;
}) {
  const db = getServiceRoleClient();
  if (!db) return { ok: false as const, error: "Service indisponible" };
  const slug = await ensureCareProfile(db, input.expertId);
  if (input.kind === "disponible") await ensureDefaultCareService(db, input.expertId);
  const careFormat = careFormatFromSlot(input.format);
  const start = parisWallToUtc(input.date, input.start);
  const end = parisWallToUtc(input.date, input.end);
  if (end <= start) return { ok: false as const, error: "L'heure de fin doit être après le début." };

  if (input.kind === "disponible") {
    if (input.weekly) {
      const { error } = await db.from("care_availability_rules").insert({
        expert_id: input.expertId,
        weekday: weekdayFromYmd(input.date),
        start_time: input.start,
        end_time: input.end,
        format: ruleFormatFromSlot(input.format),
      });
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await db.from("care_availability_exceptions").insert({
        expert_id: input.expertId,
        date: input.date,
        is_closed: false,
        start_time: input.start,
        end_time: input.end,
      });
      if (error) return { ok: false as const, error: error.message };
    }
  } else if (input.kind === "indisponible" || input.kind === "formation") {
    const { error } = await db.from("care_availability_exceptions").insert({
      expert_id: input.expertId,
      date: input.date,
      is_closed: true,
      start_time: input.start,
      end_time: input.end,
    });
    if (error) return { ok: false as const, error: error.message };
  } else if (input.kind === "rendez_vous") {
    const service = await ensureDefaultCareService(db, input.expertId);
    const first = input.client?.first_name?.trim() || "Client";
    const last = input.client?.last_name?.trim() || "Agenda";
    const email = input.client?.email?.trim();
    if (!email) return { ok: false as const, error: "Choisissez un client du CRM pour le rendez-vous." };
    const { error } = await db.from("care_bookings").insert({
      expert_id: input.expertId,
      service_id: service.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      format: careFormat,
      status: "confirmed",
      for_whom: "self",
      domain: service.domain,
      client_first_name: first,
      client_last_name: last,
      client_email: email,
      payment_method: "on_site",
      consent_at: new Date().toISOString(),
    });
    if (error) {
      if (/no_overlap|exclusion|overlap/i.test(error.message)) {
        return { ok: false as const, error: "Ce créneau chevauche un rendez-vous Care existant." };
      }
      return { ok: false as const, error: error.message };
    }
  }

  revalidateCarePublicProfile(slug);
  revalidateTag("care-slots");
  return { ok: true as const };
}
