const MAX_CHARS = 12_000;

/** Seuil : en dessous = PDF scanné / image / illisible (pas d’OCR pour l’instant). */
export const PROOF_PDF_UNREADABLE_MAX_CHARS = 30;

export type ProofPdfExtractResult = {
  text: string;
  chars: number;
  engine: "pdf-parse" | "pdfjs-legacy" | "none";
  error: string | null;
};

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  // Legacy build, sans worker — stable en serverless Next/Vercel.
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
      .map((item: { str?: string }) => String(item?.str ?? ""))
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
  // Import dynamique : évite de faire planter le chargement du module route si pdf-parse casse au boot Vercel.
  const mod = await import("pdf-parse");
  const PDFParse = mod.PDFParse;
  if (!PDFParse) throw new Error("PDFParse export manquant");
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

/**
 * Extraction texte PDF côté Node (pas Edge).
 * pdfjs-legacy d’abord (déjà externalisé), puis pdf-parse en secours.
 */
export async function extractProofPdfText(buffer: Buffer): Promise<ProofPdfExtractResult> {
  if (!buffer?.length) {
    return { text: "", chars: 0, engine: "none", error: "empty_buffer" };
  }

  let lastError: string | null = null;

  try {
    const text = await extractWithPdfJs(buffer);
    if (text.length > 0) {
      return { text, chars: text.length, engine: "pdfjs-legacy", error: null };
    }
  } catch (error) {
    lastError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  }

  try {
    const text = await extractWithPdfParse(buffer);
    return {
      text,
      chars: text.length,
      engine: text ? "pdf-parse" : "none",
      error: text ? null : lastError,
    };
  } catch (error) {
    const msg = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    return {
      text: "",
      chars: 0,
      engine: "none",
      error: lastError ? `${lastError} | pdf-parse: ${msg}` : msg,
    };
  }
}
