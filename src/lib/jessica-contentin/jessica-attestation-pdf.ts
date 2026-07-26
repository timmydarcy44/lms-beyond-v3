import { jsPDF } from "jspdf";
import {
  buildJessicaAttestationBody,
  formatFrenchLongDate,
  type JessicaAttestationInput,
} from "@/lib/jessica-contentin/jessica-attestation-shared";

const ISSUER = {
  cabinet: "Cabinet de consultation",
  name: "Madame Jessica CONTENTIN",
  title: "Professeure en santé – Psychopédagogue certifiée en neuroéducation",
  city: "Bretteville-sur-Odon (Calvados)",
  siren: "SIREN : 981 184 898",
};

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/** PDF type attestation de présence (modèle cabinet Jessica). */
export function buildJessicaAttestationPdf(input: JessicaAttestationInput): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 22;
  const contentW = pageW - margin * 2;
  let y = 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(ISSUER.cabinet, margin, y);
  y += 7;

  doc.setFontSize(11);
  doc.text(ISSUER.name, margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const line of [ISSUER.title, ISSUER.city, ISSUER.siren]) {
    const lines = wrapText(doc, line, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 5;
  }

  y += 8;
  const issued = input.issuedDate?.trim() || new Date().toISOString().slice(0, 10);
  doc.text(`Fait à Bretteville-sur-Odon, le ${formatFrenchLongDate(issued)}.`, margin, y);
  y += 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const title = "ATTESTATION DE PRÉSENCE À UNE CONSULTATION";
  const titleLines = wrapText(doc, title, contentW);
  doc.text(titleLines, pageW / 2, y, { align: "center" });
  y += titleLines.length * 7 + 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const body = buildJessicaAttestationBody(input);
  for (const para of body.split(/\n\n+/)) {
    const lines = wrapText(doc, para.replace(/\n/g, " ").trim(), contentW);
    doc.text(lines, margin, y);
    y += lines.length * 6 + 6;
  }

  y += 14;
  doc.setFont("helvetica", "bold");
  doc.text("Madame CONTENTIN", pageW - margin, y, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Professeure en santé et psychopédagogue certifiée", pageW - margin, y, {
    align: "right",
  });
  doc.setTextColor(0, 0, 0);

  return doc;
}

export function jessicaAttestationPdfBase64(input: JessicaAttestationInput): string {
  const doc = buildJessicaAttestationPdf(input);
  const arrayBuffer = doc.output("arraybuffer") as ArrayBuffer;
  return Buffer.from(arrayBuffer).toString("base64");
}

export function attestationFilename(fullName: string, consultationDate: string): string {
  const safe = fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `Attestation-presence-${safe || "client"}-${consultationDate}.pdf`;
}
