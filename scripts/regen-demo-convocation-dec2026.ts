/**
 * Régénère une convocation de démo sur une session décembre 2026
 * (compte / dossier de test), vers Downloads.
 *
 *   pnpm exec tsx scripts/regen-demo-convocation-dec2026.ts
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const PRINTNGO_DOSSIER = "5bee16a8-dbd1-4851-951d-642d6b4101cd";

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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env manquant");
  const service = createClient(url, key);

  const { loadDossierDocContext } = await import(
    "../src/lib/formation-documents/context"
  );
  const { fillConvocationPdf, buildConvocationHtml } = await import(
    "../src/lib/formation-documents/convocation-html"
  );

  let ctx = await loadDossierDocContext(service, PRINTNGO_DOSSIER);
  if (!ctx) throw new Error("Dossier Printngo introuvable");

  // Déplacer / créer créneaux sur une journée de décembre 2026 (7 h).
  const sessionDate = "2026-12-10";
  // Journée de 7 h (9h–12h + 13h–17h, Europe/Paris, UTC+1 en décembre).
  const morningStart = `${sessionDate}T08:00:00.000Z`;
  const morningEnd = `${sessionDate}T11:00:00.000Z`;
  const afternoonStart = `${sessionDate}T12:00:00.000Z`;
  const afternoonEnd = `${sessionDate}T16:00:00.000Z`;

  // Injecte des créneaux décembre 2026 dans le contexte (PDF démo — sans muter la prod
  // si la session d'audit Printngo doit rester en novembre).
  ctx = {
    ...ctx,
    slots: [
      {
        slot_date: sessionDate,
        day_part: "matin",
        starts_at: morningStart,
        ends_at: morningEnd,
        location_label: ctx.session?.location_label ?? null,
      },
      {
        slot_date: sessionDate,
        day_part: "apres_midi",
        starts_at: afternoonStart,
        ends_at: afternoonEnd,
        location_label: ctx.session?.location_label ?? null,
      },
    ],
  };

  const participant =
    ctx.participants[0]?.name ||
    ctx.dossier.contact_name ||
    "Hugues THOUIN";

  const issuedAt = new Date("2026-11-26T10:00:00.000Z");
  const pdf = await fillConvocationPdf(ctx, {
    participantName: participant,
    issuedAt,
  });
  if (!pdf) throw new Error("PDF convocation null");

  const out = path.join(
    process.env.HOME || "",
    "Downloads",
    "convocation-demo-decembre-2026.pdf",
  );
  fs.writeFileSync(out, pdf);
  console.log("OK", out, `(${pdf.length} bytes)`);

  const { html, ref } = buildConvocationHtml(ctx, {
    participantName: participant,
    issuedAt,
    trainerName: null,
  });
  const htmlOut = out.replace(/\.pdf$/, ".html");
  fs.writeFileSync(htmlOut, html);
  console.log("ref", ref, "html", htmlOut);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
