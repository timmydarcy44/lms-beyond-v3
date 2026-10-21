import { NextRequest, NextResponse } from "next/server";

import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Indisponible" }, { status: 503 });

  const limit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const periods = await service
    .from("booklet_periods")
    .select("id, status, booklet_id, index, created_at")
    .in("status", ["awaiting_student", "awaiting_tutor", "awaiting_cfa"])
    .lt("created_at", limit);
  if (periods.error) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const period of periods.data ?? []) {
    const previousRole = period.status === "awaiting_tutor" ? "student" : period.status === "awaiting_cfa" ? "tutor" : null;
    if (previousRole) {
      const previous = await service.from("booklet_signatures").select("signed_at").eq("period_id", period.id).eq("signer_role", previousRole).maybeSingle();
      if (!previous.data?.signed_at || String(previous.data.signed_at) > limit) continue;
    } else if (String(period.created_at) > limit) {
      continue;
    }
    const booklet = await service.from("apprenticeship_booklets").select("student_id, tutor_id, cfa_referent_id").eq("id", period.booklet_id).maybeSingle();
    if (!booklet.data) continue;
    const targetId =
      period.status === "awaiting_student"
        ? booklet.data.student_id
        : period.status === "awaiting_tutor"
          ? booklet.data.tutor_id
          : booklet.data.cfa_referent_id;
    if (!targetId) continue;
    const profile = await service.from("profiles").select("email").eq("id", targetId).maybeSingle();
    if (!profile.data?.email) continue;
    const result = await sendEmail({
      to: String(profile.data.email),
      from: EDGE_COCKPIT_FROM,
      subject: "Livret d'alternance en attente de signature",
      html: `<p>La période ${period.index} de votre livret attend votre signature depuis plus de 7 jours.</p>`,
    });
    if (result.success) sent += 1;
  }
  return NextResponse.json({ sent });
}
