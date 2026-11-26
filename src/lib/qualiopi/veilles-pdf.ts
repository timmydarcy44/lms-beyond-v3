import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import {
  VEILLE_AXES,
  VEILLE_THEME_LABELS,
  type VeilleDigest,
  type VeilleHighlight,
  type VeilleTheme,
} from "@/lib/qualiopi/veille-shared";
import {
  Q_PDF,
  escPdf,
  fmtPdfDateTime,
  fmtPdfDay,
  qualiopiPdfShell,
} from "@/lib/qualiopi/pdf-theme";

function asItems(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>>;
}

/** Registre PDF des veilles Qualiopi (ind. 23 / 24 / 25) — design Revolut. */
export async function buildVeillesRegistrePdf(input: {
  digests: VeilleDigest[];
  highlights: VeilleHighlight[];
  generatedAtIso?: string;
}): Promise<Buffer> {
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString();
  const digests = input.digests ?? [];
  const highlights = input.highlights ?? [];

  const doneByTheme = (theme: VeilleTheme) =>
    highlights.filter((h) => (h.theme || "reglementaire") === theme && h.status === "done").length;
  const savedByTheme = (theme: VeilleTheme) =>
    highlights.filter((h) => (h.theme || "reglementaire") === theme).length;

  const axisCards = VEILLE_AXES.map((axis) => {
    const done = doneByTheme(axis.theme);
    const total = savedByTheme(axis.theme);
    return `<div class="kpi">
      <div class="l">Ind. ${escPdf(axis.indicatorId)}</div>
      <div class="v" style="font-size:16px">${escPdf(axis.shortTitle)}</div>
      <div class="s">${escPdf(done)} traité(s) / ${escPdf(total)} suivi(s)</div>
    </div>`;
  }).join("");

  const highlightsRows =
    highlights.length === 0
      ? `<tr><td colspan="4" class="muted">Aucun surlignage enregistré.</td></tr>`
      : highlights
          .slice(0, 80)
          .map((h) => {
            const theme = (h.theme || "reglementaire") as VeilleTheme;
            const axis = VEILLE_AXES.find((a) => a.theme === theme);
            return `<tr>
              <td><span class="pill">Ind. ${escPdf(axis?.indicatorId ?? "—")}</span></td>
              <td>
                <div style="font-weight:800">${escPdf(h.title)}</div>
                <div class="muted" style="margin-top:3px;font-size:10px">${escPdf(VEILLE_THEME_LABELS[theme] ?? theme)} · ${escPdf(h.status)}</div>
                <div class="muted" style="margin-top:4px;font-size:10px">${escPdf((h.excerpt || "").slice(0, 220))}</div>
                ${h.url ? `<div class="muted" style="margin-top:3px;font-size:10px">${escPdf(h.url)}</div>` : ""}
              </td>
              <td class="muted" style="white-space:nowrap">${escPdf(fmtPdfDay(h.updated_at || h.created_at))}</td>
              <td class="muted" style="font-size:10px">${escPdf((h.note || "—").slice(0, 120))}</td>
            </tr>`;
          })
          .join("");

  const digestsHtml = digests
    .slice(0, 8)
    .map((d) => {
      const items = asItems(d.items);
      const list = items
        .slice(0, 12)
        .map((item) => {
          const title = String(item.title ?? "Sans titre");
          const summary = String(item.summary ?? "").slice(0, 180);
          const url = item.url ? String(item.url) : "";
          const theme = item.theme ? String(item.theme) : "";
          return `<li style="margin-bottom:8px">
            <div style="font-weight:800">${escPdf(title)}</div>
            ${theme ? `<div class="muted" style="font-size:10px">${escPdf(VEILLE_THEME_LABELS[theme as VeilleTheme] ?? theme)}</div>` : ""}
            <div class="muted" style="font-size:10px;margin-top:2px">${escPdf(summary)}</div>
            ${url ? `<div class="muted" style="font-size:10px">${escPdf(url)}</div>` : ""}
          </li>`;
        })
        .join("");
      return `<div class="card">
        <h2>${escPdf(d.title || "Synthèse veille")}</h2>
        <p class="muted" style="margin:4px 0 0;font-size:11px">Semaine du ${escPdf(fmtPdfDay(d.week_start))} · ${escPdf(d.kind)}</p>
        ${d.summary ? `<p style="margin:10px 0 0;font-size:11.5px;font-weight:650;color:${Q_PDF.accentSoft}">${escPdf(d.summary)}</p>` : ""}
        <ul style="margin:12px 0 0;padding-left:16px">${list || `<li class="muted">Aucun item</li>`}</ul>
      </div>`;
    })
    .join("");

  const inner = `
    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">Indicateurs 23 · 24 · 25<br/>${escPdf(fmtPdfDateTime(generatedAtIso))}</div>
      </div>
      <h1>Registre des veilles</h1>
      <p class="sub">Preuves Qualiopi — légale & réglementaire, compétences & métiers, innovations pédagogiques</p>
      <div class="kpis">${axisCards}<div class="kpi"><div class="l">Synthèses</div><div class="v">${escPdf(digests.length)}</div><div class="s">Digests exportés</div></div></div>
    </header>

    <div class="card">
      <h2>Surlignages traités / suivis</h2>
      <table class="data">
        <thead><tr><th>Axe</th><th>Contenu</th><th>Date</th><th>Note</th></tr></thead>
        <tbody>${highlightsRows}</tbody>
      </table>
    </div>

    ${digestsHtml || `<div class="card"><h2>Synthèses</h2><p class="muted">Aucune synthèse de veille.</p></div>`}

    <footer class="foot">
      Document généré pour l’audit Qualiopi (ind. 23, 24, 25) — Byound Control · ${escPdf(fmtPdfDateTime(generatedAtIso))}.
    </footer>`;

  return renderHtmlToPdf(qualiopiPdfShell(inner), { font: "manrope", fullBleed: true });
}
