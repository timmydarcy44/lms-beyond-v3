import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  createGoogleCalendarEvent,
  refreshGoogleAccessToken,
} from "@/lib/jessica-contentin/google-calendar";

type LinkPatientParams = {
  email?: string | null;
  guestName?: string | null;
};

export async function findCabinetPatientByEmail(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  email: string | null | undefined,
) {
  if (!email) return null;
  const { data } = await supabase
    .from("jessica_cabinet_patients")
    .select("id, profile_id, past_appointments_count, future_appointments_count")
    .ilike("email", email.trim())
    .maybeSingle();
  return data;
}

export async function linkAppointmentToPatient(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  appointmentId: string,
  params: LinkPatientParams,
) {
  const patient = await findCabinetPatientByEmail(supabase, params.email);
  if (!patient) return null;

  const { data: appointment } = await supabase
    .from("appointments")
    .select("start_time, end_time, status")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!appointment) return patient;

  const now = new Date();
  const start = new Date(appointment.start_time);
  const isFuture = start > now && appointment.status !== "cancelled";

  await supabase
    .from("appointments")
    .update({
      cabinet_patient_id: patient.id,
      guest_email: params.email?.toLowerCase() ?? null,
      guest_name: params.guestName ?? null,
    })
    .eq("id", appointmentId);

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (isFuture) {
    updates.future_appointments_count = Number(patient.future_appointments_count ?? 0) + 1;
    updates.next_appointment_at = appointment.start_time;
  } else {
    updates.past_appointments_count = Number(patient.past_appointments_count ?? 0) + 1;
    updates.last_appointment_at = appointment.start_time;
  }

  await supabase.from("jessica_cabinet_patients").update(updates).eq("id", patient.id);

  if (patient.profile_id) {
    await supabase
      .from("jessica_cabinet_patients")
      .update({ profile_id: patient.profile_id })
      .eq("id", patient.id);
  }

  return patient;
}

export async function pushAppointmentToGoogleCalendar(params: {
  userId: string;
  summary: string;
  description?: string;
  startIso: string;
  endIso: string;
  attendeeEmail?: string;
}): Promise<string | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data: conn } = await supabase
    .from("jessica_google_calendar_connections")
    .select("*")
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!conn) return null;

  let accessToken = conn.access_token as string;
  const expiresAt = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (expiresAt && expiresAt < Date.now() + 60_000) {
    const refreshed = await refreshGoogleAccessToken(conn.refresh_token as string);
    accessToken = refreshed.access_token;
    await supabase
      .from("jessica_google_calendar_connections")
      .update({
        access_token: refreshed.access_token,
        token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", params.userId);
  }

  return createGoogleCalendarEvent({
    accessToken,
    calendarId: (conn.calendar_id as string) || "primary",
    summary: params.summary,
    description: params.description,
    startIso: params.startIso,
    endIso: params.endIso,
    attendeeEmail: params.attendeeEmail,
  });
}
