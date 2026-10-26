/** Emails Byound — style Revolut : logo nu, bouton droit, pas de pastille. */

export const EDGE_EMAIL_LOGO_URL = "https://www.byound.fr/brand/logo-byound-noir.png";
export const EDGE_EMAIL_LOGO_ON_DARK_URL = "https://www.byound.fr/brand/logo-byound-blanc.png";
export const EDGE_EMAIL_MARK_URL = "https://www.byound.fr/brand/logo-b.png";

export type EdgeEmailTone = "light" | "dark";

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
  tone?: EdgeEmailTone;
};

export function edgeEmailBrand(tone: EdgeEmailTone = "light"): string {
  const logo = tone === "dark" ? EDGE_EMAIL_LOGO_ON_DARK_URL : EDGE_EMAIL_LOGO_URL;
  const ink = tone === "dark" ? "#FFFFFF" : "#111111";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td style="width:40px;vertical-align:middle;">
        <img src="${EDGE_EMAIL_MARK_URL}" alt="" width="40" height="40" style="display:block;width:40px;height:40px;border:0;" />
      </td>
      <td style="padding-left:12px;vertical-align:middle;font-size:15px;font-weight:700;letter-spacing:-0.02em;color:${ink};">Byound</td>
    </tr>
  </table>
  <img src="${logo}" alt="Byound" width="112" style="display:block;width:112px;height:auto;margin:28px 0 0;border:0;" />`;
}

export function edgeEmailButton(label: string, href: string, tone: EdgeEmailTone = "light"): string {
  const background = tone === "dark" ? "#FFFFFF" : "#111111";
  const color = tone === "dark" ? "#111111" : "#FFFFFF";
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:32px 0 0;">
    <tr><td style="background:${background};border-radius:8px;">
      <a href="${href}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:14px 22px;font-size:15px;font-weight:700;color:${color};text-decoration:none;letter-spacing:-0.02em;">
        ${escapeEdgeEmailHtml(label)}
      </a>
    </td></tr>
  </table>`;
}

export function buildEdgeEmailShell(params: EdgeEmailShellParams): string {
  const tone = params.tone ?? "light";
  const dark = tone === "dark";
  const page = dark ? "#070C1C" : "#FFFFFF";
  const ink = dark ? "#FFFFFF" : "#111111";
  const body = dark ? "#D5D8E0" : "#3A3D45";
  const muted = dark ? "#8E95A3" : "#8A8F98";
  const line = dark ? "#1C2438" : "#ECECEC";
  const title = escapeEdgeEmailHtml(params.title);
  const preheader = params.preheader ? escapeEdgeEmailHtml(params.preheader) : "";
  const footer = params.footerNote
    ? `<p style="margin:32px 0 0;font-size:14px;line-height:1.5;color:${muted};">${escapeEdgeEmailHtml(params.footerNote)}</p>`
    : "";
  const cta = params.cta ? edgeEmailButton(params.cta.label, params.cta.href, tone) : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${page};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${page};">
    <tr><td align="left" style="padding:56px 28px 72px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
        <tr><td>
          ${edgeEmailBrand(tone)}
          <h1 style="margin:36px 0 0;font-size:40px;line-height:1.05;font-weight:800;letter-spacing:-1.4px;color:${ink};">${title}</h1>
          <div style="max-width:440px;margin:14px 0 0;font-size:16px;line-height:1.55;color:${body};">${params.bodyHtml}</div>
          ${cta}
          ${footer}
          <p style="margin:48px 0 0;padding-top:24px;border-top:1px solid ${line};font-size:13px;line-height:1.5;color:${muted};">
            Byound · <a href="https://www.byound.fr" style="color:${ink};text-decoration:none;">byound.fr</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function edgeEmailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;">${escapeEdgeEmailHtml(text)}</p>`;
}

export function edgeEmailHighlight(label: string, value: string): string {
  return `<p style="margin:28px 0 0;font-size:15px;line-height:1.5;color:#111111;">
    <span style="display:block;font-size:13px;color:#8A8F98;margin-bottom:4px;">${escapeEdgeEmailHtml(label)}</span>
    <strong style="font-size:18px;letter-spacing:-0.02em;">${escapeEdgeEmailHtml(value)}</strong>
  </p>`;
}
