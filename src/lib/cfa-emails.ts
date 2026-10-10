import { EDGE_EMAIL_LOGO_URL } from "@/lib/emails/edge-email-shell";

type CfaEmailTemplateOptions = {
  eyebrow?: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

export function cfaDarkEmailTemplate({
  eyebrow,
  title,
  body,
}: CfaEmailTemplateOptions): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#071225;color:#f8fbff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#071225">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#10243f;border-radius:28px;overflow:hidden">
            <tr>
              <td align="center" style="padding:40px 32px 8px">
                <img src="${EDGE_EMAIL_LOGO_URL}" alt="Byound" width="118" style="display:block;width:118px;height:auto;margin:0 auto" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 36px 44px">
                ${eyebrow ? `<p style="margin:0 0 16px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#8c86ff">${eyebrow}</p>` : ""}
                <h1 style="max-width:460px;margin:0 auto;font-size:36px;line-height:1.05;letter-spacing:-1.4px;font-weight:800;color:#ffffff">${title}</h1>
                <div style="max-width:440px;margin:24px auto 0;font-size:16px;line-height:1.6;color:#d5e0f2;text-align:left">${body}</div>
              </td>
            </tr>
          </table>
          <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#91a6c8">Byound School · edgebs.fr</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function cfaEmailTemplate({
  eyebrow,
  title,
  body,
  cta,
}: CfaEmailTemplateOptions): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;background:#f4f4f5;color:#111111;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f5">
      <tr>
        <td align="center" style="padding:24px 12px">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:640px;background:#ffffff;border-radius:24px;overflow:hidden">
            <tr>
              <td align="center" style="padding:42px 32px 18px">
                <img src="${EDGE_EMAIL_LOGO_URL}" alt="Byound" width="118" style="display:block;width:118px;height:auto;margin:0 auto;filter:invert(1)" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 40px 48px">
                ${eyebrow ? `<p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#5b5cf6">${eyebrow}</p>` : ""}
                <h1 style="max-width:520px;margin:0 auto;font-size:40px;line-height:1.04;letter-spacing:-1.7px;font-weight:800;color:#111111">${title}</h1>
                <div style="max-width:500px;margin:30px auto 0;font-size:17px;line-height:1.55;color:#34343a;text-align:left">${body}</div>
                ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:30px;padding:15px 26px;border-radius:999px;background:#5b5cf6;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">${cta.label}</a>` : ""}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 30px;border-top:1px solid #eeeeef;font-size:11px;line-height:1.5;color:#8b8b92">
                Byound School · Construisez la suite.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
