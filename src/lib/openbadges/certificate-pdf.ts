import { jsPDF } from "jspdf";

export function badgeCertificatePdf(input: {
  name: string;
  recipientName: string;
  issuedLabel: string;
  assertionId: string;
  pageUrl: string;
  stateLabel: string;
  qrPng?: Buffer | null;
}) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setFillColor(5, 6, 8);
  doc.rect(0, 0, width, height, "F");

  const cardX = 150;
  const cardY = 118;
  const cardW = 520;
  const cardH = 328;
  doc.setFillColor(10, 11, 15);
  doc.roundedRect(cardX + 14, cardY + 16, cardW, cardH, 22, 22, "F");
  doc.setFillColor(28, 29, 36);
  doc.roundedRect(cardX, cardY, cardW, cardH, 22, 22, "F");
  doc.setFillColor(59, 60, 71);
  doc.roundedRect(cardX, cardY, cardW, 86, 22, 22, "F");
  doc.setFillColor(28, 29, 36);
  doc.rect(cardX, cardY + 48, cardW, 40, "F");

  doc.setTextColor(240, 240, 246);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Byound", cardX + 28, cardY + 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(185, 174, 255);
  doc.text(input.stateLabel, cardX + 28, cardY + 64);

  doc.setTextColor(240, 240, 246);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const title = doc.splitTextToSize(input.name, 460);
  doc.text(title, cardX + 28, cardY + 140);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(240, 240, 246);
  doc.text(`Délivré à ${input.recipientName}`, cardX + 28, cardY + 230);
  doc.setTextColor(160, 160, 170);
  doc.text(`Obtenu le ${input.issuedLabel}`, cardX + 28, cardY + 252);
  doc.setFontSize(11);
  doc.setTextColor(185, 174, 255);
  doc.text("Open Badges 3.0", cardX + 28, cardY + 286);
  doc.setTextColor(160, 160, 170);
  doc.text(input.assertionId, cardX + 28, cardY + 304);
  doc.text(input.pageUrl, cardX + 28, cardY + 320);

  if (input.qrPng) {
    doc.addImage(input.qrPng, "PNG", width - 140, 36, 96, 96);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
