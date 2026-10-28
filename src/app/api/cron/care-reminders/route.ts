import { NextRequest, NextResponse } from "next/server";
import { sendCareReminderEmail } from "@/lib/care/booking-emails";
import { careAbsoluteUrl } from "@/lib/care/host";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ sent: 0 });
  const from = new Date();
  const to = new Date(from.getTime() + 36 * 60 * 60 * 1000);
  const { data, error } = await db
    .from("care_bookings")
    .select("id, access_token, client_email, client_first_name, starts_at, expert_id, service_id, reminder_sent_at")
    .eq("status", "confirmed")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", to.toISOString());
  if (error) return NextResponse.json({ sent: 0 });
  let sent = 0;
  for (const row of data ?? []) {
    if (row.reminder_sent_at) continue;
    const start = new Date(String(row.starts_at)).getTime();
    const hours = (start - Date.now()) / 3_600_000;
    if (hours < 12 || hours > 30) continue;
    const [{ data: profile }, { data: service }] = await Promise.all([
      db.from("care_profiles").select("display_name").eq("expert_id", row.expert_id).maybeSingle(),
      db.from("care_services").select("name").eq("id", row.service_id).maybeSingle(),
    ]);
    await sendCareReminderEmail({
      clientEmail: String(row.client_email),
      clientFirstName: String(row.client_first_name),
      practitionerName: String(profile?.display_name ?? ""),
      serviceName: String(service?.name ?? ""),
      startsAt: String(row.starts_at),
      confirmUrl: careAbsoluteUrl(`/care/reservation/${row.id}?token=${row.access_token}`),
    });
    await db.from("care_bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", row.id);
    sent += 1;
  }
  return NextResponse.json({ ok: true, sent });
}
