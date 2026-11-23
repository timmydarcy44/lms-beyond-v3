const MAX_CHARS = 12_000;

/** Seuil : en dessous = PDF scanné / image / illisible (pas d’OCR pour l’instant). */
export const PROOF_PDF_UNREADABLE_MAX_CHARS = 30;

export type ProofPdfExtractResult = {
  text: string;
  chars: number;
  engine: "unpdf" | "pdf-parse" | "pdfjs-legacy" | "none";
  error: string | null;
};

function toPdfBytes(buffer: Buffer): Uint8Array {
  // Copie propre : évite les vues sur pool Buffer Node qui cassent pdfjs.
  return Uint8Array.from(buffer);
}

/** pdfjs / pdf-parse : stubs + worker (Vercel n’a pas DOMMatrix ni le .worker.mjs tracé). */
async function ensurePdfParseWorker() {
  const g = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = class {};
  if (typeof g.ImageData === "undefined") g.ImageData = class {};
  if (typeof g.Path2D === "undefined") g.Path2D = class {};
  if (typeof Promise.withResolvers !== "function") {
    (Promise as unknown as { withResolvers: () => {
      promise: Promise<unknown>;
      resolve: (v?: unknown) => void;
      reject: (e?: unknown) => void;
    } }).withResolvers = function withResolvers() {
      let resolve!: (v?: unknown) => void;
      let reject!: (e?: unknown) => void;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
  // Enregistre le fake worker pdf-parse (évite « Cannot find module …/pdf.worker.mjs »).
  await import("pdf-parse/worker");
}

async function extractWithUnpdf(buffer: Buffer): Promise<string> {
  // Worker PDF.js inliné — fiable sur Vercel standalone / serverless.
  const { extractText } = await import("unpdf");
  const result = await extractText(toPdfBytes(buffer), { mergePages: true });
  return String(result.text ?? "").trim().slice(0, MAX_CHARS);
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  await ensurePdfParseWorker();
  const mod = await import("pdf-parse");
  const PDFParse = mod.PDFParse;
  if (!PDFParse) throw new Error("PDFParse export manquant");
  const parser = new PDFParse({ data: toPdfBytes(buffer) });
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

async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  await ensurePdfParseWorker();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = "";
  } catch {
    /* ignore */
  }
  const loadingTask = pdfjs.getDocument({
    data: toPdfBytes(buffer),
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

/**
 * Extraction texte PDF côté Node (pas Edge).
 * unpdf d’abord (worker inliné, Vercel-safe), puis pdf-parse, puis pdfjs-legacy.
 */
export async function extractProofPdfText(buffer: Buffer): Promise<ProofPdfExtractResult> {
  if (!buffer?.length) {
    return { text: "", chars: 0, engine: "none", error: "empty_buffer" };
  }

  const errors: string[] = [];

  try {
    const text = await extractWithUnpdf(buffer);
    if (text.length > 0) {
      return { text, chars: text.length, engine: "unpdf", error: null };
    }
  } catch (error) {
    errors.push(`unpdf: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const text = await extractWithPdfParse(buffer);
    if (text.length > 0) {
      return { text, chars: text.length, engine: "pdf-parse", error: null };
    }
  } catch (error) {
    errors.push(`pdf-parse: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const text = await extractWithPdfJs(buffer);
    return {
      text,
      chars: text.length,
      engine: text ? "pdfjs-legacy" : "none",
      error: text ? null : errors.join(" | ") || null,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(`pdfjs: ${msg}`);
    return {
      text: "",
      chars: 0,
      engine: "none",
      error: errors.join(" | "),
    };
  }
}
