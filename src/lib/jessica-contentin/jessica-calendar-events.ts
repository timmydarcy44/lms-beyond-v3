import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  getJessicaGoogleCalendarId,
  listGoogleCalendarEvents,
  refreshGoogleAccessToken,
} from "@/lib/jessica-contentin/google-calendar";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { appointmentDurationHours, appointmentRevenue } from "@/lib/jessica-contentin/cabinet-revenue";

export type JessicaCalendarEvent = {
  id: string;
  summary: string;
  startIso: string;
  endIso: string;
};

function parseIcsDate(value: string): Date {
  const raw = value.trim();
  if (raw.length === 8) {
    return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00`);
  }
  const hasZ = raw.endsWith("Z");
  const clean = hasZ ? raw.slice(0, -1) : raw;
  const iso = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}T${clean.slice(9, 11)}:${clean.slice(11, 13)}:${clean.slice(13, 15)}${hasZ ? "Z" : ""}`;
  return new Date(iso);
}

function parseIcalEvents(icsText: string, timeMin: Date, timeMax: Date): JessicaCalendarEvent[] {
  const events: JessicaCalendarEvent[] = [];
  const blocks = icsText.split("BEGIN:VEVENT");

  for (const block of blocks.slice(1)) {
    const chunk = block.split("END:VEVENT")[0] ?? "";
    const summary = chunk.match(/SUMMARY:(.+)/)?.[1]?.trim() ?? "Rendez-vous";
    const uid = chunk.match(/UID:(.+)/)?.[1]?.trim() ?? `ics-${events.length}`;
    const dtStart = chunk.match(/DTSTART[^:]*:(.+)/)?.[1]?.trim();
    const dtEnd = chunk.match(/DTEND[^:]*:(.+)/)?.[1]?.trim();
    if (!dtStart) continue;

    const start = parseIcsDate(dtStart);
    const end = dtEnd ? parseIcsDate(dtEnd) : new Date(start.getTime() + 60 * 60 * 1000);
    if (start < timeMin || start > timeMax) continue;

    events.push({
      id: uid,
      summary: summary.replace(/\\n/g, " ").replace(/\\,/g, ","),
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    });
  }

  return events.sort((a, b) => a.startIso.localeCompare(b.startIso));
}

async function fetchIcalEvents(timeMin: Date, timeMax: Date): Promise<JessicaCalendarEvent[]> {
  const icalUrl = process.env.GOOGLE_CALENDAR_ICAL_URL?.trim();
  if (!icalUrl) return [];

  const res = await fetch(icalUrl, { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const text = await res.text();
  return parseIcalEvents(text, timeMin, timeMax);
}

async function getGoogleAccessToken(): Promise<{ accessToken: string; calendarId: string } | null> {
  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (!jessicaProfile?.id) return null;

  const { data: conn } = await supabase
    .from("jessica_google_calendar_connections")
    .select("*")
    .eq("user_id", jessicaProfile.id)
    .maybeSingle();

  if (!conn?.refresh_token) return null;

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
      .eq("user_id", jessicaProfile.id);
  }

  return {
    accessToken,
    calendarId: (conn.calendar_id as string) || getJessicaGoogleCalendarId(),
  };
}

export async function fetchJessicaCalendarEvents(timeMin: Date, timeMax: Date): Promise<JessicaCalendarEvent[]> {
  try {
    const auth = await getGoogleAccessToken();
    if (auth) {
      const items = await listGoogleCalendarEvents({
        accessToken: auth.accessToken,
        calendarId: auth.calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      });

      return items
        .filter((e) => e.status !== "cancelled")
        .map((e) => {
          const startIso = e.start?.dateTime ?? (e.start?.date ? `${e.start.date}T09:00:00` : null);
          const endIso = e.end?.dateTime ?? (e.end?.date ? `${e.end.date}T10:00:00` : null);
          if (!startIso || !endIso) return null;
          return {
            id: e.id,
            summary: e.summary ?? "Rendez-vous",
            startIso,
            endIso,
          };
        })
        .filter((e): e is JessicaCalendarEvent => e !== null);
    }
  } catch (error) {
    console.error("[jessica-calendar-events] Google API:", error);
  }

  return fetchIcalEvents(timeMin, timeMax);
}

export function summarizeCalendarEvents(events: JessicaCalendarEvent[]) {
  const count = events.length;
  const revenue = events.reduce(
    (sum, e) => sum + appointmentRevenue(e.startIso, e.endIso),
    0,
  );
  const hours = events.reduce(
    (sum, e) => sum + appointmentDurationHours(e.startIso, e.endIso),
    0,
  );
  return { count, revenue: Math.round(revenue * 100) / 100, hours };
}

export function getParisDateTime(): {
  year: number;
  month: number;
  day: number;
  hour: number;
  weekday: number;
} {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      weekday: "short",
      hour12: false,
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );

  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    weekday: weekdayMap[parts.weekday] ?? 0,
  };
}

export function parisDayBounds(year: number, month: number, day: number): { start: Date; end: Date } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = new Date(`${year}-${pad(month)}-${pad(day)}T00:00:00+01:00`);
  const end = new Date(`${year}-${pad(month)}-${pad(day)}T23:59:59+01:00`);
  return { start, end };
}

export function parisWeekBounds(
  year: number,
  month: number,
  day: number,
  weekday: number,
): { start: Date; end: Date } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayNoon = new Date(`${year}-${pad(month)}-${pad(day)}T12:00:00+01:00`);
  const monday = new Date(todayNoon);
  monday.setUTCDate(todayNoon.getUTCDate() - (weekday - 1));
  const friday = new Date(monday);
  friday.setUTCDate(monday.getUTCDate() + 4);

  const mondayStr = `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
  const fridayStr = `${friday.getUTCFullYear()}-${pad(friday.getUTCMonth() + 1)}-${pad(friday.getUTCDate())}`;

  return {
    start: new Date(`${mondayStr}T00:00:00+01:00`),
    end: new Date(`${fridayStr}T23:59:59+01:00`),
  };
}
