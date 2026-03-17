import { NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import {
  getWelcomeEmailTemplate,
  getStrategicEmailTemplate,
  getEngagementEmailTemplate,
  getSiteBranding,
} from "@/lib/email-templates";

const { siteName } = getSiteBranding();
const FROM = process.env.RESEND_FROM_EMAIL || `${siteName} <hello@nevo-app.fr>`;

const templateMap = {
  welcome_h1: getWelcomeEmailTemplate,
  strategic_d1: getStrategicEmailTemplate,
  engagement_d7: getEngagementEmailTemplate,
} as const;

export async function POST() {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const now = new Date().toISOString();
  const { data: scheduled, error } = await supabase
    .from("scheduled_emails")
    .select("id, email, type")
    .eq("sent", false)
    .lte("send_at", now)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sentCount = 0;
  for (const item of scheduled || []) {
    const getTemplate = (templateMap as any)[item.type];
    if (!getTemplate) {
      continue;
    }
    const template = getTemplate();
    const result = await sendEmail({
      to: item.email,
      subject: template.subject,
      html: template.html,
      from: FROM,
    });

    if (result.success) {
      await supabase
        .from("scheduled_emails")
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq("id", item.id);
      sentCount += 1;
    }
  }

  return NextResponse.json({ sent: sentCount });
}
