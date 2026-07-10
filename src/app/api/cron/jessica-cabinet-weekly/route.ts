import { NextResponse } from "next/server";
import { sendJessicaWeeklyRecapEmail } from "@/lib/jessica-contentin/jessica-cabinet-emails";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Vendredi ~17h Paris (15h UTC été) — récap hebdomadaire */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const weekly = await sendJessicaWeeklyRecapEmail();
  return NextResponse.json({ ok: true, weekly });
}

export async function POST(request: Request) {
  return GET(request);
}
