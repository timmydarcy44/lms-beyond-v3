import { PDFParse } from "pdf-parse";

const MAX_CHARS = 12_000;

/** Seuil : en dessous = PDF scanné / image / illisible (pas d’OCR pour l’instant). */
export const PROOF_PDF_UNREADABLE_MAX_CHARS = 30;

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  // Build legacy, sans worker — compatible serveur Node / Vercel.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const doc = await loadingTask.promise;
  const parts: string[] = [];
  const pages = Math.min(doc.numPages, 20);
  for (let i = 1; i <= pages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => ("str" in item ? String(item.str ?? "") : ""))
      .filter(Boolean)
      .join(" ");
    if (line.trim()) parts.push(line.trim());
  }
  try {
    await doc.destroy();
  } catch {
    /* ignore */
  }
  return parts.join("\n").trim().slice(0, MAX_CHARS);
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText();
    return String(textResult.text ?? "").trim().slice(0, MAX_CHARS);
  } finally {
    try {
      await parser.destroy();
    } catch {
      /* ignore */
    }
  }
}

export type ProofPdfExtractResult = {
  text: string;
  chars: number;
  engine: "pdf-parse" | "pdfjs-legacy" | "none";
  error: string | null;
};

/**
 * Extraction texte PDF côté Node (pas Edge).
 * pdf-parse d’abord, fallback pdfjs-dist legacy sans worker.
 */
export async function extractProofPdfText(buffer: Buffer): Promise<ProofPdfExtractResult> {
  let lastError: string | null = null;

  try {
    const text = await extractWithPdfParse(buffer);
    if (text.length > 0) {
      return { text, chars: text.length, engine: "pdf-parse", error: null };
    }
  } catch (error) {
    lastError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  try {
    const text = await extractWithPdfJs(buffer);
    return {
      text,
      chars: text.length,
      engine: text ? "pdfjs-legacy" : "none",
      error: text ? null : lastError,
    };
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return {
      text: "",
      chars: 0,
      engine: "none",
      error: lastError ? `${lastError} | fallback: ${msg}` : msg,
    };
  }
}
