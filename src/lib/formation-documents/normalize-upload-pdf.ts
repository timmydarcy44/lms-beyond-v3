import { PDFDocument } from "pdf-lib";

const IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png"]);

/**
 * Staff deposit: PDF tel quel, ou JPEG/PNG encapsulé en PDF une page
 * (scans de devis / attestations depuis mobile).
 */
export async function normalizeStaffUploadToPdf(
  file: File,
): Promise<{ buffer: Buffer; error?: undefined } | { buffer?: undefined; error: string }> {
  if (file.size <= 0) return { error: "Fichier vide" };
  if (file.size > 25 * 1024 * 1024) return { error: "Fichier trop volumineux (max 25 Mo)" };

  const name = file.name || "document";
  const type = (file.type || "").toLowerCase();
  const isPdf = type === "application/pdf" || /\.pdf$/i.test(name);
  const isImage = IMAGE_TYPES.has(type) || /\.(jpe?g|png)$/i.test(name);

  if (!isPdf && !isImage) {
    return { error: "PDF, JPEG ou PNG uniquement" };
  }

  const raw = Buffer.from(await file.arrayBuffer());
  if (isPdf) return { buffer: raw };

  try {
    const pdf = await PDFDocument.create();
    const image =
      type.includes("png") || /\.png$/i.test(name)
        ? await pdf.embedPng(raw)
        : await pdf.embedJpg(raw);
    const maxW = 595;
    const maxH = 842;
    const scale = Math.min(1, maxW / image.width, maxH / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    const page = pdf.addPage([maxW, maxH]);
    page.drawImage(image, {
      x: (maxW - w) / 2,
      y: (maxH - h) / 2,
      width: w,
      height: h,
    });
    return { buffer: Buffer.from(await pdf.save()) };
  } catch {
    return { error: "Impossible de convertir l’image en PDF — renvoyez un PDF." };
  }
}
