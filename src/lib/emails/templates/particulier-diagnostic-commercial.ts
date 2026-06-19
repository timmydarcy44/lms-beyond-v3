function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierDiagnosticCommercialEmail(params: {
  firstName: string;
  openingParagraph: string;
  walletHref: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const opening = escapeHtml(params.openingParagraph.trim());
  const walletHref = params.walletHref;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Votre Diagnostic Commercial EDGE</title>
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
                ${greeting}, votre diagnostic est complet.
              </h1>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.65;color:#3a3a3a;">
                ${opening}
              </p>
              <p style="margin:0;font-size:16px;line-height:1.65;color:#3a3a3a;">
                Vous venez d'obtenir votre badge <strong>Diagnostic Commercial</strong> — retrouvez-le dans votre Wallet EDGE.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 28px 8px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" bgcolor="#0a0a0a" style="border-radius:16px;">
                    <a href="${walletHref}" target="_blank" rel="noopener noreferrer"
                       style="display:block;padding:18px 24px;font-size:17px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:16px;line-height:1.3;text-align:center;-webkit-text-size-adjust:none;">
                      Voir mon Wallet →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;border-top:1px solid rgba(0,0,0,0.06);">
              <p style="margin:20px 0 0;font-size:11px;line-height:1.5;color:#b0b0b0;text-align:center;">
                Badge vérifiable · partageable sur LinkedIn
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
    ? `${params.firstName.trim()}, votre Diagnostic Commercial EDGE`
    : "Votre Diagnostic Commercial EDGE";

  return { subject, html };
}
