import { jsPDF } from "jspdf";
import {
  CRITICALITY_BAND_LABELS,
  RISK_STATUS_LABELS,
  criticalityBand,
  type QualiopiRiskRow,
} from "@/lib/qualiopi/risks";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

/** Export PDF du registre des risques qualité (ind. 32). */
export function buildQualiopiRisksPdf(risks: QualiopiRiskRow[]): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const margin = 12;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Registre des risques qualite — Qualiopi ind. 32", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Export du ${fmtDate(new Date().toISOString())} · ${risks.length} risque(s) · Criticite = probabilite x gravite`,
    margin,
    y,
  );
  y += 8;

  const headers = [
    "Libelle",
    "P",
    "G",
    "C",
    "Bande",
    "Statut",
    "Responsable",
    "Echeance",
    "Revue",
    "Action preventive",
  ];
  const widths = [55, 8, 8, 8, 18, 22, 28, 22, 22, 70];

  const drawRow = (cells: string[], bold = false) => {
    if (y > 190) {
      doc.addPage();
      y = 14;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(7);
    let x = margin;
    for (let i = 0; i < cells.length; i++) {
      const w = widths[i] ?? 20;
      const text = doc.splitTextToSize(cells[i] || "—", w - 1);
      doc.text(text, x, y);
      x += w;
    }
    const lines = Math.max(
      1,
      ...cells.map((c, i) => doc.splitTextToSize(c || "—", (widths[i] ?? 20) - 1).length),
    );
    y += lines * 3.6 + 2;
  };

  drawRow(headers, true);
  doc.setDrawColor(180);
  doc.line(margin, y - 1, margin + widths.reduce((a, b) => a + b, 0), y - 1);
  y += 2;

  for (const r of risks) {
    const band = CRITICALITY_BAND_LABELS[criticalityBand(r.criticality)];
    drawRow([
      r.label,
      String(r.probability),
      String(r.severity),
      String(r.criticality),
      band,
      RISK_STATUS_LABELS[r.status],
      r.owner_name || "—",
      fmtDate(r.due_at),
      fmtDate(r.reviewed_at),
      r.preventive_action || r.cause || "—",
    ]);
  }

  y += 4;
  if (y > 190) {
    doc.addPage();
    y = 14;
  }
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    "Document archive pour le PAQ Qualiopi — indicateur 32 (analyse des risques et plan d'actions).",
    margin,
    y,
  );

  return Buffer.from(doc.output("arraybuffer"));
}
