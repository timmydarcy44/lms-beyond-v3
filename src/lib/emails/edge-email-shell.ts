/** Design system email EDGE — Apple × Revolut × Notion */

export const EDGE_EMAIL_LOGO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/EDGE_noir_sans_fond.png";

export function escapeEdgeEmailHtml(value: string): string {
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
  const title = escapeEdgeEmailHtml(params.title);
  const preheader = params.preheader ? escapeEdgeEmailHtml(params.preheader) : "";
  const footer = params.footerNote
    ? `<p style="margin:48px 0 0;font-size:13px;line-height:1.65;color:#8A8A8A;letter-spacing:0.01em;">${escapeEdgeEmailHtml(params.footerNote)}</p>`
    : "";

  const ctaBlock = params.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:48px auto 0;">
        <tr><td align="center">
          <a href="${params.cta.href}" target="_blank" rel="noopener noreferrer"
             style="display:inline-block;padding:18px 40px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:999px;background:#050505;letter-spacing:-0.02em;">
            ${escapeEdgeEmailHtml(params.cta.label)}
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
<body style="margin:0;padding:0;background:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FFFFFF;">
    <tr><td align="center" style="padding:64px 24px 80px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
        <tr><td align="center" style="padding:0 0 56px;">
          <img src="${EDGE_EMAIL_LOGO_URL}" alt="EDGE" width="96" height="32" style="display:block;height:32px;width:auto;margin:0 auto;" />
        </td></tr>
        <tr><td align="center" style="padding:0;">
          <h1 style="margin:0 0 32px;font-size:36px;font-weight:700;line-height:1.12;letter-spacing:-0.04em;color:#050505;text-align:center;">
            ${title}
          </h1>
          <div style="font-size:17px;line-height:1.75;color:#050505;text-align:center;letter-spacing:-0.01em;">
            ${params.bodyHtml}
          </div>
          ${ctaBlock}
          ${footer}
          <p style="margin:64px 0 0;padding-top:40px;border-top:1px solid #EFEFEF;font-size:13px;line-height:1.65;color:#8A8A8A;text-align:center;">
            L'équipe EDGE · <a href="https://edgebs.fr" style="color:#050505;text-decoration:none;font-weight:500;">edgebs.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Paragraphe court centré pour les emails EDGE */
export function edgeEmailParagraph(text: string): string {
  return `<p style="margin:0 0 20px;">${escapeEdgeEmailHtml(text)}</p>`;
}

/** Bloc résultat mis en avant (validation, badge, etc.) */
export function edgeEmailHighlight(label: string, value: string): string {
  return `<p style="margin:32px 0 0;padding:24px 28px;border-radius:16px;background:#F7F7F7;font-size:15px;line-height:1.6;color:#050505;">
    <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#8A8A8A;margin-bottom:8px;">${escapeEdgeEmailHtml(label)}</span>
    <strong style="font-size:18px;letter-spacing:-0.02em;">${escapeEdgeEmailHtml(value)}</strong>
  </p>`;
}
