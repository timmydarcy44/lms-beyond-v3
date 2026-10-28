import { getSession } from "@/lib/auth/session";
import { CARE_FOR_WHOM_LABELS } from "@/lib/care/booking-schema";
import { slugifyCareName } from "@/lib/care/completeness";
import { loadCareProfileBySlug, type CarePublicProfile } from "@/lib/care/profile";
import { requireCarePage } from "@/lib/expert/care-page";
import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareRuleFormat, CareSessionFormat } from "@/lib/care/available-slots";

export type CareAvailabilityRuleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  format: CareRuleFormat;
};

export type CareAvailabilityExceptionRow = {
  id: string;
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

export type CareExpertBookingRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  format: CareSessionFormat;
  status: string;
  for_whom: keyof typeof CARE_FOR_WHOM_LABELS;
  message: string | null;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  child_first_name: string | null;
  child_age: number | null;
  service_name: string;
};

export type CareExpertWorkspace = {
  profile: CarePublicProfile;
  rules: CareAvailabilityRuleRow[];
  exceptions: CareAvailabilityExceptionRow[];
  bookings: CareExpertBookingRow[];
};

async function uniqueSlug(db: NonNullable<ReturnType<typeof getServiceRoleClient>>, base: string, expertId: string) {
  let slug = base || "praticien";
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const { data } = await db.from("care_profiles").select("expert_id").eq("slug", candidate).maybeSingle();
    if (!data || String(data.expert_id) === expertId) return candidate;
  }
  return `${slug}-${expertId.slice(0, 8)}`;
}

export async function loadCareExpertWorkspace(): Promise<CareExpertWorkspace> {
  await requireCarePage();
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) throw new Error("unavailable");
  const { data: existing } = await db.from("care_profiles").select("slug, is_care").eq("expert_id", session.id).maybeSingle();
  if (existing && existing.is_care !== true) {
    await db.from("care_profiles").update({ is_care: true, updated_at: new Date().toISOString() }).eq("expert_id", session.id);
  }
  if (!existing) {
    const { data: expert } = await db.from("experts").select("first_name, last_name").eq("id", session.id).maybeSingle();
    const display = [expert?.first_name, expert?.last_name].filter(Boolean).join(" ").trim() || "Praticien";
    const slug = await uniqueSlug(db, slugifyCareName(display), session.id);
    await db.from("care_profiles").insert({
      expert_id: session.id,
      slug,
      is_care: true,
      published: false,
      display_name: display,
    });
  }
  const { data: row } = await db.from("care_profiles").select("slug").eq("expert_id", session.id).maybeSingle();
  const profile = await loadCareProfileBySlug(String(row?.slug ?? ""), { viewerId: session.id });
  if (!profile) throw new Error("unavailable");
  const [rules, exceptions, bookings] = await Promise.all([
    db.from("care_availability_rules").select("*").eq("expert_id", session.id).order("weekday", { ascending: true }).order("start_time", { ascending: true }),
    db.from("care_availability_exceptions").select("*").eq("expert_id", session.id).order("date"),
    db.from("care_bookings").select("*").eq("expert_id", session.id).order("starts_at", { ascending: false }).limit(80),
  ]);
  const serviceIds = [...new Set((bookings.data ?? []).map((item) => String(item.service_id)))];
  const { data: services } = serviceIds.length
    ? await db.from("care_services").select("id, name").in("id", serviceIds)
    : { data: [] };
  const names = Object.fromEntries((services ?? []).map((item) => [String(item.id), String(item.name)]));
  return {
    profile,
    rules: (rules.data ?? []).map((item) => ({
      id: String(item.id),
      weekday: Number(item.weekday),
      start_time: String(item.start_time).slice(0, 5),
      end_time: String(item.end_time).slice(0, 5),
      format: (item.format === "cabinet" || item.format === "both" ? item.format : "visio") as CareRuleFormat,
    })),
    exceptions: (exceptions.data ?? []).map((item) => ({
      id: String(item.id),
      date: String(item.date).slice(0, 10),
      is_closed: item.is_closed !== false,
      start_time: item.start_time ? String(item.start_time).slice(0, 5) : null,
      end_time: item.end_time ? String(item.end_time).slice(0, 5) : null,
    })),
    bookings: (bookings.data ?? []).map((item) => ({
      id: String(item.id),
      starts_at: String(item.starts_at),
      ends_at: String(item.ends_at),
      format: item.format === "cabinet" ? "cabinet" : "visio",
      status: String(item.status),
      for_whom: (item.for_whom === "child" || item.for_whom === "relative" ? item.for_whom : "self") as keyof typeof CARE_FOR_WHOM_LABELS,
      message: item.message ? String(item.message) : null,
      client_first_name: String(item.client_first_name ?? ""),
      client_last_name: String(item.client_last_name ?? ""),
      client_email: String(item.client_email ?? ""),
      child_first_name: item.child_first_name ? String(item.child_first_name) : null,
      child_age: item.child_age == null ? null : Number(item.child_age),
      service_name: names[String(item.service_id)] ?? "Séance",
    })),
  };
}
