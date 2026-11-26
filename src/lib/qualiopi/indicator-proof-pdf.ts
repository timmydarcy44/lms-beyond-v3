import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import { QUALIOPI_CRITERION_NAMES, QUALIOPI_INDICATORS } from "@/lib/qualiopi/indicators";
import { QUALIOPI_INDICATOR_PLANS } from "@/lib/qualiopi/indicator-plans";
import type { QualiopiIndicatorStatus } from "@/lib/qualiopi/status-types";
import {
  Q_PDF,
  escPdf,
  fmtPdfDateTime,
  fmtPdfDay,
  qualiopiPdfShell,
} from "@/lib/qualiopi/pdf-theme";

const UI_STATUS_LABEL: Record<string, string> = {
  proven: "Prouvé",
  todo: "À compléter",
  missing: "Preuve manquante",
  na: "Non applicable",
};

function uiStatusColor(status: string): string {
  if (status === "proven") return Q_PDF.green;
  if (status === "todo") return Q_PDF.amber;
  if (status === "na") return Q_PDF.tert;
  return Q_PDF.red;
}

/**
 * Fiche preuve PDF pour un indicateur Qualiopi (design Revolut).
 * Contient : statut, preuves listées, processus attendu, document type.
 */
export async function buildIndicatorProofPdf(input: {
  indicator: QualiopiIndicatorStatus;
  generatedAtIso?: string;
}): Promise<Buffer> {
  const generatedAtIso = input.generatedAtIso ?? new Date().toISOString();
  const ind = input.indicator;
  const def = QUALIOPI_INDICATORS.find((i) => i.id === ind.indicatorId);
  const plan = QUALIOPI_INDICATOR_PLANS[ind.indicatorId];
  const color = uiStatusColor(ind.status);
  const criterionName =
    QUALIOPI_CRITERION_NAMES[ind.criterionId as 1 | 2 | 3 | 4 | 5 | 6 | 7] ??
    `Critère ${ind.criterionId}`;

  const proofsRows =
    ind.proofs.length === 0
      ? `<tr><td colspan="3" class="muted">${
          ind.status === "na"
            ? "Indicateur hors périmètre — justification N/A ci-dessous."
            : "Aucune preuve automatique enregistrée pour l’instant."
        }</td></tr>`
      : ind.proofs
          .map(
            (p) => `<tr>
              <td>
                <div style="font-weight:800">${escPdf(p.label)}</div>
                ${p.href ? `<div class="muted" style="margin-top:3px;font-size:10px">${escPdf(p.href)}</div>` : ""}
              </td>
              <td class="muted" style="white-space:nowrap">${escPdf(p.updatedAt ? fmtPdfDay(p.updatedAt) : "—")}</td>
              <td style="font-weight:800">${escPdf(p.counter || "—")}</td>
            </tr>`,
          )
          .join("");

  const processHtml = plan
    ? `<div class="card">
        <h2>${escPdf(plan.processTitle)}</h2>
        <ol style="margin:8px 0 0;padding-left:18px;color:${Q_PDF.muted};font-weight:600;font-size:11.5px;line-height:1.55">
          ${plan.processSteps.map((s) => `<li style="margin-bottom:4px">${escPdf(s)}</li>`).join("")}
        </ol>
      </div>
      <div class="card">
        <h2>${escPdf(plan.documentTitle)}</h2>
        <pre style="margin:8px 0 0;white-space:pre-wrap;font-family:Manrope,system-ui,sans-serif;font-size:11px;line-height:1.5;color:${Q_PDF.accentSoft};font-weight:600">${escPdf(plan.documentBody)}</pre>
      </div>`
    : "";

  const helpHtml =
    ind.helpWhere || ind.helpHow
      ? `<div class="card">
          <h2>Où montrer la preuve</h2>
          ${ind.helpWhere ? `<p class="muted" style="margin:8px 0 0;font-size:11.5px"><strong style="color:${Q_PDF.text}">Où :</strong> ${escPdf(ind.helpWhere)}</p>` : ""}
          ${ind.helpHow ? `<p class="muted" style="margin:6px 0 0;font-size:11.5px"><strong style="color:${Q_PDF.text}">Comment :</strong> ${escPdf(ind.helpHow)}</p>` : ""}
        </div>`
      : "";

  const inner = `
    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">Preuve indicateur<br/>${escPdf(fmtPdfDateTime(generatedAtIso))}</div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <span class="pill" style="color:${color}">Ind. ${escPdf(ind.indicatorId)}</span>
        <span class="pill">Critère ${escPdf(ind.criterionId)} · ${escPdf(criterionName)}</span>
        ${ind.scopeTag ? `<span class="pill">${escPdf(ind.scopeTag)}</span>` : ""}
        <span class="pill" style="color:${color}">${escPdf(UI_STATUS_LABEL[ind.status] ?? ind.status)}</span>
      </div>
      <h1>${escPdf(ind.shortTitle || def?.shortTitle || `Indicateur ${ind.indicatorId}`)}</h1>
      <p class="sub">${escPdf(def?.summary || "Exigence Qualiopi RNQ V.10")}</p>
      <div class="kpis">
        <div class="kpi">
          <div class="l">Statut</div>
          <div class="v" style="color:${color};font-size:16px">${escPdf(UI_STATUS_LABEL[ind.status] ?? ind.status)}</div>
          <div class="s">Indicateur ${escPdf(ind.indicatorId)}</div>
        </div>
        <div class="kpi">
          <div class="l">Preuves</div>
          <div class="v">${escPdf(ind.proofs.length)}</div>
          <div class="s">Références listées</div>
        </div>
        <div class="kpi">
          <div class="l">Prochaine action</div>
          <div class="v" style="font-size:14px">${escPdf(ind.nextAction?.label || (ind.status === "proven" ? "Maintenir" : "—"))}</div>
          <div class="s">${escPdf(ind.nextAction?.href || "—")}</div>
        </div>
        <div class="kpi">
          <div class="l">N/A</div>
          <div class="v" style="font-size:14px">${ind.status === "na" ? "Oui" : "Non"}</div>
          <div class="s">${escPdf(ind.naJustification || "—")}</div>
        </div>
      </div>
    </header>

    <div class="card">
      <h2>Preuves enregistrées</h2>
      <table class="data">
        <thead><tr><th>Preuve</th><th>Mise à jour</th><th>Métrique</th></tr></thead>
        <tbody>${proofsRows}</tbody>
      </table>
      ${
        ind.naJustification
          ? `<p class="muted" style="margin-top:10px;font-size:11px"><strong style="color:${Q_PDF.text}">Justification N/A :</strong> ${escPdf(ind.naJustification)}</p>`
          : ""
      }
    </div>

    ${helpHtml}
    ${processHtml}

    <footer class="foot">
      Fiche preuve Qualiopi — indicateur ${escPdf(ind.indicatorId)} · Byound Control · ${escPdf(fmtPdfDateTime(generatedAtIso))}.
      Document destiné à l’auditeur : critères, métriques et preuves associées à cet indicateur.
    </footer>`;

  return renderHtmlToPdf(qualiopiPdfShell(inner), { font: "manrope", fullBleed: true });
}
