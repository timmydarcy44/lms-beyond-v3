function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierSignupConfirmationEmail(params: {
  firstName: string;
  confirmationLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const subjectName = firstName || "Votre";
  const link = params.confirmationLink;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subjectName === "Votre" ? "Votre cockpit vous attend" : `${subjectName}, votre cockpit vous attend`}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,sans-serif;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;padding:24px 16px 40px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0 0 28px;font-size:20px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;">EDGE</p>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;line-height:1.2;letter-spacing:-0.02em;color:#0a0a0a;">
                Bienvenue ${greeting}.
              </h1>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3a3a3a;">
                Vous venez de faire le premier pas vers une vision claire de votre profil professionnel.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#3a3a3a;">
                Un clic, et votre cockpit s'ouvre — DISC, IDMC, soft skills, tout au même endroit.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 28px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" bgcolor="#0a0a0a" style="border-radius:16px;">
                    <a href="${link}" target="_blank" rel="noopener noreferrer"
                       style="display:block;padding:18px 24px;font-size:17px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;line-height:1.3;text-align:center;-webkit-text-size-adjust:none;">
                      Ouvrir mon cockpit →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:12px 28px 32px;">
              <a href="${link}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;font-size:15px;font-weight:600;color:#0a0a0a;text-decoration:underline;line-height:1.5;padding:8px 4px;">
                Accéder à mon profil
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#b0b0b0;text-align:center;">
                Inscription gratuite · sans engagement · lien valable 24&nbsp;h
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject =
    subjectName === "Votre"
      ? "Votre cockpit vous attend"
      : `${params.firstName.trim()}, votre cockpit vous attend`;

  return { subject, html };
}
