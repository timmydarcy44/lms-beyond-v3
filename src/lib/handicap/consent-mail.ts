import { sendEmail } from "@/lib/email/resend-client";

export function buildConsentRequestEmail(input: {
  personFirstName: string;
  referentName: string;
  consentUrl: string;
}) {
  const first = input.personFirstName?.trim() || "Bonjour";
  return {
    subject: "Votre consentement — accompagnement handicap Byound",
    html: `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#F6F4F2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#0A0F1E;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F4F2;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background:#CE0058;padding:22px 28px;text-align:center;">
              <p style="margin:0;color:#fff;font-size:18px;font-weight:800;">Byound Handicap</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;font-size:16px;">${escapeHtml(first)},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">
                ${escapeHtml(input.referentName)} vous invite à confirmer votre consentement pour l’ouverture
                et le suivi d’un accompagnement handicap au sein de Byound.
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#334155;">
                Ce consentement permet uniquement le suivi des aménagements nécessaires.
                Aucune information médicale n’est demandée dans cet e-mail.
              </p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${escapeAttr(input.consentUrl)}"
                   style="display:inline-block;background:#CE0058;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:999px;">
                  Donner mon consentement
                </a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#64748B;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                ${escapeHtml(input.consentUrl)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export async function sendConsentRequestEmail(input: {
  to: string;
  personFirstName: string;
  referentName: string;
  consentUrl: string;
}) {
  const mail = buildConsentRequestEmail(input);
  return sendEmail({
    to: input.to.trim().toLowerCase(),
    subject: mail.subject,
    html: mail.html,
    skipBcc: true,
  });
}
