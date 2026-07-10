import { NextResponse } from "next/server";
import { getParisDateTime } from "@/lib/jessica-contentin/jessica-calendar-events";
import {
  sendJessicaDailyAppointmentsEmail,
  sendJessicaWeeklyRecapEmail,
} from "@/lib/jessica-contentin/jessica-cabinet-emails";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Cron horaire (Europe/Paris) :
 * - Lun–Ven 7h : email des RDV du jour (Google Agenda)
 * - Ven 17h : récap hebdomadaire (nombre de RDV + CA)
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const paris = getParisDateTime();
  const results: Record<string, unknown> = { paris };

  if (paris.weekday >= 1 && paris.weekday <= 5 && paris.hour === 7) {
    results.daily = await sendJessicaDailyAppointmentsEmail();
  }

  if (paris.weekday === 5 && paris.hour === 17) {
    results.weekly = await sendJessicaWeeklyRecapEmail();
  }

  return NextResponse.json({ ok: true, ...results });
}

export async function POST(request: Request) {
  return GET(request);
}
