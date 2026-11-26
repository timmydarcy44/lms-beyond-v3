import { renderHtmlToPdf } from "@/lib/formation-documents/html-pdf";
import { deriveReclamationSource, RECLAMATION_SOURCE_LABELS } from "@/lib/qualiopi/reclamation-sources";
import { RECLAMATION_STEP_LABELS, resolveReclamationStep } from "@/lib/qualiopi/reclamation-status";
import { RECLAMATION_THEME_LABELS, type ReclamationTheme } from "@/lib/qualiopi/reclamation-themes";
import {
  Q_PDF,
  escPdf,
  fmtPdfDateTime,
  fmtPdfDay,
  qualiopiPdfShell,
} from "@/lib/qualiopi/pdf-theme";

export type ReclamationExportRow = Record<string, unknown>;

export async function buildReclamationsRegistrePdf(rows: ReclamationExportRow[]): Promise<Buffer> {
  const generatedAtIso = new Date().toISOString();
  const open = rows.filter((r) => {
    const step = resolveReclamationStep(r);
    return step !== "closed" && step !== "answered";
  }).length;

  const tableRows =
    rows.length === 0
      ? `<tr><td colspan="5" class="muted">Aucune réclamation (hors comptes test).</td></tr>`
      : rows
          .map((r) => {
            const step = resolveReclamationStep(r);
            const theme =
              RECLAMATION_THEME_LABELS[(r.theme as ReclamationTheme) ?? "autre"] ?? "Autre";
            const source = RECLAMATION_SOURCE_LABELS[deriveReclamationSource(r)];
            const response = r.response
              ? String(r.response).replace(/\s+/g, " ").slice(0, 220)
              : "—";
            return `<tr>
              <td><span class="pill">${escPdf(RECLAMATION_STEP_LABELS[step])}</span></td>
              <td>
                <div style="font-weight:800">${escPdf(String(r.subject ?? "—"))}</div>
                <div class="muted" style="margin-top:3px;font-size:10px">${escPdf(theme)} · ${escPdf(source)}</div>
                <div class="muted" style="margin-top:3px;font-size:10px">${escPdf(String(r.requester_name || "—"))} (${escPdf(String(r.requester_company || "—"))})</div>
              </td>
              <td class="muted" style="white-space:nowrap">${escPdf(fmtPdfDay(String(r.received_at ?? "")))}</td>
              <td class="muted" style="white-space:nowrap">${escPdf(fmtPdfDay(String(r.answered_at ?? r.closed_at ?? "")))}</td>
              <td class="muted" style="font-size:10px">${escPdf(response)}</td>
            </tr>`;
          })
          .join("");

  const inner = `
    <header class="hero">
      <div class="brand">
        <div class="brand-mark">Byound Control</div>
        <div class="brand-meta">Indicateur 31<br/>${escPdf(fmtPdfDateTime(generatedAtIso))}</div>
      </div>
      <h1>Registre des réclamations</h1>
      <p class="sub">Preuve Qualiopi · hors comptes de test · hors signalements sensibles</p>
      <div class="kpis">
        <div class="kpi"><div class="l">Total</div><div class="v">${escPdf(rows.length)}</div><div class="s">Réclamations exportées</div></div>
        <div class="kpi"><div class="l">Ouvertes</div><div class="v" style="color:${Q_PDF.amber}">${escPdf(open)}</div><div class="s">En cours de traitement</div></div>
        <div class="kpi"><div class="l">Clôturées / répondues</div><div class="v" style="color:${Q_PDF.green}">${escPdf(rows.length - open)}</div><div class="s">Trajet terminé</div></div>
        <div class="kpi"><div class="l">Indicateur</div><div class="v">31</div><div class="s">Traitement des réclamations</div></div>
      </div>
    </header>
    <div class="card">
      <h2>Registre</h2>
      <table class="data">
        <thead><tr><th>Statut</th><th>Objet</th><th>Reçue</th><th>Réponse</th><th>Synthèse</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>
    <footer class="foot">
      Document généré pour l’audit Qualiopi — Byound Control.
      Les signalements sensibles sont exclus de cet export.
    </footer>`;

  return renderHtmlToPdf(qualiopiPdfShell(inner), { font: "manrope", fullBleed: true });
}
