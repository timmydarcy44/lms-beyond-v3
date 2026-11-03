import { sendEmail, resolveAdminBccEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

function clip(value: string, max = 500) {
  return value.trim().slice(0, max);
}

export function formationProposalNotice(params: {
  expertName: string;
  expertId: string;
  title: string;
  priceEur: number;
  formats: string[];
}) {
  const to = resolveAdminBccEmail() || "timmydarcy44@gmail.com";
  const title = clip(params.title, 160);
  const name = clip(params.expertName, 160) || "Un expert";
  const href = `https://www.byound.fr/super/experts/${params.expertId}`;
  const formats = params.formats.map((item) => clip(item, 80)).filter(Boolean).join(", ") || "—";
  const subject = `Nouvelle proposition de formation · ${title}`;
  const html = buildEdgeEmailShell({
    title: "Nouvelle proposition de formation",
    preheader: `${name} propose « ${title} »`,
    bodyHtml: `<p>${escapeEdgeEmailHtml(name)} vient de proposer une formation.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;width:100%;">
        <tr><td style="padding:8px 12px 8px 0;font-size:14px;color:#666;">Formation</td><td style="padding:8px 0;font-size:14px;color:#050505;font-weight:500;">${escapeEdgeEmailHtml(title)}</td></tr>
        <tr><td style="padding:8px 12px 8px 0;font-size:14px;color:#666;">Tarif souhaité</td><td style="padding:8px 0;font-size:14px;color:#050505;font-weight:500;">${params.priceEur.toLocaleString("fr-FR")} €</td></tr>
        <tr><td style="padding:8px 12px 8px 0;font-size:14px;color:#666;">Formats</td><td style="padding:8px 0;font-size:14px;color:#050505;font-weight:500;">${escapeEdgeEmailHtml(formats)}</td></tr>
      </table>
      <p style="margin-top:24px;"><a href="${href}" style="color:#4B3BD1;font-weight:600;">Voir la fiche expert</a></p>`,
  });
  return { to, subject, html };
}

export async function notifyFormationProposal(params: {
  expertName: string;
  expertId: string;
  title: string;
  priceEur: number;
  formats: string[];
}) {
  const mail = formationProposalNotice(params);
  const result = await sendEmail({
    to: mail.to,
    subject: mail.subject,
    html: mail.html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
  });
  if (!result.success) {
    console.error("[formation-proposal] email", result.error);
  }
  return result.success;
}
