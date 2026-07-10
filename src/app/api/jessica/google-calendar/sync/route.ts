import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  listGoogleCalendarEvents,
  refreshGoogleAccessToken,
} from "@/lib/jessica-contentin/google-calendar";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { linkAppointmentToPatient } from "@/lib/jessica-contentin/appointment-sync";
import { extractEmailFromAppointmentNotes } from "@/lib/jessica-contentin/cabinet-revenue";

export async function POST() {
  try {
    const supabaseAuth = await getServerClient();
    if (!supabaseAuth) return NextResponse.json({ error: "Non configuré" }, { status: 500 });

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();
    if (!user?.email || user.email.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const supabase = getServiceRoleClient();
    if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 500 });

    const { data: conn } = await supabase
      .from("jessica_google_calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!conn) {
      return NextResponse.json({ error: "Google Calendar non connecté" }, { status: 400 });
    }

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
        .eq("user_id", user.id);
    }

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 6, 1).toISOString();

    const events = await listGoogleCalendarEvents({
      accessToken,
      calendarId: (conn.calendar_id as string) || "primary",
      timeMin,
      timeMax,
    });

    let imported = 0;
    let linked = 0;

    for (const event of events) {
      const startIso = event.start?.dateTime ?? (event.start?.date ? `${event.start.date}T09:00:00` : null);
      const endIso = event.end?.dateTime ?? (event.end?.date ? `${event.end.date}T10:00:00` : null);
      if (!startIso || !endIso || !event.id) continue;

      const { data: existing } = await supabase
        .from("appointments")
        .select("id")
        .eq("google_event_id", event.id)
        .maybeSingle();

      if (existing) continue;

      const attendeeEmail = event.attendees?.[0]?.email?.toLowerCase() ?? null;
      const email =
        attendeeEmail ?? extractEmailFromAppointmentNotes(event.description) ?? null;

      const { data: created, error } = await supabase
        .from("appointments")
        .insert({
          super_admin_id: user.id,
          learner_id: null,
          start_time: startIso,
          end_time: endIso,
          status: new Date(endIso) < now ? "completed" : "confirmed",
          subject: event.summary ?? "Rendez-vous Google Calendar",
          notes: event.description ?? null,
          guest_email: email,
          google_event_id: event.id,
        })
        .select("id")
        .single();

      if (error || !created) continue;
      imported += 1;

      const patient = await linkAppointmentToPatient(supabase, created.id, {
        email,
        guestName: event.summary ?? null,
      });
      if (patient) linked += 1;
    }

    await supabase
      .from("jessica_google_calendar_connections")
      .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, imported, linked, total: events.length });
  } catch (error) {
    console.error("[google-calendar/sync]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur de synchronisation" },
      { status: 500 },
    );
  }
}
