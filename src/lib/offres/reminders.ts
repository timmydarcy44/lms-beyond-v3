import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { publicAppUrl } from "@/lib/env";
import { testsComplete } from "@/lib/offres/application-home";
import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function secret() {
  return process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "byound-offer-reminders";
}

export function reminderToken(applicationId: string) {
  return createHmac("sha256", secret()).update(applicationId).digest("hex").slice(0, 24);
}

export async function sendOfferReminders(db: SupabaseClient) {
  const rows = await db
    .from("applications")
    .select("id, talent_id, job_id, created_at, reminders_opt_out, reminder_1_at, reminder_3_at, reminder_7_at")
    .eq("status", "draft")
    .limit(80);
  if (rows.error) return { sent: 0 };
  let sent = 0;
  const now = Date.now();
  for (const row of rows.data ?? []) {
    const item = row as {
      id: string;
      talent_id: string;
      job_id: string;
      created_at: string;
      reminders_opt_out?: boolean | null;
      reminder_1_at?: string | null;
      reminder_3_at?: string | null;
      reminder_7_at?: string | null;
    };
    if (item.reminders_opt_out) continue;
    const offer = await db.from("job_offers").select("title, city, status, public_status").eq("id", item.job_id).maybeSingle();
    const job = offer.data as { title?: string | null; city?: string | null; status?: string | null; public_status?: string | null } | null;
    if (!job || job.status !== "active" || job.public_status === "blocked") {
      await db.from("applications").update({ status: "archived", closed_reason: "offer_closed" }).eq("id", item.id);
      continue;
    }
    const age = now - new Date(item.created_at).getTime();
    const day = 86_400_000;
    const slot = age >= 7 * day && !item.reminder_7_at ? "reminder_7_at" : age >= 3 * day && !item.reminder_3_at ? "reminder_3_at" : age >= day && !item.reminder_1_at ? "reminder_1_at" : null;
    if (!slot) continue;
    const profile = await db.from("profiles").select("email, first_name").eq("id", item.talent_id).maybeSingle();
    const person = profile.data as { email?: string | null; first_name?: string | null } | null;
    if (!person?.email) continue;
    const tests = await testsComplete(db, item.talent_id);
    const left = [tests.soft, tests.disc, tests.idmc].filter((done) => !done).length + 1;
    const stop = `${publicAppUrl()}/offres/relances/stop?id=${item.id}&token=${reminderToken(item.id)}`;
    const title = `${job.title || "votre offre"}${job.city ? ` · ${job.city}` : ""}`;
    const subject = slot === "reminder_7_at" ? "Dernier rappel pour votre candidature" : slot === "reminder_3_at" ? "Plus qu'un test pour envoyer votre candidature" : `Il vous reste ${left} étapes pour envoyer votre candidature`;
    const body = slot === "reminder_3_at" && left <= 2
      ? "Plus qu'un test : environ 8 minutes, puis vous pouvez envoyer votre candidature."
      : `Votre candidature pour ${title} est encore en brouillon.`;
    const mailed = await sendEmail({
      to: person.email,
      from: EDGE_COCKPIT_FROM,
      subject,
      html: buildEdgeEmailShell({
        title: slot === "reminder_7_at" ? "Dernier rappel" : "Votre candidature",
        bodyHtml: `<p style="margin:0 0 16px;">Bonjour ${person.first_name || ""},</p><p style="margin:0;">${body}</p>`,
        cta: { label: "Reprendre ma candidature", href: `${publicAppUrl()}/offres/candidature` },
        footerNote: "Vous pouvez arrêter ces rappels.",
      }).replace(
        "Byound ·",
        `<a href="${stop}" style="color:#8A8F98;text-decoration:underline;">Ne plus recevoir ces rappels</a><br/>Byound ·`,
      ),
      skipBcc: true,
    });
    if (mailed.success) {
      await db.from("applications").update({ [slot]: new Date().toISOString() }).eq("id", item.id);
      sent += 1;
    }
  }
  return { sent };
}
