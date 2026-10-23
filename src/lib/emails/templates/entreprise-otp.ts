import { EDGE_EMAIL_LOGO_URL, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export function formatEntrepriseOtp(code: string): string {
  const digits = code.replace(/\D/g, "");
  if (digits.length !== 6) return digits;
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

export function getEntrepriseOtpEmail(code: string): { subject: string; html: string } {
  const pretty = escapeEdgeEmailHtml(formatEntrepriseOtp(code));
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Votre code Byound</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Votre code Byound, valable 10 minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F4F1;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:480px;background:#FFFFFF;border-radius:28px;padding:40px 32px;">
        <tr><td align="center">
          <img src="${EDGE_EMAIL_LOGO_URL}" alt="Byound" width="112" style="display:block;width:112px;height:auto;margin:0 auto 28px;filter:invert(1);" />
          <p style="margin:0;font-size:15px;line-height:1.5;color:#6B6F7A;">Votre code</p>
          <p style="margin:12px 0 0;font-size:40px;font-weight:800;letter-spacing:2px;color:#07080B;">${pretty}</p>
          <p style="margin:20px 0 0;font-size:15px;line-height:1.5;color:#3A3D45;">Valable 10 minutes.</p>
          <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#6B6F7A;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject: "Votre code Byound", html };
}
