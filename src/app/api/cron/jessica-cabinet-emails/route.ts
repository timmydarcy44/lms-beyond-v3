import { NextResponse } from "next/server";
import { getParisDateTime } from "@/lib/jessica-contentin/jessica-calendar-events";
import { sendJessicaDailyAppointmentsEmail } from "@/lib/jessica-contentin/jessica-cabinet-emails";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/**
 * Cron quotidien lun–ven ~7h Paris (5h UTC été) : email des RDV du jour.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const paris = getParisDateTime();
  const results: Record<string, unknown> = { paris };

  if (paris.weekday >= 1 && paris.weekday <= 5) {
    results.daily = await sendJessicaDailyAppointmentsEmail();
  }

  return NextResponse.json({ ok: true, ...results });
}

export async function POST(request: Request) {
  return GET(request);
}
