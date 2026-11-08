import { readFile } from "fs/promises";
import path from "path";

let cachedFontCss: string | null = null;

/** CSS @font-face Inter auto-hébergé (public/fonts) pour Puppeteer. */
export async function loadInterFontFaceCss(): Promise<string> {
  if (cachedFontCss) return cachedFontCss;
  try {
    const base = path.join(process.cwd(), "public", "fonts");
    const [regular, bold] = await Promise.all([
      readFile(path.join(base, "Inter-Regular.ttf")),
      readFile(path.join(base, "Inter-Bold.ttf")),
    ]);
    cachedFontCss = `
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  src: url(data:font/ttf;base64,${regular.toString("base64")}) format("truetype");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 700;
  src: url(data:font/ttf;base64,${bold.toString("base64")}) format("truetype");
}
`;
  } catch {
    cachedFontCss = "";
  }
  return cachedFontCss;
}

async function launchBrowser() {
  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
}

/** HTML → PDF A4 via Puppeteer (instance partagée convention / devis). */
export async function renderHtmlToPdf(
  htmlBody: string,
  opts?: { marginMm?: { top: number; right: number; bottom: number; left: number } },
): Promise<Buffer> {
  const fontCss = await loadInterFontFaceCss();
  const margin = opts?.marginMm ?? { top: 14, right: 12, bottom: 16, left: 12 };
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<style>
${fontCss}
html, body { font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif; }
</style>
</head>
<body>
${htmlBody}
</body>
</html>`;

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
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
