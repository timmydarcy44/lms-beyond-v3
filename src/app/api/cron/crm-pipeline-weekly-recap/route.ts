import { NextResponse } from "next/server";
import { sendPipelineWeeklyRecapEmails } from "@/lib/crm/pipeline-weekly-recap-email";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

/** Vendredi 16h UTC — récap hebdo pipeline BTOB (Jérôme + Timmy) */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results = await sendPipelineWeeklyRecapEmails();
  return NextResponse.json({ ok: true, results });
}

export async function POST(request: Request) {
  return GET(request);
}
