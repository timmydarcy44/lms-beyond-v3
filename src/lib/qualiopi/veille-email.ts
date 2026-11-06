import { VEILLE_KIND_LABELS, type VeilleDigestItem, type VeilleKind } from "@/lib/qualiopi/veille-shared";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildVeilleWeeklyEmailHtml(input: {
  weekStart: string;
  digests: Array<{ kind: VeilleKind; title: string; summary: string; items: VeilleDigestItem[] }>;
}) {
  const blocks = input.digests
    .map((digest) => {
      const items = digest.items
        .slice(0, 5)
        .map((item) => {
          const link = item.url
            ? `<p style="margin:4px 0 0;"><a href="${escapeHtml(item.url)}" style="color:#6E5BFF;">${escapeHtml(item.url)}</a></p>`
            : "";
          return `<li style="margin:0 0 12px;">
            <strong>${escapeHtml(item.title)}</strong>
            <p style="margin:4px 0 0;color:#444;">${escapeHtml(item.summary)}</p>
            ${link}
          </li>`;
        })
        .join("");
      return `<section style="margin:0 0 28px;">
        <h2 style="margin:0 0 8px;font-size:18px;">${escapeHtml(VEILLE_KIND_LABELS[digest.kind])}</h2>
        <p style="margin:0 0 12px;color:#333;">${escapeHtml(digest.summary)}</p>
        <ul style="padding-left:18px;margin:0;">${items || "<li>Aucun point cette semaine.</li>"}</ul>
      </section>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;background:#f7f7f5;padding:24px;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6E5BFF;">Byound · Qualiopi</p>
      <h1 style="margin:0 0 8px;font-size:24px;">Synthèse des veilles</h1>
      <p style="margin:0 0 24px;color:#666;">Semaine du ${escapeHtml(input.weekStart)} — ouvrez /super/crm/qualiopi/veilles pour surligner ce qui doit être retravaillé.</p>
      ${blocks}
      <p style="margin:24px 0 0;font-size:12px;color:#888;">Mail automatique hebdomadaire (lundi matin).</p>
    </div>
  </body>
</html>`;
}
