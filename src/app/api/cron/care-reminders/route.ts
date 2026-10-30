import { NextRequest, NextResponse } from "next/server";
import { sendCareReminderEmail } from "@/lib/care/booking-emails";
import { loadCareBookingByToken } from "@/lib/care/load-booking";
import { parisHour, parisTomorrowKey } from "@/lib/care/mail-copy";
import { parisDateKey } from "@/lib/care/working-days";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const force = request.nextUrl.searchParams.get("force") === "1";
  if (!force && parisHour() !== 10) {
    return NextResponse.json({ ok: true, sent: 0, skipped: "hors de 10 h, heure de Paris" });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ sent: 0 });
  const tomorrow = parisTomorrowKey();
  const from = new Date(Date.now() + 6 * 60 * 60 * 1000);
  const to = new Date(Date.now() + 42 * 60 * 60 * 1000);
  const { data, error } = await db
    .from("care_bookings")
    .select("id, access_token, starts_at, reminder_sent_at")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString());
  if (error) return NextResponse.json({ sent: 0 });
  let sent = 0;
  for (const row of data ?? []) {
    if (parisDateKey(String(row.starts_at)) !== tomorrow) continue;
    const booking = await loadCareBookingByToken(String(row.id), String(row.access_token ?? ""));
    if (!booking) continue;
    const mailed = await sendCareReminderEmail(booking);
    if (!mailed.success) continue;
    await db.from("care_bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", row.id);
    sent += 1;
  }
  return NextResponse.json({ ok: true, sent });
}
