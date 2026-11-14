import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

/**
 * Filigrane diagonal « SPÉCIMEN » sur toutes les pages (parcours démo Qualiopi Lot 7).
 */
export async function stampSpecimenOnPdf(pdfBuffer: Buffer): Promise<Buffer> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const size = Math.min(64, Math.max(36, width * 0.12));
    const text = "SPECIMEN";
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: height / 2 - size / 2,
      size,
      font,
      color: rgb(0.75, 0.2, 0.25),
      opacity: 0.18,
      rotate: degrees(32),
    });

    // Bandeau haut
    page.drawRectangle({
      x: 0,
      y: height - 22,
      width,
      height: 22,
      color: rgb(0.72, 0.18, 0.22),
    });
    page.drawText("SPECIMEN — dossier de demonstration (hors indicateurs Qualiopi)", {
      x: 14,
      y: height - 15,
      size: 8,
      font,
      color: rgb(1, 1, 1),
    });
  }

  const out = await pdf.save({ useObjectStreams: false });
  return Buffer.from(out);
}
