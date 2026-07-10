"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { parseClientName } from "@/lib/jessica-contentin/parse-client-name";
import { getJessicaUsersList, type JessicaUserListItem } from "@/lib/queries/jessica-users";
import {
  appointmentDurationHours,
  appointmentRevenue,
  estimateCabinetRevenueFromPastCount,
  extractEmailFromAppointmentNotes,
  JESSICA_CABINET_HOURLY_RATE,
} from "@/lib/jessica-contentin/cabinet-revenue";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

export type JessicaCrmContact = JessicaUserListItem & {
  patientId: string | null;
  cabinetRevenue: number;
  lmsRevenue: number;
  appointmentHours: number;
  pastAppointmentsCount: number;
  futureAppointmentsCount: number;
  nextAppointmentAt: string | null;
  lastAppointmentAt: string | null;
  contactKind: "both" | "lms" | "patient";
};

export type JessicaMonthlyRevenue = {
  month: string;
  label: string;
  cabinetRevenue: number;
  lmsRevenue: number;
  totalRevenue: number;
  appointmentHours: number;
};

export type JessicaCrmRevenueSummary = {
  hourlyRate: number;
  totalCabinetRevenue: number;
  totalLmsRevenue: number;
  totalRevenue: number;
  monthly: JessicaMonthlyRevenue[];
};

type AppointmentRow = {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  guest_email: string | null;
  learner_id: string | null;
  notes: string | null;
  learner_notes: string | null;
  cabinet_patient_id: string | null;
};

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function resolveAppointmentEmail(row: AppointmentRow): string | null {
  if (row.guest_email) return row.guest_email.toLowerCase();
  return (
    extractEmailFromAppointmentNotes(row.notes) ??
    extractEmailFromAppointmentNotes(row.learner_notes)
  );
}

function isCountableAppointment(row: AppointmentRow, now: Date): boolean {
  if (row.status === "cancelled") return false;
  const end = new Date(row.end_time);
  return end <= now && ["confirmed", "completed", "pending"].includes(row.status);
}

