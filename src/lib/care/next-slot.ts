import { unstable_cache } from "next/cache";
import { buildAvailableSlots, type CareRuleFormat, type CareSessionFormat } from "@/lib/care/available-slots";
import { getServiceRoleClient } from "@/lib/supabase/server";

function asTime(value: unknown) {
  const text = String(value ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : "09:00";
}

function asFormat(value: unknown): CareRuleFormat {
  return value === "cabinet" || value === "visio" || value === "both" ? value : "visio";
}

async function computeNextCareSlotIso(expertId: string): Promise<string | null> {
  const db = getServiceRoleClient();
  if (!db) return null;
  const from = new Date();
  const to = new Date(from.getTime() + 14 * 24 * 60 * 60 * 1000);
  const [services, rules, exceptions, bookings] = await Promise.all([
    db.from("care_services").select("duration_min, formats, active").eq("expert_id", expertId).eq("active", true),
    db.from("care_availability_rules").select("weekday, start_time, end_time, format").eq("expert_id", expertId),
    db.from("care_availability_exceptions").select("date, is_closed, start_time, end_time").eq("expert_id", expertId),
    db
      .from("care_bookings")
      .select("starts_at, ends_at")
      .eq("expert_id", expertId)
      .eq("status", "confirmed")
      .gte("ends_at", from.toISOString()),
  ]);
  if (services.error || rules.error || !services.data?.length) return null;
  const mappedRules = (rules.data ?? []).map((row) => ({
    weekday: Number(row.weekday),
    startTime: asTime(row.start_time),
    endTime: asTime(row.end_time),
    format: asFormat(row.format),
  }));
  const mappedExceptions = (exceptions.data ?? []).map((row) => ({
    date: String(row.date ?? "").slice(0, 10),
    isClosed: row.is_closed === true,
    startTime: row.start_time ? asTime(row.start_time) : null,
    endTime: row.end_time ? asTime(row.end_time) : null,
  }));
  const mappedBookings = (bookings.data ?? []).map((row) => ({
    startsAt: new Date(String(row.starts_at)),
    endsAt: new Date(String(row.ends_at)),
  }));
  let best: Date | null = null;
  for (const service of services.data) {
    const formats = (Array.isArray(service.formats) ? service.formats : ["visio"]).filter(
      (item): item is CareSessionFormat => item === "cabinet" || item === "visio",
    );
    const slots = buildAvailableSlots({
      rules: mappedRules,
      exceptions: mappedExceptions,
      bookings: mappedBookings,
      serviceFormats: formats.length ? formats : ["visio"],
      durationMin: Number(service.duration_min) || 45,
      from,
      to,
      now: from,
    });
    const first = slots[0]?.startsAt;
    if (first && (!best || first < best)) best = first;
  }
  return best ? best.toISOString() : null;
}

export const loadNextCareSlotIso = unstable_cache(computeNextCareSlotIso, ["care-next-slot"], {
  revalidate: 300,
});
