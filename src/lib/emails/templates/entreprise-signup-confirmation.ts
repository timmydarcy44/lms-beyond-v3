function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getEntrepriseSignupConfirmationEmail(params: {
  firstName: string;
  companyName: string;
  confirmationLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const companyName = escapeHtml(params.companyName.trim());
  const greeting = firstName || "Bonjour";
  const link = params.confirmationLink;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Votre essai EDGE Entreprise</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5f5;padding:24px 16px 40px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0 0 28px;font-size:20px;font-weight:700;letter-spacing:-0.03em;color:#0a0a0a;">EDGE Entreprise</p>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;line-height:1.2;color:#0a0a0a;">
                Bienvenue ${greeting}.
              </h1>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3a3a3a;">
                Votre essai gratuit de 30 jours${companyName ? ` pour <strong>${companyName}</strong>` : ""} est prêt.
              </p>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#3a3a3a;">
                Confirmez votre email pour accéder au dashboard RH, inviter vos collaborateurs et lancer vos diagnostics Beyond.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 28px 8px;">
              <a href="${link}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;padding:18px 24px;font-size:17px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;background:#E63329;">
                Activer mon espace entreprise →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#b0b0b0;text-align:center;">
                Essai 30 jours · sans carte bancaire · lien valable 24&nbsp;h
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = firstName
    ? `${params.firstName.trim()}, activez votre essai EDGE Entreprise`
    : "Activez votre essai EDGE Entreprise";

  return { subject, html };
}
