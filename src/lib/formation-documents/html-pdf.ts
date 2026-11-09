import { readFile } from "fs/promises";
import path from "path";

let cachedInterCss: string | null = null;
let cachedManropeCss: string | null = null;

async function fontFace(
  family: string,
  files: Array<{ file: string; weight: number }>,
): Promise<string> {
  const base = path.join(process.cwd(), "public", "fonts");
  const parts: string[] = [];
  for (const { file, weight } of files) {
    try {
      const bytes = await readFile(path.join(base, file));
      parts.push(`
@font-face {
  font-family: "${family}";
  font-style: normal;
  font-weight: ${weight};
  src: url(data:font/ttf;base64,${bytes.toString("base64")}) format("truetype");
}`);
    } catch {
      /* ignore missing file */
    }
  }
  return parts.join("\n");
}

/** CSS @font-face Inter auto-hébergé (public/fonts) pour Puppeteer. */
export async function loadInterFontFaceCss(): Promise<string> {
  if (cachedInterCss) return cachedInterCss;
  cachedInterCss = await fontFace("Inter", [
    { file: "Inter-Regular.ttf", weight: 400 },
    { file: "Inter-Bold.ttf", weight: 700 },
  ]);
  return cachedInterCss;
}

/** Manrope — page devis néo-banque / PDF A4. */
export async function loadManropeFontFaceCss(): Promise<string> {
  if (cachedManropeCss) return cachedManropeCss;
  cachedManropeCss = await fontFace("Manrope", [
    { file: "Manrope-Regular.ttf", weight: 400 },
    { file: "Manrope-Bold.ttf", weight: 700 },
    { file: "Manrope-ExtraBold.ttf", weight: 800 },
  ]);
  return cachedManropeCss;
}

async function launchBrowser() {
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isVercel) {
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await import("puppeteer-core");
    const executablePath = await chromium.default.executablePath();
    return puppeteer.default.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    });
  }

  try {
    const puppeteer = await import("puppeteer");
    return puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  } catch {
    const puppeteer = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    return puppeteer.default.launch({
      args: chromium.default.args,
      executablePath: await chromium.default.executablePath(),
      headless: true,
    });
  }
}

export type RenderHtmlToPdfOpts = {
  marginMm?: { top: number; right: number; bottom: number; left: number };
  /** Police principale : Inter (défaut) ou Manrope. */
  font?: "inter" | "manrope";
  /** Marges nulles pour gabarits full-bleed. */
  fullBleed?: boolean;
};

/** HTML → PDF A4 via Puppeteer / Chromium serverless. */
export async function renderHtmlToPdf(
  htmlBody: string,
  opts?: RenderHtmlToPdfOpts,
): Promise<Buffer> {
  const fontCss =
    opts?.font === "manrope"
      ? await loadManropeFontFaceCss()
      : await loadInterFontFaceCss();
  const family = opts?.font === "manrope" ? "Manrope" : "Inter";
  const margin = opts?.fullBleed
    ? { top: 0, right: 0, bottom: 0, left: 0 }
    : (opts?.marginMm ?? { top: 14, right: 12, bottom: 16, left: 12 });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
${fontCss}
html, body {
  margin: 0;
  padding: 0;
  font-family: ${family}, "Helvetica Neue", Helvetica, Arial, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: `${margin.top}mm`,
        right: `${margin.right}mm`,
        bottom: `${margin.bottom}mm`,
        left: `${margin.left}mm`,
      },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
