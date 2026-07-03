/** Charte email EDGE — style Revolut : fond blanc, titre large, CTA noir */

const EDGE_LOGO_URL = "https://edgebs.fr/edge-lab/edge-logo-white.png";

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
    ? `<p style="margin:32px 0 0;font-size:13px;line-height:1.6;color:#94A3B8;">${escapeHtml(params.footerNote)}</p>`
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
<body style="margin:0;padding:0;background:#F7F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F7F7F5;padding:48px 20px 64px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr><td style="padding:0 0 40px;" align="left">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="background:#0A1628;border-radius:12px;padding:12px 20px;">
              <img src="${EDGE_LOGO_URL}" alt="EDGE" width="72" height="24" style="display:block;height:24px;width:auto;" />
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="background:#FFFFFF;border-radius:24px;padding:48px 40px 44px;box-shadow:0 1px 3px rgba(5,5,5,0.04);">
          <h1 style="margin:0 0 28px;font-size:32px;font-weight:700;line-height:1.15;letter-spacing:-0.03em;color:#050505;">
            ${title}
          </h1>
          <div style="font-size:16px;line-height:1.7;color:#475569;">
            ${params.bodyHtml}
          </div>
          ${ctaBlock}
          ${footer}
          <p style="margin:40px 0 0;padding-top:32px;border-top:1px solid #F1F5F9;font-size:14px;line-height:1.6;color:#94A3B8;">
            L'équipe EDGE<br />
            <a href="https://edgebs.fr" style="color:#635BFF;text-decoration:none;">edgebs.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
