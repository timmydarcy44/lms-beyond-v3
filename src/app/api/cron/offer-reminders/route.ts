import { NextRequest, NextResponse } from "next/server";
import { sendOfferReminders } from "@/lib/offres/reminders";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ sent: 0 }, { status: 503 });
  const result = await sendOfferReminders(db);
  return NextResponse.json(result);
}
