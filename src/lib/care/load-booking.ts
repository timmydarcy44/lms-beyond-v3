import { getServiceRoleClient } from "@/lib/supabase/server";
import type { CareBookingForWhom, CareBookingStatus } from "@/lib/care/types";
import type { CareSessionFormat as Format } from "@/lib/care/available-slots";

export type CareBookingRecord = {
  id: string;
  expert_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  format: Format;
  status: CareBookingStatus;
  for_whom: CareBookingForWhom;
  domain: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string | null;
  child_first_name: string | null;
  child_age: number | null;
  message: string | null;
  payment_method: string;
  access_token: string;
  cancellation_hours: number;
  practitioner_name: string;
  practitioner_slug: string;
  practitioner_email: string | null;
  practitioner_address: string | null;
  offers_visio: boolean;
  service_name: string;
  duration_min: number;
  price_cents: number;
};

function mapBooking(row: Record<string, unknown>, extras: Partial<CareBookingRecord>): CareBookingRecord {
  return {
    id: String(row.id),
    expert_id: String(row.expert_id),
    service_id: String(row.service_id),
    starts_at: String(row.starts_at),
    ends_at: String(row.ends_at),
    format: row.format === "cabinet" ? "cabinet" : "visio",
    status: String(row.status) as CareBookingStatus,
    for_whom: String(row.for_whom) as CareBookingForWhom,
    domain: String(row.domain ?? ""),
    client_first_name: String(row.client_first_name ?? ""),
    client_last_name: String(row.client_last_name ?? ""),
    client_email: String(row.client_email ?? ""),
    client_phone: row.client_phone ? String(row.client_phone) : null,
    child_first_name: row.child_first_name ? String(row.child_first_name) : null,
    child_age: row.child_age == null ? null : Number(row.child_age),
    message: row.message ? String(row.message) : null,
    payment_method: String(row.payment_method ?? "on_site"),
    access_token: String(row.access_token ?? ""),
    cancellation_hours: extras.cancellation_hours ?? 24,
    practitioner_name: extras.practitioner_name ?? "",
    practitioner_slug: extras.practitioner_slug ?? "",
    practitioner_email: extras.practitioner_email ?? null,
    practitioner_address: extras.practitioner_address ?? null,
    offers_visio: extras.offers_visio ?? false,
    service_name: extras.service_name ?? "",
    duration_min: extras.duration_min ?? 0,
    price_cents: extras.price_cents ?? 0,
  };
}

export async function loadCareBookingByToken(id: string, token: string): Promise<CareBookingRecord | null> {
  const db = getServiceRoleClient();
  if (!db || !id || !token) return null;
  const { data, error } = await db.rpc("get_care_booking_by_token", { p_id: id, p_token: token });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  return hydrateBooking(db, row as Record<string, unknown>);
}

async function hydrateBooking(
  db: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  row: Record<string, unknown>,
): Promise<CareBookingRecord | null> {
  const expertId = String(row.expert_id);
  const serviceId = String(row.service_id);
  const [profile, service, expert] = await Promise.all([
    db.from("care_profiles").select("display_name, slug, cancellation_hours, address, offers_visio").eq("expert_id", expertId).maybeSingle(),
    db.from("care_services").select("name, duration_min, price_cents").eq("id", serviceId).maybeSingle(),
    db.from("experts").select("email").eq("id", expertId).maybeSingle(),
  ]);
  return mapBooking(row, {
    cancellation_hours: Number(profile.data?.cancellation_hours) || 24,
    practitioner_name: String(profile.data?.display_name ?? ""),
    practitioner_slug: String(profile.data?.slug ?? ""),
    practitioner_email: expert.data?.email ? String(expert.data.email) : null,
    practitioner_address: profile.data?.address ? String(profile.data.address) : null,
    offers_visio: profile.data?.offers_visio === true,
    service_name: String(service.data?.name ?? ""),
    duration_min: Number(service.data?.duration_min) || 0,
    price_cents: Number(service.data?.price_cents) || 0,
  });
}

export async function loadCareBookingsForPatient(email: string): Promise<CareBookingRecord[]> {
  const db = getServiceRoleClient();
  const normalized = email.trim().toLowerCase();
  if (!db || !normalized) return [];
  const { data } = await db
    .from("care_bookings")
    .select("*")
    .eq("client_email", normalized)
    .order("starts_at", { ascending: false })
    .limit(40);
  const rows: CareBookingRecord[] = [];
  for (const row of data ?? []) {
    const booking = await hydrateBooking(db, row as Record<string, unknown>);
    if (booking) rows.push(booking);
  }
  return rows;
}

export function canCancelCareBooking(startsAt: string, hours: number, now = new Date()) {
  return new Date(startsAt).getTime() - now.getTime() >= hours * 60 * 60 * 1000;
}
