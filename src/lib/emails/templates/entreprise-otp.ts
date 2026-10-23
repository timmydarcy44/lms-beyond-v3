import { EDGE_EMAIL_LOGO_URL, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export function formatEntrepriseOtp(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length < 6) return digits;
  const mid = Math.ceil(digits.length / 2);
  return `${digits.slice(0, mid)} ${digits.slice(mid)}`;
}

function codeBlock(code: string): string {
  const pretty = escapeEdgeEmailHtml(formatEntrepriseOtp(code));
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0;">
    <tr><td style="background:#F4F4F6;border-radius:24px;padding:28px 32px;">
      <p style="margin:0;font-size:36px;line-height:1;font-weight:800;letter-spacing:4px;color:#111111;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${pretty}</p>
    </td></tr>
  </table>`;
}

export function getEntrepriseOtpEmail(code: string): { subject: string; html: string } {
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Votre code Byound</title>
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;">Votre code Byound, valable 10 minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;">
    <tr><td align="left" style="padding:56px 28px 72px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
        <tr><td>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="background:#111111;border-radius:14px;padding:12px 16px;">
              <img src="${EDGE_EMAIL_LOGO_URL}" alt="Byound" width="88" style="display:block;width:88px;height:auto;border:0;" />
            </td></tr>
          </table>
          <h1 style="margin:36px 0 0;font-size:40px;line-height:1.05;font-weight:800;letter-spacing:-1.4px;color:#111111;">Votre code</h1>
          <p style="margin:14px 0 0;max-width:420px;font-size:16px;line-height:1.5;color:#5C6370;">Utilisez-le pour continuer sur Byound Business. Il expire dans 10 minutes.</p>
          ${codeBlock(code)}
          <p style="margin:32px 0 0;font-size:14px;line-height:1.5;color:#8A8F98;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <p style="margin:48px 0 0;font-size:13px;line-height:1.5;color:#8A8F98;">Byound · byound.fr</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: "Votre code Byound", html };
}
