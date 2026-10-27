import { jsPDF } from "jspdf";
import { CARE_BERRY_RGB, CARE_LOGO_URL } from "@/lib/expert/care-email";

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
  logoPng?: Uint8Array | null;
  legalName?: string | null;
  siret?: string | null;
  vatLiable?: boolean | null;
};

export function careVatNotice(vatLiable: boolean | null | undefined) {
  if (vatLiable === true) return "TVA applicable.";
  return "TVA non applicable, article 293 B du CGI.";
}

const RED: [number, number, number] = CARE_BERRY_RGB;
const INK: [number, number, number] = [4, 20, 12];
const MUTED: [number, number, number] = [90, 96, 92];
const CREAM: [number, number, number] = [246, 244, 242];
const ON_BERRY: [number, number, number] = [255, 255, 255];

function euros(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

function longDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export async function fetchCareLogoPng(): Promise<Uint8Array | null> {
  try {
    const res = await fetch(CARE_LOGO_URL);
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
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

  doc.setFillColor(...CREAM);
  doc.rect(0, 0, pageW, 297, "F");

  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 36, "F");
  if (input.logoPng?.length) {
    try {
      const b64 = Buffer.from(input.logoPng).toString("base64");
      doc.addImage(`data:image/png;base64,${b64}`, "PNG", margin, 8, 20, 20);
    } catch {
      /* logo optionnel */
    }
  }
  doc.setTextColor(...ON_BERRY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BYOUND CARE", input.logoPng?.length ? margin + 24 : margin, 17);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Accompagnement expert", input.logoPng?.length ? margin + 24 : margin, 24);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("FACTURE", right, 20, { align: "right" });

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Émetteur", margin, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(input.legalName?.trim() || input.expertName || "Expert Byound Care", margin, 56);
  let expertY = 61;
  if (input.legalName?.trim() && input.expertName) {
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(input.expertName, margin, expertY);
    expertY += 5;
    doc.setTextColor(...INK);
    doc.setFontSize(10);
  }
  if (input.siret?.trim()) {
    doc.setFontSize(9);
    doc.text(`SIRET ${input.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4")}`, margin, expertY);
    expertY += 5;
    doc.setFontSize(10);
  }
  if (input.expertHeadline?.trim()) {
    doc.setTextColor(...MUTED);
    doc.text(input.expertHeadline.trim(), margin, expertY, { maxWidth: 88 });
    expertY += 5;
    doc.setTextColor(...INK);
  }
  if (input.expertEmail?.trim()) {
    doc.text(input.expertEmail.trim(), margin, expertY);
  }

  const clientX = 118;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(clientX - 4, 44, pageW - clientX - margin + 4, 32, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...RED);
  doc.text("Facturé à", clientX, 50);
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  let clientY = 56;
  doc.text(fullName, clientX, clientY);
  clientY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(input.clientEmail, clientX, clientY);
  clientY += 5;
  for (const line of postal.length ? postal : ["Adresse postale non renseignée"]) {
    doc.text(line, clientX, clientY, { maxWidth: pageW - clientX - margin });
    clientY += 4.5;
  }
  if (input.followUpLabel?.trim()) {
    doc.setTextColor(...MUTED);
    doc.text(input.followUpLabel.trim(), clientX, clientY, { maxWidth: pageW - clientX - margin });
    doc.setTextColor(...INK);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`N° ${input.invoiceNumber}`, margin, 86);
  doc.text(longDate(issuedAt), right, 86, { align: "right" });

  const tableTop = 96;
  doc.setFillColor(...RED);
  doc.roundedRect(margin, tableTop - 8, pageW - margin * 2, 10, 2, 2, "F");
  doc.setTextColor(...ON_BERRY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Prestation", margin + 3, tableTop - 1.5);
  doc.text("Montant", right - 3, tableTop - 1.5, { align: "right" });

  let y = tableTop + 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...INK);
  for (const line of input.lines) {
    doc.text(line.label, margin + 3, y, { maxWidth: 140 });
    doc.text(euros(line.cents), right - 3, y, { align: "right" });
    y += 8;
  }

  y += 4;
  doc.setFillColor(...RED);
  doc.roundedRect(margin, y - 7, pageW - margin * 2, 14, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...ON_BERRY);
  doc.text("Total", margin + 3, y + 2);
  doc.text(euros(total), right - 3, y + 2, { align: "right" });

  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `Prestation Byound Care. ${careVatNotice(input.vatLiable)}`,
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );

  doc.setFillColor(...RED);
  doc.rect(0, 292, pageW, 5, "F");

  return doc;
}

export function careInvoicePdfBuffer(input: CareInvoicePdfInput): Buffer {
  const doc = buildCareInvoicePdf(input);
  return Buffer.from(doc.output("arraybuffer") as ArrayBuffer);
}
