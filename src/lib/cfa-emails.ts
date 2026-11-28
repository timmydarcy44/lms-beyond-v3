import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

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
  return buildEdgeEmailShell({
    title,
    bodyHtml: bodyWithEyebrow(eyebrow, body, "light"),
    cta: href ? { label: cta!.label, href } : undefined,
  });
}
