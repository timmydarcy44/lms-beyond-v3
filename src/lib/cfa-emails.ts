import { EDGE_EMAIL_LOGO_URL } from "@/lib/emails/edge-email-shell";

type CfaEmailTemplateOptions = {
  eyebrow?: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

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
