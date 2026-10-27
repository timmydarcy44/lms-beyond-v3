import { jsPDF } from "jspdf";

export type CareInvoiceLine = {
  label: string;
  cents: number;
};

export type CareInvoicePdfInput = {
  invoiceNumber: string;
  issuedAt?: Date;
  expertName: string;
  expertHeadline?: string | null;
  expertEmail?: string | null;
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientAddressLine?: string | null;
  clientPostalCode?: string | null;
  clientCity?: string | null;
  followUpLabel?: string | null;
  lines: CareInvoiceLine[];
};

function euros(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function longDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function buildCareInvoicePdf(input: CareInvoicePdfInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const right = pageW - margin;
  const issuedAt = input.issuedAt ?? new Date();
  const total = input.lines.reduce((sum, line) => sum + line.cents, 0);
  const fullName = [input.clientFirstName, input.clientLastName].filter(Boolean).join(" ").trim() || "Client";
  const postal = [input.clientAddressLine, [input.clientPostalCode, input.clientCity].filter(Boolean).join(" ")]
    .map((part) => part?.trim())
    .filter(Boolean);

  doc.setFillColor(7, 8, 11);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(244, 245, 247);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("BYOUND CARE", margin, 18);
  doc.setFontSize(11);
  doc.text("FACTURE", right, 18, { align: "right" });

  doc.setTextColor(7, 8, 11);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Émetteur", margin, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(input.expertName || "Expert Byound", margin, 48);
  let expertY = 53;
  if (input.expertHeadline?.trim()) {
    doc.text(input.expertHeadline.trim(), margin, expertY);
    expertY += 5;
  }
  if (input.expertEmail?.trim()) {
    doc.text(input.expertEmail.trim(), margin, expertY);
  }

  const clientX = 118;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Client", clientX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  let clientY = 48;
  doc.text(fullName, clientX, clientY);
  clientY += 5;
  doc.text(input.clientEmail, clientX, clientY);
  clientY += 5;
  for (const line of postal.length ? postal : ["Adresse postale non renseignée"]) {
    doc.text(line, clientX, clientY, { maxWidth: pageW - clientX - margin });
    clientY += 5;
  }
  if (input.followUpLabel?.trim()) {
    doc.text(input.followUpLabel.trim(), clientX, clientY, { maxWidth: pageW - clientX - margin });
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`N° ${input.invoiceNumber}`, margin, 78);
  doc.text(`Date : ${longDate(issuedAt)}`, right, 78, { align: "right" });
  doc.setTextColor(7, 8, 11);

  const tableTop = 88;
  doc.setFillColor(244, 245, 247);
  doc.rect(margin, tableTop - 7, pageW - margin * 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Désignation", margin + 2, tableTop);
  doc.text("Montant", right - 2, tableTop, { align: "right" });

  let y = tableTop + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const line of input.lines) {
    doc.text(line.label, margin + 2, y, { maxWidth: 140 });
    doc.text(euros(line.cents), right - 2, y, { align: "right" });
    y += 8;
  }

  doc.setDrawColor(30, 33, 48);
  doc.line(margin, y, right, y);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC", margin + 2, y);
  doc.text(euros(total), right - 2, y, { align: "right" });

  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(90, 96, 163);
  doc.text(
    "Prestation Byound Care. TVA non applicable, art. 293 B du CGI, sauf mention contraire de l'expert.",
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );

  return doc;
}

export function careInvoicePdfBuffer(input: CareInvoicePdfInput): Buffer {
  const doc = buildCareInvoicePdf(input);
  return Buffer.from(doc.output("arraybuffer") as ArrayBuffer);
}
