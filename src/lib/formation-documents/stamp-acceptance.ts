import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export type AcceptanceStamp = {
  documentLabel: string;
  signerName: string;
  signerRole?: string | null;
  signedAt: string;
  method?: string | null;
  emailedTo?: string | null;
  /** N° de suivi cryptographique (ex. BYS-DEV-7K3M-…) */
  trackingId?: string | null;
  /** Empreinte courte (12 hex) */
  sealShort?: string | null;
};

function formatSignedAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodLabel(raw?: string | null): string {
  const v = String(raw || "").toLowerCase();
  if (v.includes("otp") || v.includes("email")) return "Signature électronique (code e-mail OTP)";
  if (v.includes("simple")) return "Acceptation électronique";
  return raw?.trim() || "Signature électronique Byound";
}

/**
 * Cachet visible Qualiopi en bas de dernière page (devis / convention signés).
 * Indépendant du template AcroForm ou HTML.
 */
export async function stampAcceptanceOnPdf(
  pdfBuffer: Buffer,
  stamp: AcceptanceStamp,
): Promise<Buffer> {
  const pdf = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();
  const page = pages[pages.length - 1];
  if (!page) return pdfBuffer;

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const { width } = page.getSize();

  const boxW = Math.min(300, width - 48);
  const boxH = stamp.trackingId ? 96 : 78;
  const x = width - boxW - 28;
  const y = 24;

  page.drawRectangle({
    x,
    y,
    width: boxW,
    height: boxH,
    color: rgb(0.97, 0.96, 1),
    borderColor: rgb(0.42, 0.36, 0.96),
    borderWidth: 1.4,
  });

  page.drawRectangle({
    x: x + 8,
    y: y + boxH - 22,
    width: 52,
    height: 14,
    color: rgb(0.42, 0.36, 0.96),
  });
  page.drawText("SIGNÉ", {
    x: x + 14,
    y: y + boxH - 18.5,
    size: 8,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  const lines = [
    `${stamp.documentLabel} accepté(e)`,
    `Le ${formatSignedAt(stamp.signedAt)}`,
    `Par ${stamp.signerName}${stamp.signerRole ? ` · ${stamp.signerRole}` : ""}`,
    methodLabel(stamp.method),
    stamp.trackingId ? `N° suivi ${stamp.trackingId}` : null,
    stamp.sealShort ? `Sceau ${stamp.sealShort}` : null,
    stamp.emailedTo ? `Code envoyé à ${stamp.emailedTo}` : null,
  ].filter(Boolean) as string[];

  let ty = y + boxH - 36;
  for (let i = 0; i < lines.length; i += 1) {
    const text = lines[i]!.slice(0, 62);
    page.drawText(text, {
      x: x + 10,
      y: ty,
      size: i === 0 ? 9 : 7.2,
      font: i === 0 || lines[i]!.startsWith("N° suivi") ? fontBold : font,
      color: i === 0 ? rgb(0.15, 0.12, 0.35) : rgb(0.25, 0.22, 0.4),
    });
    ty -= i === 0 ? 11 : 9.5;
  }

  const out = await pdf.save({ useObjectStreams: false });
  return Buffer.from(out);
}
