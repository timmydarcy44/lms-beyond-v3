import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Fusionne le corps AcroForm rempli + l'annexe PDF dynamique,
 * puis numérote toutes les pages (le modèle corps n'a plus de numéros imprimés).
 */
export async function assembleConventionPdf(params: {
  corpsPdf: Buffer;
  annexPdf: Buffer;
  conventionRef: string;
  ofFooter?: string;
}): Promise<Buffer> {
  const out = await PDFDocument.create();
  const corps = await PDFDocument.load(params.corpsPdf, { ignoreEncryption: true });
  const annex = await PDFDocument.load(params.annexPdf, { ignoreEncryption: true });

  const corpsPages = await out.copyPages(corps, corps.getPageIndices());
  corpsPages.forEach((p) => out.addPage(p));
  const annexPages = await out.copyPages(annex, annex.getPageIndices());
  annexPages.forEach((p) => out.addPage(p));

  const font = await out.embedFont(StandardFonts.Helvetica);
  const total = out.getPageCount();
  const footerLeft =
    params.ofFooter ||
    "SAS Byound Business · 134 rue Élise Deroche, 14760 Bretteville-sur-Odon · contact@byound.fr";
  const ref = params.conventionRef;

  for (let i = 0; i < total; i++) {
    const page = out.getPage(i);
    const { width } = page.getSize();
    const y = 18;
    const size = 7;
    const left = `Convention de formation professionnelle · n° ${ref}`;
    const right = `${String(i + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

    page.drawText(left, {
      x: 36,
      y,
      size,
      font,
      color: rgb(0.45, 0.47, 0.55),
    });
    page.drawText(footerLeft, {
      x: 36,
      y: y - 10,
      size: 6.5,
      font,
      color: rgb(0.55, 0.57, 0.64),
    });
    const rightWidth = font.widthOfTextAtSize(right, size);
    page.drawText(right, {
      x: width - 36 - rightWidth,
      y,
      size,
      font,
      color: rgb(0.45, 0.47, 0.55),
    });
  }

  const bytes = await out.save();
  return Buffer.from(bytes);
}
