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

async function loadPuppeteerCore(): Promise<{
  launch: (opts: Record<string, unknown>) => Promise<{ newPage: () => Promise<unknown>; close: () => Promise<void> }>;
}> {
  const mod = (await import("puppeteer-core")) as {
    default?: { launch: (opts: Record<string, unknown>) => Promise<unknown>; _isPuppeteerCore?: boolean };
    launch?: (opts: Record<string, unknown>) => Promise<unknown>;
  };
  // Prefer the PuppeteerNode singleton (default), not the namespace `launch` helper.
  if (mod.default && typeof mod.default.launch === "function") {
    return mod.default as { launch: (opts: Record<string, unknown>) => Promise<{ newPage: () => Promise<unknown>; close: () => Promise<void> }> };
  }
  if (typeof mod.launch === "function") {
    return mod as { launch: (opts: Record<string, unknown>) => Promise<{ newPage: () => Promise<unknown>; close: () => Promise<void> }> };
  }
  throw new Error("puppeteer-core.launch introuvable");
}

async function launchBrowser() {
  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
  ];

  const localChrome =
    process.env.PUPPETEER_EXECUTABLE_PATH?.trim() ||
    process.env.CHROME_PATH?.trim() ||
    null;

  // Priorité au Chrome local (scripts / .env) même si VERCEL=1 est présent dans .env.local
  if (localChrome) {
    const puppeteer = await loadPuppeteerCore();
    return puppeteer.launch({
      executablePath: localChrome,
      headless: true,
      args: launchArgs,
    });
  }

  const isServerless = Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
      (process.env.VERCEL && process.env.VERCEL_ENV),
  );
  if (isServerless) {
    const chromium = await import("@sparticuz/chromium");
    const puppeteer = await loadPuppeteerCore();
    const executablePath = await chromium.default.executablePath();
    return puppeteer.launch({
      args: chromium.default.args,
      defaultViewport: { width: 1280, height: 720 },
      executablePath,
      headless: true,
    });
  }

  try {
    const mod = await import("puppeteer");
    const puppeteer = (mod as { default?: { launch: (o: Record<string, unknown>) => Promise<unknown> } })
      .default;
    if (!puppeteer?.launch) throw new Error("puppeteer.launch missing");
    return puppeteer.launch({
      headless: true,
      args: launchArgs,
    }) as Promise<{ newPage: () => Promise<unknown>; close: () => Promise<void> }>;
  } catch {
    const puppeteer = await loadPuppeteerCore();
    const chromium = await import("@sparticuz/chromium");
    return puppeteer.launch({
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
