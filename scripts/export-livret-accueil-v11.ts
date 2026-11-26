/**
 * Génère le livret d'accueil Qualiopi v1.1 (PDF) vers Downloads + docs.
 *
 *   pnpm exec tsx scripts/export-livret-accueil-v11.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function ensureChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH?.trim()) return;
  const candidates = [
    ...(() => {
      try {
        const found = execSync(
          'find /var/folders -name "Google Chrome for Testing" 2>/dev/null | head -1',
          { encoding: "utf8" },
        ).trim();
        return found ? [found] : [];
      } catch {
        return [];
      }
    })(),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = c;
      console.log("Chrome:", c);
      return;
    }
  }
}

async function main() {
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  ensureChromePath();

  const { fillLivretAccueilPdf } = await import(
    "../src/lib/formation-documents/livret-accueil-html"
  );
  const buf = await fillLivretAccueilPdf();
  const downloads = path.join(process.env.HOME || "", "Downloads");
  const out1 = path.join(downloads, "Livret_accueil_Byound-v1.1.pdf");
  const out2 = path.join(
    process.cwd(),
    "docs/formation-templates/Livret_accueil_Byound-v1.1.pdf",
  );
  fs.mkdirSync(path.dirname(out2), { recursive: true });
  fs.writeFileSync(out1, buf);
  fs.writeFileSync(out2, buf);
  console.log("OK", out1, `(${buf.length} bytes)`);
  console.log("OK", out2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
