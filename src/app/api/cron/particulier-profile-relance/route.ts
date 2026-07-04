import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { getParticulierProfileRelanceEmail } from "@/lib/emails/templates/particulier-profile-relance";
import { publicAppUrl } from "@/lib/env";
import { getServiceRoleClient } from "@/lib/supabase/server";

const RELANCE_HOURS = Number(process.env.PARTICULIER_PROFILE_RELANCE_HOURS ?? 24);

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const service = getServiceRoleClient();
  if (!service) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const cutoff = new Date(Date.now() - RELANCE_HOURS * 60 * 60 * 1000).toISOString();

  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, email, first_name, role, role_type, cross_profile_completion, profile_incomplete_reminder_sent_at")
    .or("role.eq.PARTICULIER,role_type.eq.particulier");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profilHref = `${publicAppUrl().replace(/\/$/, "")}/dashboard/apprenant/profil-comportemental`;
  let sent = 0;

  for (const profile of profiles ?? []) {
    const completion = profile.cross_profile_completion as { badge_awarded_at?: string } | null;
    if (completion?.badge_awarded_at) continue;

    const reminderAt = profile.profile_incomplete_reminder_sent_at as string | null;
    if (reminderAt && reminderAt > cutoff) continue;

    const uid = String(profile.id);
    const [discRes, idmcRes, softRes] = await Promise.all([
      service.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      service.from("idmc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
      service.from("soft_skills_resultats").select("scores").eq("learner_id", uid).maybeSingle(),
    ]);

    if (!discRes.data?.scores) continue;
    if (idmcRes.data?.scores && softRes.data?.scores) continue;

    const email = String(profile.email ?? "").trim();
    if (!email) continue;

    const template = getParticulierProfileRelanceEmail({
      firstName: String(profile.first_name ?? ""),
      profilHref,
    });

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      from: EDGE_COCKPIT_FROM,
    });

    if (result.success) {
      sent += 1;
      await service
        .from("profiles")
        .update({ profile_incomplete_reminder_sent_at: new Date().toISOString() })
        .eq("id", uid);
    }
  }

  return NextResponse.json({ ok: true, sent });
}
