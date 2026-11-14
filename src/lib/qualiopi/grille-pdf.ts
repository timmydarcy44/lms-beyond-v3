import { jsPDF } from "jspdf";
import type { QualiopiComplianceSnapshot } from "@/lib/qualiopi/qualiopi-compliance-audit";
import { mergeComplianceIntoCriteria } from "@/lib/qualiopi/qualiopi-compliance-audit";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR");
}

const STATUS_LABEL: Record<string, string> = {
  validated: "En place",
  partial: "Partiel",
  missing: "Manquant",
  not_applicable: "N/A",
};

/** Export PDF de la grille RNQ V10 (33 indicateurs). */
export function buildQualiopiGrillePdf(snapshot: QualiopiComplianceSnapshot): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const margin = 14;
  const pageW = 210;
  let y = 16;

  const criteria = mergeComplianceIntoCriteria(snapshot);
  const s = snapshot.summary;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Grille Qualiopi — RNQ V.10 (33 indicateurs)", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Export du ${fmtDate(new Date().toISOString())} · Pret audit estime : ${s.readinessPercent}% · Applicables : ${s.applicable}/${s.total} · N/A : ${s.notApplicable}`,
    margin,
    y,
  );
  y += 5;
  doc.text(
    `Valides : ${s.validated} · Partiels : ${s.partial} · Manquants : ${s.missing}`,
    margin,
    y,
  );
  y += 8;

  const ensureSpace = (need: number) => {
    if (y + need > 285) {
      doc.addPage();
      y = 16;
    }
  };

  for (const criterion of criteria) {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const cTitle = doc.splitTextToSize(
      `Critere ${criterion.id} — ${criterion.title}`,
      pageW - margin * 2,
    );
    doc.text(cTitle, margin, y);
    y += cTitle.length * 5 + 2;

    for (const ind of criterion.indicators) {
      const c = ind.compliance;
      const status = c?.status ?? "missing";
      const statusLabel = STATUS_LABEL[status] ?? status;
      const justification =
        status === "not_applicable"
          ? c?.naJustification || c?.attestationNote || c?.reason || ""
          : c?.attestationNote
            ? `Preuve : ${c.attestationNote}`
            : c?.reason || "";

      ensureSpace(22);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`Ind. ${ind.id} — ${statusLabel}`, margin, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const summary = doc.splitTextToSize(ind.summary, pageW - margin * 2);
      doc.text(summary, margin, y);
      y += summary.length * 3.4 + 1;
      if (justification) {
        const just = doc.splitTextToSize(
          status === "not_applicable" ? `Justification N/A : ${justification}` : justification,
          pageW - margin * 2,
        );
        doc.setTextColor(80);
        doc.text(just, margin, y);
        doc.setTextColor(0);
        y += just.length * 3.4 + 2;
      } else {
        y += 2;
      }
      doc.setDrawColor(220);
      doc.line(margin, y, pageW - margin, y);
      y += 3;
    }
    y += 2;
  }

  ensureSpace(16);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100);
  doc.text(
    "Document interne Byound — l'audit certificateur reste decisionnaire. Justifications N/A editables dans /super/crm/qualiopi.",
    margin,
    y,
  );
  doc.setTextColor(0);

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