export async function getJessicaCrmContacts(): Promise<JessicaCrmContact[]> {
  if (!(await isSuperAdmin())) return [];

  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  const [lmsUsers, patientsRes, jessicaRes] = await Promise.all([
    getJessicaUsersList(),
    supabase.from("jessica_cabinet_patients").select("*"),
    supabase.from("profiles").select("id").eq("email", JESSICA_CONTENTIN_EMAIL).maybeSingle(),
  ]);

  const patients = patientsRes.error ? [] : (patientsRes.data ?? []);
  const jessicaId = jessicaRes.data?.id;

  let appointments: AppointmentRow[] = [];
  if (jessicaId) {
    const { data, error } = await supabase
      .from("appointments")
      .select(
        "id, start_time, end_time, status, guest_email, learner_id, notes, learner_notes, cabinet_patient_id",
      )
      .eq("super_admin_id", jessicaId);
    if (error) {
      console.error("[getJessicaCrmContacts] appointments:", error.message);
    } else {
      appointments = (data ?? []) as AppointmentRow[];
    }
  }

  const now = new Date();
  const lmsByEmail = new Map(lmsUsers.map((u) => [u.email.toLowerCase(), u]));
  const lmsById = new Map(lmsUsers.map((u) => [u.id, u]));
  const merged = new Map<string, JessicaCrmContact>();

  for (const p of patients) {
    const email = p.email ? String(p.email).toLowerCase() : null;
    const profileId = p.profile_id ? String(p.profile_id) : null;
    const lms = profileId ? lmsById.get(profileId) : email ? lmsByEmail.get(email) : undefined;
    const key = profileId ?? email ?? String(p.id);

    merged.set(key, {
      id: profileId ?? String(p.id),
      patientId: String(p.id),
      email: email ?? lms?.email ?? "",
      firstName: p.first_name ? String(p.first_name) : lms?.firstName ?? null,
      lastName: p.last_name ? String(p.last_name) : lms?.lastName ?? null,
      fullName: lms?.fullName ?? ([p.first_name, p.last_name].filter(Boolean).join(" ") || null),
      phone: p.phone ? String(p.phone) : lms?.phone ?? null,
      createdAt: lms?.createdAt ?? (p.imported_at ? String(p.imported_at) : new Date().toISOString()),
      lastSignInAt: lms?.lastSignInAt ?? null,
      lmsRevenue: lms?.totalRevenue ?? 0,
      totalRevenue: lms?.totalRevenue ?? 0,
      purchaseCount: lms?.purchaseCount ?? 0,
      testCount: lms?.testCount ?? 0,
      assignedCatalogItemIds: lms?.assignedCatalogItemIds ?? [],
      cabinetRevenue: 0,
      appointmentHours: 0,
      pastAppointmentsCount: Number(p.past_appointments_count ?? 0),
      futureAppointmentsCount: Number(p.future_appointments_count ?? 0),
      nextAppointmentAt: p.next_appointment_at ? String(p.next_appointment_at) : null,
      lastAppointmentAt: p.last_appointment_at ? String(p.last_appointment_at) : null,
      contactKind: lms ? "both" : "patient",
    });
  }

  for (const u of lmsUsers) {
    const key = u.id;
    const emailKey = u.email?.toLowerCase();
    if (merged.has(key) || (emailKey && merged.has(emailKey))) continue;
    merged.set(key, {
      ...u,
      patientId: null,
      cabinetRevenue: 0,
      lmsRevenue: u.totalRevenue,
      appointmentHours: 0,
      pastAppointmentsCount: 0,
      futureAppointmentsCount: 0,
      nextAppointmentAt: null,
      lastAppointmentAt: null,
      contactKind: "lms",
    });
  }

  for (const apt of appointments) {
    if (!isCountableAppointment(apt, now)) continue;
    const email = resolveAppointmentEmail(apt);

    let contact: JessicaCrmContact | undefined;
    if (apt.cabinet_patient_id) {
      contact = [...merged.values()].find((c) => c.patientId === apt.cabinet_patient_id);
    }
    if (!contact && apt.learner_id) {
      contact = merged.get(apt.learner_id);
    }
    if (!contact && email) {
      contact = [...merged.values()].find((c) => c.email && c.email.toLowerCase() === email);
    }

    if (contact) {
      const hours = Math.max(0, appointmentDurationHours(apt.start_time, apt.end_time));
      const revenue = Math.max(0, appointmentRevenue(apt.start_time, apt.end_time));
      if (revenue > 0) {
        contact.appointmentHours += hours;
        contact.cabinetRevenue += revenue;
        contact.totalRevenue = contact.lmsRevenue + contact.cabinetRevenue;
      }
    }
  }

  for (const contact of merged.values()) {
    if (contact.cabinetRevenue <= 0 && contact.pastAppointmentsCount > 0) {
      const est = estimateCabinetRevenueFromPastCount(
        contact.pastAppointmentsCount,
        contact.lastAppointmentAt,
      );
      contact.appointmentHours = est.appointmentHours;
      contact.cabinetRevenue = est.totalRevenue;
      contact.totalRevenue = contact.lmsRevenue + contact.cabinetRevenue;
    } else {
      contact.cabinetRevenue = Math.max(0, contact.cabinetRevenue);
      contact.totalRevenue = contact.lmsRevenue + contact.cabinetRevenue;
    }
  }

  return [...merged.values()].sort((a, b) => {
    const nameA = [a.lastName, a.firstName].filter(Boolean).join(" ").toLowerCase();
    const nameB = [b.lastName, b.firstName].filter(Boolean).join(" ").toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export async function getJessicaCrmRevenueSummary(): Promise<JessicaCrmRevenueSummary> {
  const contacts = await getJessicaCrmContacts();
  const supabase = getServiceRoleClient();
  const monthlyMap = new Map<string, JessicaMonthlyRevenue>();

  const initMonth = (key: string) => {
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, {
        month: key,
        label: monthLabel(key),
        cabinetRevenue: 0,
        lmsRevenue: 0,
        totalRevenue: 0,
        appointmentHours: 0,
      });
    }
    return monthlyMap.get(key)!;
  };

  let totalCabinetRevenue = 0;
  let totalLmsRevenue = 0;

  for (const c of contacts) {
    totalCabinetRevenue += c.cabinetRevenue;
    totalLmsRevenue += c.lmsRevenue;
  }

  if (supabase) {
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (jessicaProfile?.id) {
      const now = new Date();
      const { data: appointments } = await supabase
        .from("appointments")
        .select("start_time, end_time, status")
        .eq("super_admin_id", jessicaProfile.id);

      for (const apt of appointments ?? []) {
        if (!isCountableAppointment(apt as AppointmentRow, now)) continue;
        const key = monthKey(new Date(apt.start_time));
        const bucket = initMonth(key);
        const rev = appointmentRevenue(apt.start_time, apt.end_time);
        const hours = appointmentDurationHours(apt.start_time, apt.end_time);
        bucket.cabinetRevenue += rev;
        bucket.appointmentHours += hours;
        bucket.totalRevenue += rev;
      }
    }

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    const { data: accessRows } = await supabase
      .from("catalog_access")
      .select("granted_at, purchase_amount, access_status")
      .gte("granted_at", twelveMonthsAgo.toISOString())
      .in("access_status", ["purchased", "manually_granted"]);

    for (const row of accessRows ?? []) {
      const amount = Number(row.purchase_amount ?? 0);
      if (!amount || !row.granted_at) continue;
      const key = monthKey(new Date(row.granted_at));
      const bucket = initMonth(key);
      bucket.lmsRevenue += amount;
      bucket.totalRevenue += amount;
    }
  }

  const monthly = [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month));

  return {
    hourlyRate: JESSICA_CABINET_HOURLY_RATE,
    totalCabinetRevenue,
    totalLmsRevenue,
    totalRevenue: totalCabinetRevenue + totalLmsRevenue,
    monthly,
  };
}
