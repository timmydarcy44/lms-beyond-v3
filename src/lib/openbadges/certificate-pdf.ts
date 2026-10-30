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

  doc.setFillColor(26, 27, 34);
  doc.roundedRect(36, 36, width - 72, height - 72, 24, 24, "F");

  doc.setTextColor(242, 242, 244);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Byound", 64, 78);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(169, 155, 255);
  doc.text(input.stateLabel, 64, 102);

  doc.setTextColor(242, 242, 244);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  const title = doc.splitTextToSize(input.name, 460);
  doc.text(title, 64, 160);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(242, 242, 244);
  doc.text(`Délivré à ${input.recipientName}`, 64, 250);
  doc.setTextColor(160, 160, 170);
  doc.text(`Obtenu le ${input.issuedLabel}`, 64, 274);
  doc.setFontSize(11);
  doc.text("Open Badges 3.0", 64, 310);
  doc.text(input.assertionId, 64, 328);
  doc.text(input.pageUrl, 64, 346);

  if (input.qrPng) {
    doc.addImage(input.qrPng, "PNG", width - 196, height - 196, 120, 120);
  }

  return Buffer.from(doc.output("arraybuffer"));
}
