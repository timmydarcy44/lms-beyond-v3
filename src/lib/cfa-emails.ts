import { buildEdgeEmailShell, edgeEmailButton, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

type CfaEmailTemplateOptions = {
  eyebrow?: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
};

function bodyWithEyebrow(eyebrow: string | undefined, body: string, tone: "light" | "dark") {
  if (!eyebrow) return body;
  const color = tone === "dark" ? "#C9CDD6" : "#5C6370";
  return `<p style="margin:0 0 16px;font-size:13px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${color}">${eyebrow}</p>${body}`;
}

export function cfaDarkEmailTemplate({ eyebrow, title, body }: CfaEmailTemplateOptions): string {
  return buildEdgeEmailShell({
    tone: "dark",
    title,
    bodyHtml: bodyWithEyebrow(eyebrow, body, "dark"),
  });
}

export function cfaEmailTemplate({ eyebrow, title, body, cta }: CfaEmailTemplateOptions): string {
  const href = String(cta?.href ?? "").trim();
  const fallback = href
    ? `<p style="margin:24px 0 0;font-size:16px;line-height:1.5;"><a href="${escapeEdgeEmailHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#111111;font-weight:700;text-decoration:underline;">${escapeEdgeEmailHtml(cta!.label)}</a></p><p style="margin:8px 0 0;font-size:13px;line-height:1.55;color:#8A8F98;word-break:break-all;"><a href="${escapeEdgeEmailHtml(href)}" target="_blank" rel="noopener noreferrer" style="color:#5C6370;text-decoration:underline;">${escapeEdgeEmailHtml(href)}</a></p>`
    : "";
  return buildEdgeEmailShell({
    title,
    bodyHtml: `${bodyWithEyebrow(eyebrow, body, "light")}${fallback}`,
    cta: href ? { label: cta!.label, href } : undefined,
  });
}
