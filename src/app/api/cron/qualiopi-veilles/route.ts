import { NextResponse } from "next/server";
import { runQualiopiWeeklyVeilles } from "@/lib/qualiopi/veille-run";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Lundi 08:00 UTC ≈ 9h Paris en hiver — synthèse des 3 veilles Qualiopi. */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const result = await runQualiopiWeeklyVeilles({ sendEmail: true });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}
