import { sendEmail, type EmailAttachment } from "@/lib/email/resend-client";
import { qualiopiAppBaseUrl } from "@/lib/crm/qualiopi-shared";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function attachmentsFromUrls(
  docs: { title: string; file_url: string | null; file_name: string | null }[]
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];
  for (const doc of docs) {
    if (!doc.file_url) continue;
    try {
      const response = await fetch(doc.file_url);
      if (!response.ok) continue;
      attachments.push({
        filename: doc.file_name || `${doc.title.replace(/\s+/g, "-")}.pdf`,
        content: Buffer.from(await response.arrayBuffer()),
      });
    } catch (error) {
      console.error("[qualiopi-email] attachment", doc.title, error);
    }
  }
  return attachments;
}

export async function sendQualiopiConventionPack(params: {
  to: string[];
  companyName: string;
  courseName: string;
  scheduledAt?: string | null;
  fromEmail: string;
  fromName?: string;
  documents: { title: string; file_url: string | null; file_name: string | null }[];
}) {
  const dateLabel = params.scheduledAt
    ? new Date(params.scheduledAt).toLocaleDateString("fr-FR")
    : "date à confirmer";
  const attachments = await attachmentsFromUrls(params.documents);
  const missing = params.documents.filter((doc) => !doc.file_url).map((doc) => doc.title);
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">
      <p>Bonjour,</p>
      <p>
        Nous confirmons la formation <strong>${escapeHtml(params.courseName)}</strong>
        prévue pour <strong>${escapeHtml(params.companyName)}</strong> (${escapeHtml(dateLabel)}).
      </p>
      <p>Vous trouverez en pièce jointe la convention de formation et le règlement intérieur.</p>
      ${
        missing.length
          ? `<p style="color:#b45309">Document(s) à finaliser : ${escapeHtml(missing.join(", "))}.</p>`
          : ""
      }
      <p>Cordialement,<br/>${escapeHtml(params.fromName || "EDGE")}</p>
    </div>
  `;
  return sendEmail({
    to: params.to,
    from: params.fromEmail,
    subject: `Convention de formation — ${params.courseName}`,
    html,
    attachments,
  });
}

export async function sendQualiopiStartPack(params: {
  attendees: { full_name: string; email: string; token: string }[];
  companyName: string;
  courseName: string;
  fromEmail: string;
  fromName?: string;
  livret?: { title: string; file_url: string | null; file_name: string | null } | null;
}) {
  const livretAttachments = params.livret ? await attachmentsFromUrls([params.livret]) : [];
  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const attendee of params.attendees) {
    const link = `${qualiopiAppBaseUrl()}/qualiopi/emarger/${attendee.token}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">
        <p>Bonjour ${escapeHtml(attendee.full_name)},</p>
        <p>
          La formation <strong>${escapeHtml(params.courseName)}</strong>
          pour <strong>${escapeHtml(params.companyName)}</strong> est en cours.
        </p>
        <p>Merci d'émarger en cliquant sur le lien ci-dessous. L'heure et le jour de signature sont enregistrés pour le dossier Qualiopi.</p>
        <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">Émarger maintenant</a></p>
        <p>Le livret d'accueil est joint à ce message.</p>
        <p>Cordialement,<br/>${escapeHtml(params.fromName || "EDGE")}</p>
      </div>
    `;
    const sent = await sendEmail({
      to: attendee.email,
      from: params.fromEmail,
      subject: `Émargement + livret d'accueil — ${params.courseName}`,
      html,
      attachments: livretAttachments,
    });
    results.push({ email: attendee.email, success: sent.success, error: sent.error });
  }
  return results;
}

export async function sendQualiopiSatisfactionPack(params: {
  attendees: { full_name: string; email: string; satisfaction_token: string }[];
  companyName: string;
  courseName: string;
  fromEmail: string;
  fromName?: string;
}) {
  const results: { email: string; success: boolean; error?: string }[] = [];
  for (const attendee of params.attendees) {
    const link = `${qualiopiAppBaseUrl()}/qualiopi/satisfaction/${attendee.satisfaction_token}`;
    const html = `
      <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#111">
        <p>Bonjour ${escapeHtml(attendee.full_name)},</p>
        <p>
          La formation <strong>${escapeHtml(params.courseName)}</strong>
          pour <strong>${escapeHtml(params.companyName)}</strong> est terminée.
        </p>
        <p>Pour clôturer le dossier Qualiopi, merci de répondre au questionnaire de satisfaction :</p>
        <p><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">Questionnaire de satisfaction</a></p>
        <p>Cordialement,<br/>${escapeHtml(params.fromName || "EDGE")}</p>
      </div>
    `;
    const sent = await sendEmail({
      to: attendee.email,
      from: params.fromEmail,
      subject: `Satisfaction formation — ${params.courseName}`,
      html,
    });
    results.push({ email: attendee.email, success: sent.success, error: sent.error });
  }
  return results;
}
