/** Charte email EDGE — style Revolut : fond blanc, texte noir, logo noir, CTA noir */

export const EDGE_EMAIL_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/EDGE_noir_sans_fond.png";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EdgeEmailCta = {
  label: string;
  href: string;
};

export type EdgeEmailShellParams = {
  title: string;
  preheader?: string;
  bodyHtml: string;
  cta?: EdgeEmailCta;
  footerNote?: string;
};

export function buildEdgeEmailShell(params: EdgeEmailShellParams): string {
  const title = escapeHtml(params.title);
  const preheader = params.preheader ? escapeHtml(params.preheader) : "";
  const footer = params.footerNote
    ? `<p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#050505;">${escapeHtml(params.footerNote)}</p>`
    : "";

  const ctaBlock = params.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:36px 0 0;">
        <tr><td>
          <a href="${params.cta.href}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:18px 36px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:14px;background:#050505;letter-spacing:-0.01em;">
            ${escapeHtml(params.cta.label)}
          </a>
        </td></tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  ${preheader ? `<meta name="description" content="${preheader}" />` : ""}
</head>
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;padding:40px 20px 56px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr><td style="padding:0 0 32px;" align="left">
          <img src="${EDGE_EMAIL_LOGO_URL}" alt="EDGE" width="88" height="28" style="display:block;height:28px;width:auto;" />
        </td></tr>
        <tr><td style="padding:0;">
          <h1 style="margin:0 0 24px;font-size:32px;font-weight:700;line-height:1.15;letter-spacing:-0.03em;color:#050505;">
            ${title}
          </h1>
          <div style="font-size:16px;line-height:1.7;color:#050505;">
            ${params.bodyHtml}
          </div>
          ${ctaBlock}
          ${footer}
          <p style="margin:40px 0 0;padding-top:32px;border-top:1px solid #E8E8E8;font-size:14px;line-height:1.6;color:#050505;">
            L'équipe EDGE<br />
            <a href="https://edgebs.fr" style="color:#050505;text-decoration:underline;">edgebs.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
