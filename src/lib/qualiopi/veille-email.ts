import {
  VEILLE_THEME_LABELS,
  type VeilleDigestItem,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildVeilleWeeklyEmailHtml(input: {
  weekStart: string;
  title: string;
  summary: string;
  items: VeilleDigestItem[];
}) {
  const items = input.items
    .slice(0, 10)
    .map((item) => {
      const theme = item.theme ? VEILLE_THEME_LABELS[item.theme as VeilleTheme] : null;
      const meta = [theme, item.rag === "rag1" ? "RAG 1" : item.rag === "rag2" ? "RAG 2" : null]
        .filter(Boolean)
        .join(" · ");
      const link = item.url
        ? `<p style="margin:6px 0 0;font-size:12px;"><a href="${escapeHtml(item.url)}" style="color:#6E5BFF;">Lire la source</a></p>`
        : "";
      return `<li style="margin:0 0 16px;">
        <strong style="font-size:15px;">${escapeHtml(item.title)}</strong>
        ${meta ? `<p style="margin:2px 0 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.04em;">${escapeHtml(meta)}</p>` : ""}
        <p style="margin:6px 0 0;color:#444;">${escapeHtml(item.summary)}</p>
        ${link}
      </li>`;
    })
    .join("");

  return `<!doctype html>
<html>
  <body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;background:#f7f7f5;padding:24px;">
    <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;">
      <p style="margin:0 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#6E5BFF;">Byound · Qualiopi</p>
      <h1 style="margin:0 0 8px;font-size:24px;">${escapeHtml(input.title || "Veille formation continue")}</h1>
      <p style="margin:0 0 8px;color:#666;">Semaine du ${escapeHtml(input.weekStart)}</p>
      <p style="margin:0 0 24px;color:#333;">${escapeHtml(input.summary)}</p>
      <h2 style="margin:0 0 12px;font-size:16px;">Actualités</h2>
      <ul style="padding-left:18px;margin:0;">${items || "<li>Aucune actualité cette semaine.</li>"}</ul>
      <p style="margin:24px 0 0;font-size:12px;color:#888;">Surligner les infos à retravailler dans /super/crm/qualiopi/veilles</p>
    </div>
  </body>
</html>`;
}
