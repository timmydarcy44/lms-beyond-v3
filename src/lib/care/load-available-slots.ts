import {
  buildAvailableSlots,
  type CareRuleFormat,
  type CareSessionFormat,
} from "@/lib/care/available-slots";
import { ensureDefaultCareService } from "@/lib/care/ensure-profile";
import { getServiceRoleClient } from "@/lib/supabase/server";

function asTime(value: unknown) {
  const text = String(value ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? text : "09:00";
}

function asFormat(value: unknown): CareRuleFormat {
  return value === "cabinet" || value === "visio" || value === "both" ? value : "visio";
}

export async function loadAvailableCareSlots(input: {
  expertId: string;
  serviceId?: string | null;
  from: Date;
  to: Date;
}) {
  const db = getServiceRoleClient();
  if (!db) return [];
  const [services, rules, exceptions, bookings] = await Promise.all([
    db.from("care_services").select("id, duration_min, formats, active").eq("expert_id", input.expertId).eq("active", true),
    db.from("care_availability_rules").select("weekday, start_time, end_time, format").eq("expert_id", input.expertId),
    db.from("care_availability_exceptions").select("date, is_closed, start_time, end_time").eq("expert_id", input.expertId),
    db
      .from("care_bookings")
      .select("starts_at, ends_at")
      .eq("expert_id", input.expertId)
      .eq("status", "confirmed")
      .gte("ends_at", input.from.toISOString()),
  ]);
  let catalog = services.data ?? [];
  if (!catalog.length) {
    await ensureDefaultCareService(db, input.expertId);
    const retried = await db
      .from("care_services")
      .select("id, duration_min, formats, active")
      .eq("expert_id", input.expertId)
      .eq("active", true);
    catalog = retried.data ?? [];
  }
  const service =
    catalog.find((row) => !input.serviceId || String(row.id) === input.serviceId) ?? catalog[0];
  const durationMin = Math.max(15, Number(service?.duration_min) || 60);
  const formats = (Array.isArray(service?.formats) ? service.formats : ["visio", "cabinet"]).filter(
    (item): item is CareSessionFormat => item === "cabinet" || item === "visio",
  );
  return buildAvailableSlots({
    rules: (rules.data ?? []).map((row) => ({
      weekday: Number(row.weekday),
      startTime: asTime(row.start_time),
      endTime: asTime(row.end_time),
      format: asFormat(row.format),
    })),
    exceptions: (exceptions.data ?? []).map((row) => ({
      date: String(row.date ?? "").slice(0, 10),
      isClosed: row.is_closed === true,
      startTime: row.start_time ? asTime(row.start_time) : null,
      endTime: row.end_time ? asTime(row.end_time) : null,
    })),
    bookings: (bookings.data ?? []).map((row) => ({
      startsAt: new Date(String(row.starts_at)),
      endsAt: new Date(String(row.ends_at)),
    })),
    serviceFormats: formats.length ? formats : ["visio"],
    durationMin,
    from: input.from,
    to: input.to,
    now: new Date(),
  });
}
