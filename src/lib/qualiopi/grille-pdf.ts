import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import type { QualiopiComplianceSnapshot } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";
import {
  Q_PDF,
  QUALIOPI_STATUS_LABEL,
  escPdf,
  fmtPdfDateTime,
  qualiopiPdfShell,
  qualiopiStatusColor,
} from "@/lib/qualiopi/pdf-theme";

function buildGrilleHtml(snapshot: QualiopiComplianceSnapshot, generatedAtIso: string): string {
  const criteria = mergeComplianceIntoCriteria(snapshot);
  const s = snapshot.summary;
  const runtime = snapshot.runtime;

  const kpiBlock = `
    <div class="kpis">
      <div class="kpi"><div class="l">Prêt audit</div><div class="v">${escPdf(s.readinessPercent)} %</div><div class="s">${escPdf(s.applicable)} applicables</div></div>
      <div class="kpi"><div class="l">En place</div><div class="v" style="color:${Q_PDF.green}">${escPdf(s.validated)}</div><div class="s">Indicateurs validés</div></div>
      <div class="kpi"><div class="l">Partiels</div><div class="v" style="color:${Q_PDF.amber}">${escPdf(s.partial)}</div><div class="s">À consolider</div></div>
      <div class="kpi"><div class="l">Manquants</div><div class="v" style="color:${Q_PDF.red}">${escPdf(s.missing)}</div><div class="s">N/A ${escPdf(s.notApplicable)}</div></div>
    </div>`;

  const runtimeBlock = `
    <div class="card">
      <h2>Métriques runtime</h2>
      <table class="data">
        <thead><tr><th>Signal</th><th>Valeur</th></tr></thead>
        <tbody>
          <tr><td>Coffre admin (modèles)</td><td>${escPdf(runtime.coreDocsUploaded)}/${escPdf(runtime.coreDocsTotal)}</td></tr>
          <tr><td>Sessions CRM</td><td>${escPdf(runtime.sessionsTotal)}</td></tr>
          <tr><td>Émargements signés</td><td>${escPdf(runtime.sessionsWithSignedAttendance)}</td></tr>
          <tr><td>Réponses satisfaction</td><td>${escPdf(runtime.satisfactionResponses)}</td></tr>
          <tr><td>Cours avec objectifs</td><td>${escPdf(runtime.coursesWithObjectives)}</td></tr>
          <tr><td>Experts approuvés</td><td>${escPdf(runtime.approvedExperts)}</td></tr>
          <tr><td>Attestations</td><td>${escPdf(runtime.attestationsCount)}</td></tr>
        </tbody>
      </table>
    </div>`;

  const criteriaHtml = criteria
    .map((criterion) => {
      const rows = criterion.indicators
        .map((ind) => {
          const c = ind.compliance;
          const status = c?.status ?? "missing";
          const statusLabel = QUALIOPI_STATUS_LABEL[status] ?? status;
          const color = qualiopiStatusColor(status);
          const justification =
            status === "not_applicable"
              ? c?.naJustification || c?.attestationNote || c?.reason || ""
              : c?.attestationNote
                ? `Preuve : ${c.attestationNote}`
                : c?.reason || "";
          const next = c?.nextStep ? `Prochaine étape : ${c.nextStep}` : "";
          return `<tr>
            <td style="width:52px"><span class="pill" style="color:${color}">Ind. ${escPdf(ind.id)}</span></td>
            <td>
              <div style="font-weight:800">${escPdf(ind.summary)}</div>
              <div class="muted" style="margin-top:4px;font-size:10px">${escPdf(justification || "—")}</div>
              ${next ? `<div class="muted" style="margin-top:2px;font-size:10px">${escPdf(next)}</div>` : ""}
            </td>
            <td style="width:78px;color:${color}">${escPdf(statusLabel)}</td>
          </tr>`;
        })
        .join("");
      return `<div class="card">
        <h2>Critère ${escPdf(criterion.id)} — ${escPdf(criterion.title)}</h2>
        <table class="data">
          <thead><tr><th>Ind.</th><th>Exigence & preuve</th><th>Statut</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    })
    .join("");

  const inner = `
    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">Export Qualiopi<br/>${escPdf(fmtPdfDateTime(generatedAtIso))}</div>
      </div>
      <h1>Grille RNQ V.10</h1>
      <p class="sub">Référentiel national qualité · 7 critères · ${escPdf(s.total)} indicateurs · preuves & métriques</p>
      ${kpiBlock}
    </header>
    ${runtimeBlock}
    ${criteriaHtml}
    <footer class="foot">
      Document interne Byound — l’audit certificateur reste décisionnaire.
      Justifications N/A éditables dans /super/crm/qualiopi.
      Pack preuves : grille + registres + coffre dossier.
    </footer>`;

  return qualiopiPdfShell(inner);
}

/** Export PDF grille RNQ (HTML Revolut → Puppeteer). */
export async function buildQualiopiGrillePdf(snapshot: QualiopiComplianceSnapshot): Promise<Buffer> {
  const generatedAtIso = new Date().toISOString();
  const htmlBody = buildGrilleHtml(snapshot, generatedAtIso);
  return renderHtmlToPdf(htmlBody, { font: "manrope", fullBleed: true });
}

/** HTML imprimable (fallback / preview navigateur). */
export function buildQualiopiGrilleHtmlDocument(snapshot: QualiopiComplianceSnapshot): string {
  const generatedAtIso = new Date().toISOString();
  const body = buildGrilleHtml(snapshot, generatedAtIso);
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Grille Qualiopi RNQ</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&display=swap" rel="stylesheet"/>
<style>body{font-family:Manrope,system-ui,sans-serif;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
</head><body>${body}<script>window.onload=()=>{if(new URLSearchParams(location.search).get("autoprint")==="1")setTimeout(()=>window.print(),300)}</script></body></html>`;
}
