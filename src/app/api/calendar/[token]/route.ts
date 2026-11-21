import { NextResponse } from "next/server";

import { loadLearnerPlanningOverview } from "@/lib/apprenant/planning-overview";
import { addDays, parseIsoDate, toIsoDate } from "@/lib/apprenant/alternance-planning";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function icsEscape(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function toIcsDate(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

function toIcsAllDay(isoDate: string) {
  return isoDate.replace(/-/g, "");
}

/** Feed iCal public via jeton secret : /api/calendar/{token}.ics */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const raw = (await ctx.params).token;
  const token = raw.replace(/\.ics$/i, "").trim();
  if (!token || token.length < 16) {
    return new NextResponse("Not found", { status: 404 });
  }

  const db = getServiceRoleClient();
  if (!db) return new NextResponse("Unavailable", { status: 503 });

  const { data: feed } = await db
    .from("learner_calendar_feeds")
    .select("learner_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!feed || feed.revoked_at) {
    return new NextResponse("Not found", { status: 404 });
  }

  const overview = await loadLearnerPlanningOverview(db, String(feed.learner_id));
  const now = toIcsDate(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Byound//Mon planning//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Mon planning Byound",
  ];

  for (const s of overview.sessions) {
    const title = s.title || s.module_name || "Cours";
    lines.push(
      "BEGIN:VEVENT",
      `UID:session-${s.id}@byound`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDate(new Date(s.starts_at))}`,
      `DTEND:${toIcsDate(new Date(s.ends_at))}`,
      `SUMMARY:${icsEscape(title)}`,
    );
    const loc = s.room_name || s.location_text;
    if (loc) lines.push(`LOCATION:${icsEscape(loc)}`);
    if (s.learner_instruction) lines.push(`DESCRIPTION:${icsEscape(s.learner_instruction)}`);
    lines.push("END:VEVENT");
  }

  for (const w of overview.weeks) {
    if (w.week_type !== "company") continue;
    const start = w.week_starts_on;
    const end = toIsoDate(addDays(parseIsoDate(start), 5));
    const summary = overview.companyName
      ? `Entreprise · ${overview.companyName}`
      : "Semaine en entreprise";
    lines.push(
      "BEGIN:VEVENT",
      `UID:company-${start}@byound`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcsAllDay(start)}`,
      `DTEND;VALUE=DATE:${toIcsAllDay(end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      "END:VEVENT",
    );
  }

  for (const u of overview.upcoming) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:due-${u.kind}-${u.date}-${icsEscape(u.title).slice(0, 40)}@byound`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${toIcsAllDay(u.date)}`,
      `DTEND;VALUE=DATE:${toIcsAllDay(toIsoDate(addDays(parseIsoDate(u.date), 1)))}`,
      `SUMMARY:${icsEscape(u.title)}`,
    );
    if (u.subtitle) lines.push(`DESCRIPTION:${icsEscape(u.subtitle)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const body = lines.join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="mon-planning-byound.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
