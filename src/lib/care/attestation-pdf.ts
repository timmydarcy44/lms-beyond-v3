import { jsPDF } from "jspdf";

const INK: [number, number, number] = [42, 31, 36];
const MUTED: [number, number, number] = [110, 98, 103];
const BERRY: [number, number, number] = [206, 0, 88];

export type AttestationLine = {
  number: string | null;
  issuedAt: string;
  paidAt: string;
  amountCents: number;
  method: string | null;
};

function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function day(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(date);
}

function methodLabel(value: string | null) {
  if (!value) return "Non précisé";
  const labels: Record<string, string> = {
    on_site: "Sur place",
    card: "Carte",
    wallet: "Portefeuille",
    carte: "Carte",
    virement: "Virement",
    especes: "Espèces",
    cheque: "Chèque",
  };
  return labels[value] ?? value;
}

export function attestationPdf(input: {
  practitionerName: string;
  practitionerTitle: string;
  practitionerAddress: string | null;
  patientName: string;
  lines: AttestationLine[];
}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...BERRY);
  doc.rect(0, 0, width, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Byound Care", 48, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Attestation de paiement", 48, 56);

  doc.setTextColor(...INK);
  doc.setFontSize(12);
  let y = 114;
  doc.setFont("helvetica", "bold");
  doc.text(input.practitionerName || "Praticien", 48, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.setFontSize(10);
  if (input.practitionerTitle) {
    y += 16;
    doc.text(input.practitionerTitle, 48, y);
  }
  if (input.practitionerAddress) {
    y += 16;
    doc.text(input.practitionerAddress, 48, y);
  }

  y += 36;
  doc.setTextColor(...INK);
  doc.setFontSize(12);
  doc.text(`Pour ${input.patientName}`, 48, y);
  y += 28;
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text("Date", 48, y);
  doc.text("Référence", 150, y);
  doc.text("Règlement", 280, y);
  doc.text("Montant", 460, y);
  y += 8;
  doc.setDrawColor(232, 221, 225);
  doc.line(48, y, width - 48, y);

  let total = 0;
  input.lines.forEach((line) => {
    y += 22;
    if (y > 740) {
      doc.addPage();
      y = 64;
    }
    total += line.amountCents;
    doc.setTextColor(...INK);
    doc.text(day(line.paidAt), 48, y);
    doc.text(line.number || "—", 150, y);
    doc.text(methodLabel(line.method), 280, y);
    doc.text(euros(line.amountCents), 460, y);
  });

  y += 18;
  doc.line(48, y, width - 48, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total réglé", 48, y);
  doc.text(euros(total), 460, y);

  y += 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  const notice = doc.splitTextToSize(
    "Ce document atteste des sommes réglées. Il ne précise pas le motif de l'accompagnement.",
    width - 96,
  );
  doc.text(notice, 48, y);
  return doc.output("arraybuffer");
}
