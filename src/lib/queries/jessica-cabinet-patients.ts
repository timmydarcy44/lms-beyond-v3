"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export type JessicaCabinetPatientListItem = {
  id: string;
  externalId: string;
  profileId: string | null;
  gender: string | null;
  lastName: string | null;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  pastAppointmentsCount: number;
  lastAppointmentAt: string | null;
  futureAppointmentsCount: number;
  nextAppointmentAt: string | null;
  lastAppointmentReason: string | null;
  sourceCreatedAt: string | null;
  hasLmsAccount: boolean;
};

export type JessicaCabinetPatientDetails = JessicaCabinetPatientListItem & {
  emailSecondary: string | null;
  phoneSecondary: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  notes: string | null;
  anamnesis: string | null;
  communicationNotes: string | null;
  proCancellationsCount: number;
  patientCancellationsCount: number;
  noShowCount: number;
  lastAppointmentLocation: string | null;
  importedAt: string;
  updatedAt: string;
  profileEmail: string | null;
};

function mapListRow(row: Record<string, unknown>): JessicaCabinetPatientListItem {
  return {
    id: String(row.id),
    externalId: String(row.external_id),
    profileId: row.profile_id ? String(row.profile_id) : null,
    gender: row.gender ? String(row.gender) : null,
    lastName: row.last_name ? String(row.last_name) : null,
    firstName: row.first_name ? String(row.first_name) : null,
    email: row.email ? String(row.email) : null,
    phone: row.phone ? String(row.phone) : null,
    birthDate: row.birth_date ? String(row.birth_date) : null,
    pastAppointmentsCount: Number(row.past_appointments_count ?? 0),
    lastAppointmentAt: row.last_appointment_at ? String(row.last_appointment_at) : null,
    futureAppointmentsCount: Number(row.future_appointments_count ?? 0),
    nextAppointmentAt: row.next_appointment_at ? String(row.next_appointment_at) : null,
    lastAppointmentReason: row.last_appointment_reason ? String(row.last_appointment_reason) : null,
    sourceCreatedAt: row.source_created_at ? String(row.source_created_at) : null,
    hasLmsAccount: Boolean(row.profile_id),
  };
}

function mapDetailRow(
  row: Record<string, unknown>,
  profileEmail: string | null,
): JessicaCabinetPatientDetails {
  return {
    ...mapListRow(row),
    emailSecondary: row.email_secondary ? String(row.email_secondary) : null,
    phoneSecondary: row.phone_secondary ? String(row.phone_secondary) : null,
    address: row.address ? String(row.address) : null,
    city: row.city ? String(row.city) : null,
    postalCode: row.postal_code ? String(row.postal_code) : null,
    country: row.country ? String(row.country) : null,
    notes: row.notes ? String(row.notes) : null,
    anamnesis: row.anamnesis ? String(row.anamnesis) : null,
    communicationNotes: row.communication_notes ? String(row.communication_notes) : null,
    proCancellationsCount: Number(row.pro_cancellations_count ?? 0),
    patientCancellationsCount: Number(row.patient_cancellations_count ?? 0),
    noShowCount: Number(row.no_show_count ?? 0),
    lastAppointmentLocation: row.last_appointment_location ? String(row.last_appointment_location) : null,
    importedAt: String(row.imported_at),
    updatedAt: String(row.updated_at),
    profileEmail,
  };
}

export async function getJessicaCabinetPatientsList(): Promise<JessicaCabinetPatientListItem[]> {
  if (!(await isSuperAdmin())) return [];

  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("jessica_cabinet_patients")
    .select(
      "id, external_id, profile_id, gender, last_name, first_name, email, phone, birth_date, past_appointments_count, last_appointment_at, future_appointments_count, next_appointment_at, last_appointment_reason, source_created_at",
    )
    .order("last_name", { ascending: true, nullsFirst: false })
    .order("first_name", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[getJessicaCabinetPatientsList]", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapListRow(row as Record<string, unknown>));
}

export async function getJessicaCabinetPatientDetails(
  id: string,
): Promise<JessicaCabinetPatientDetails | null> {
  if (!(await isSuperAdmin())) return null;

  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jessica_cabinet_patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[getJessicaCabinetPatientDetails]", error.message);
    return null;
  }

  let profileEmail: string | null = null;
  if (data.profile_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", data.profile_id)
      .maybeSingle();
    profileEmail = profile?.email ? String(profile.email) : null;
  }

  return mapDetailRow(data as Record<string, unknown>, profileEmail);
}

export async function getJessicaCabinetPatientByProfileId(
  profileId: string,
): Promise<JessicaCabinetPatientDetails | null> {
  if (!(await isSuperAdmin())) return null;

  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jessica_cabinet_patients")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error || !data) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  return mapDetailRow(data as Record<string, unknown>, profile?.email ? String(profile.email) : null);
}

export async function getJessicaCabinetPatientsStats(): Promise<{
  total: number;
  withLmsAccount: number;
  withFutureAppointment: number;
}> {
  if (!(await isSuperAdmin())) {
    return { total: 0, withLmsAccount: 0, withFutureAppointment: 0 };
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return { total: 0, withLmsAccount: 0, withFutureAppointment: 0 };

  const [totalRes, lmsRes, futureRes] = await Promise.all([
    supabase.from("jessica_cabinet_patients").select("id", { count: "exact", head: true }),
    supabase
      .from("jessica_cabinet_patients")
      .select("id", { count: "exact", head: true })
      .not("profile_id", "is", null),
    supabase
      .from("jessica_cabinet_patients")
      .select("id", { count: "exact", head: true })
      .gt("future_appointments_count", 0),
  ]);

  return {
    total: totalRes.count ?? 0,
    withLmsAccount: lmsRes.count ?? 0,
    withFutureAppointment: futureRes.count ?? 0,
  };
}
