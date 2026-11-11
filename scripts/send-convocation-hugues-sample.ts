/**
 * Génère la convocation style Exemple_convocation.pdf pour Hugues THOUIN (Printngo)
 * et l'envoie à une adresse de test (jamais au vrai destinataire).
 *
 *   pnpm exec tsx scripts/send-convocation-hugues-sample.ts
 *   pnpm exec tsx scripts/send-convocation-hugues-sample.ts toi@example.com
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const TO = (process.argv[2] || "timmydarcy44@gmail.com").trim().toLowerCase();
const PRINTNGO_DOSSIER = "5bee16a8-dbd1-4851-951d-642d6b4101cd";

/** Chrome local pour Puppeteer (évite ENOEXEC du binaire puppeteer cassé). */
function ensureChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH?.trim()) {
    console.log("Chrome:", process.env.PUPPETEER_EXECUTABLE_PATH);
    return;
  }
  const fs = require("node:fs") as typeof import("node:fs");
  const { execSync } = require("node:child_process") as typeof import("node:child_process");
  const candidates: string[] = [];
  try {
    const found = execSync(
      'find /var/folders -name "Google Chrome for Testing" 2>/dev/null | head -1',
      { encoding: "utf8" },
    ).trim();
    if (found) candidates.push(found);
  } catch {
    /* ignore */
  }
  candidates.push(
    process.env.CHROME_PATH || "",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  );
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = c;
      console.log("Chrome:", c);
      return;
    }
  }
  console.warn("Aucun Chrome local trouvé — Puppeteer peut échouer");
}

async function main() {
  // .env.local pose souvent VERCEL=1 : ne pas forcer @sparticuz/chromium en local
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  ensureChromePath();
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");
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
  const { buildFormationDocMail } = await import(
    "../src/lib/formation-documents/mail"
  );
  const { sendEmail } = await import("../src/lib/email/resend-client");
  const { EDGE_COCKPIT_FROM } = await import("../src/lib/email/edge-cockpit-from");
  const { uploadFormationPdf } = await import(
    "../src/lib/formation-documents/storage"
  );
  const ctx = await loadDossierDocContext(service, PRINTNGO_DOSSIER);
  if (!ctx) throw new Error("Dossier Printngo introuvable");

  const { data: doc } = await service
    .from("formation_documents")
    .select("id, access_token")
    .eq("dossier_id", PRINTNGO_DOSSIER)
    .eq("kind", "convocation")
    .maybeSingle();
  if (!doc?.access_token) throw new Error("Document convocation Printngo sans access_token");

  // Contexte « comme si » Hugues THOUIN
  const participantName = "Hugues THOUIN";
  const buffer = await fillConvocationPdf(ctx, {
    participantName,
    participantJobTitle: "Dirigeant",
    positionnementUrl: "https://www.byound.fr/formation-assessment?token=sample-hugues",
  });
  if (!buffer?.length) throw new Error("Génération PDF convocation échouée");

  const uploaded = await uploadFormationPdf(service, {
    dossierId: PRINTNGO_DOSSIER,
    kind: "convocation",
    buffer,
  });
  if (uploaded) {
    await service
      .from("formation_documents")
      .update({
        file_url: uploaded.fileUrl,
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.path,
        status: "sent",
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        meta: { participant_name: participantName, sample: true },
      })
      .eq("id", doc.id);
  }

  const { ref } = buildConvocationHtml(ctx, { participantName });
  const courseTitle =
    ctx.course?.title || ctx.dossier.course_title || ctx.session?.title || "Formation";

  const mail = buildFormationDocMail({
    kind: "convocation",
    recipientName: "Hugues",
    courseTitle,
    includeCta: false,
    extraParagraphs: [
      "Ouvrez le PDF joint pour le détail (lieu, horaires, checklist, contacts).",
      "Le jour J, un code salle vous sera annoncé pour émarger depuis votre téléphone.",
    ],
  });

  const result = await sendEmail({
    to: TO,
    from: EDGE_COCKPIT_FROM,
    replyTo: "contact@byound.fr",
    subject: `[SAMPLE] Convocation — ${courseTitle} · ${ref}`,
    html: mail.html,
    attachments: [
      {
        filename: "convocation-hugues-thouin-printngo.pdf",
        content: buffer,
      },
    ],
    skipBcc: true,
    tags: { type: "formation-convocation-sample", participant: "hugues-thouin" },
  });

  if (!result.success) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(`✓ Convocation ${ref} envoyée à ${TO} (message ${result.messageId})`);
  console.log(`  Destinataire simulé : ${participantName} · ${ctx.organization.name}`);
  console.log(`  PDF en PJ uniquement (${buffer.length} octets) — pas de lien /doc`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
