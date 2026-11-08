import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

/**
 * Assemble un devis hybride :
 * page 1 du corps → pages détail HTML → page 2 du corps (récap / bon pour accord),
 * puis numérotation globale.
 */
export async function assembleQuote(params: {
  corpsPdf: Buffer;
  detailPdf: Buffer;
  quoteNumber: string;
  ofFooter?: string;
}): Promise<Buffer> {
  const out = await PDFDocument.create();
  const corps = await PDFDocument.load(params.corpsPdf, { ignoreEncryption: true });
  const detail = await PDFDocument.load(params.detailPdf, { ignoreEncryption: true });

  const corpsCount = corps.getPageCount();
  if (corpsCount < 2) {
    throw new Error(`Devis corps invalide : ${corpsCount} page(s), 2 attendues`);
  }

  const [page1] = await out.copyPages(corps, [0]);
  out.addPage(page1);

  const detailPages = await out.copyPages(detail, detail.getPageIndices());
  detailPages.forEach((p) => out.addPage(p));

  const [page2] = await out.copyPages(corps, [1]);
  out.addPage(page2);

  // Pages corps > 2 (sécurité) : append après
  if (corpsCount > 2) {
    const extras = await out.copyPages(
      corps,
      Array.from({ length: corpsCount - 2 }, (_, i) => i + 2),
    );
    extras.forEach((p) => out.addPage(p));
  }

  const font = await out.embedFont(StandardFonts.Helvetica);
  const total = out.getPageCount();
  /** Helvetica WinAnsi : pas d’espaces fins / ° / puces exotiques. */
  const winAnsi = (s: string) =>
    String(s || "")
      .replace(/[\u202f\u00a0\u2009\u2007]/g, " ")
      .replace(/[°º]/g, "o")
      .replace(/[·•]/g, "-")
      .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, "");
  const footerLeft = winAnsi(
    params.ofFooter ||
      "SAS Byound Business - 134 rue Elise Deroche, 14760 Bretteville-sur-Odon - contact@byound.fr",
  );
  const ref = winAnsi(params.quoteNumber);

  for (let i = 0; i < total; i++) {
    const page = out.getPage(i);
    const { width } = page.getSize();
    const y = 16;
    const size = 7;
    const left = `Devis n ${ref}`;
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
      y: y - 9,
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

  return Buffer.from(await out.save());
}
