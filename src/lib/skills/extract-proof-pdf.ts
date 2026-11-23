const MAX_CHARS = 12_000;

/** Seuil : en dessous = PDF scanné / image / illisible (pas d’OCR pour l’instant). */
export const PROOF_PDF_UNREADABLE_MAX_CHARS = 30;

export type ProofPdfExtractResult = {
  text: string;
  chars: number;
  engine: "pdf-parse" | "pdfjs-legacy" | "none";
  error: string | null;
};

/** pdfjs référence DOMMatrix / Path2D au chargement — absents sur Node/Vercel. */
function ensurePdfJsDomStubs() {
  const g = globalThis as typeof globalThis & {
    DOMMatrix?: unknown;
    ImageData?: unknown;
    Path2D?: unknown;
  };
  if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = class {};
  if (typeof g.ImageData === "undefined") g.ImageData = class {};
  if (typeof g.Path2D === "undefined") g.Path2D = class {};
  if (typeof Promise.withResolvers !== "function") {
    // Node < 22 (souvent Vercel) — requis par pdfjs 4+/5+
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
}

function toPdfBytes(buffer: Buffer): Uint8Array {
  // Copie propre : évite les vues sur pool Buffer Node qui cassent pdfjs.
  return Uint8Array.from(buffer);
}

async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  ensurePdfJsDomStubs();
  // Import dynamique : n’empêche pas le boot de la route si le module casse.
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
  ensurePdfJsDomStubs();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Empêche un worker d’une autre version (conflit 4.x / 5.x) de polluer l’API.
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
 * pdf-parse d’abord (même chemin que les autres routes prod), puis pdfjs-legacy.
 */
export async function extractProofPdfText(buffer: Buffer): Promise<ProofPdfExtractResult> {
  if (!buffer?.length) {
    return { text: "", chars: 0, engine: "none", error: "empty_buffer" };
  }

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
      error: lastError ? `${lastError} | pdfjs: ${msg}` : msg,
    };
  }
}
