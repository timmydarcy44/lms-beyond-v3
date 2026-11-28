import type { SupabaseClient } from "@supabase/supabase-js";

import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { cfaEmailTemplate } from "@/lib/cfa-emails";
import { recordCfaTouch } from "@/lib/cfa/upsert-cfa-person";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendCfaProgramBrochureEmail(
  db: SupabaseClient,
  input: { personId: string; email: string; firstName: string; specialization: string },
): Promise<boolean> {
  const program = await db
    .from("byound_school_programs")
    .select("program_pdf_url")
    .eq("specialization", input.specialization)
    .maybeSingle();
  const downloadUrl = String((program.data as { program_pdf_url?: string } | null)?.program_pdf_url ?? "").trim();
  if (!downloadUrl) return false;

  let attachment: { filename: string; content: Buffer } | undefined;
  try {
    const pdf = await fetch(downloadUrl);
    if (pdf.ok) {
      attachment = {
        filename: `plaquette-${input.specialization.replace(/[^a-z0-9-]/gi, "-")}.pdf`,
        content: Buffer.from(await pdf.arrayBuffer()),
      };
    }
  } catch (error) {
    console.error("[cfa-brochure]", error);
  }

  const cursus = getCfaSpecializationLabel(input.specialization);
  const sent = await sendEmail({
    to: input.email,
    subject: `Ta plaquette ${cursus}`,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    html: cfaEmailTemplate({
      eyebrow: "Cursus",
      title: `Ta plaquette ${cursus}.`,
      body: `<p>Bonjour ${escapeHtml(input.firstName)},</p><p>Tu trouveras la plaquette du cursus ${escapeHtml(cursus)} en pièce jointe.</p>`,
      cta: { label: "Ouvrir la plaquette", href: downloadUrl },
    }),
    attachments: attachment ? [attachment] : undefined,
  });
  if (!sent.success) return false;
  await recordCfaTouch(db, {
    personId: input.personId,
    type: "email_sent",
    detail: `Plaquette ${cursus}`,
    proofUrl: downloadUrl,
  });
  await recordCfaTouch(db, {
    personId: input.personId,
    type: "brochure_download",
    detail: `Envoi plaquette ${cursus}`,
    proofUrl: downloadUrl,
  });
  return true;
}
