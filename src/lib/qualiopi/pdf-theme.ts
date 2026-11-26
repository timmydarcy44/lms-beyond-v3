/** Tokens partagés pour les exports PDF Qualiopi (esprit Revolut / Byound Control). */

export const Q_PDF = {
  bg: "#070A12",
  card: "#0E1424",
  border: "#1C2744",
  text: "#F4F6FB",
  muted: "#9AA3BD",
  tert: "#6C7593",
  accent: "#6E5BFF",
  accentSoft: "#C9C2FF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  red: "#FF8A9B",
  blue: "#8DB8FF",
  teal: "#5EDCC3",
} as const;

export function escPdf(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmtPdfDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date(t));
}

export function fmtPdfDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(new Date(t));
}

export const QUALIOPI_STATUS_LABEL: Record<string, string> = {
  validated: "En place",
  partial: "Partiel",
  missing: "Manquant",
  not_applicable: "N/A",
};

export function qualiopiStatusColor(status: string): string {
  if (status === "validated") return Q_PDF.green;
  if (status === "partial") return Q_PDF.amber;
  if (status === "not_applicable") return Q_PDF.tert;
  return Q_PDF.red;
}

/** Feuille A4 dark full-bleed pour Puppeteer. */
export function qualiopiPdfShell(innerHtml: string): string {
  const t = Q_PDF;
  return `
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${t.bg}; color: ${t.text}; }
  .sheet { padding: 22px 20px 28px; font-size: 12px; line-height: 1.45; }
  .hero {
    border-radius: 22px; padding: 22px; margin-bottom: 14px;
    border: 1px solid ${t.border};
    background:
      radial-gradient(120% 80% at 0% 0%, rgba(110,91,255,.34), transparent 55%),
      linear-gradient(160deg, #121933 0%, ${t.bg} 72%);
  }
  .brand { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .brand-mark {
    font-size: 12px; font-weight: 800; letter-spacing: .14em;
    text-transform: uppercase; color: ${t.accentSoft};
  }
  .brand-meta { font-size: 10px; font-weight: 600; color: ${t.muted}; text-align: right; }
  h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }
  .sub { margin-top: 6px; color: ${t.muted}; font-weight: 600; font-size: 12px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 16px; }
  .kpi {
    border-radius: 16px; padding: 12px; background: rgba(7,10,18,.45);
    border: 1px solid rgba(255,255,255,.06);
  }
  .kpi .l { font-size: 10px; font-weight: 700; color: ${t.muted}; text-transform: uppercase; letter-spacing: .05em; }
  .kpi .v { margin-top: 4px; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
  .kpi .s { margin-top: 2px; font-size: 11px; color: ${t.tert}; font-weight: 600; }
  .card {
    border-radius: 18px; padding: 14px 16px; margin-bottom: 10px;
    background: ${t.card}; border: 1px solid ${t.border}; page-break-inside: avoid;
  }
  .card h2 { margin: 0 0 8px; font-size: 14px; font-weight: 800; }
  .pill {
    display: inline-flex; align-items: center; border-radius: 999px;
    padding: 3px 9px; font-size: 10px; font-weight: 700;
    border: 1px solid ${t.border}; background: rgba(255,255,255,.04);
  }
  table.data { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
  table.data th {
    text-align: left; color: ${t.muted}; font-weight: 700; font-size: 9px;
    text-transform: uppercase; letter-spacing: .04em;
    padding: 0 6px 8px 0; border-bottom: 1px solid ${t.border};
  }
  table.data td {
    padding: 8px 6px 8px 0; border-bottom: 1px solid rgba(28,39,68,.85);
    vertical-align: top; font-weight: 600;
  }
  table.data tr:last-child td { border-bottom: none; }
  .muted { color: ${t.muted}; }
  .foot {
    margin-top: 14px; padding: 12px 14px; border-radius: 14px;
    border: 1px dashed ${t.border}; color: ${t.muted}; font-size: 10px; font-weight: 600;
  }
</style>
<div class="sheet">${innerHtml}</div>`;
}
