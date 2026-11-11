/**
 * Vérifie qu'un lien /a/{token} ouvre bien le test de positionnement
 * pour une formation qui possède un gabarit course-level.
 *
 *   pnpm exec tsx scripts/verify-positionnement-link.ts
 *   pnpm exec tsx scripts/verify-positionnement-link.ts --send toi@example.com
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), override: true });

const DOSSIER = "5c2e8c3e-5b7e-4e41-b853-f094c4101736"; // Account management · Printngo
const SEND_TO = (() => {
  const i = process.argv.indexOf("--send");
  if (i >= 0) return (process.argv[i + 1] || "timmydarcy44@gmail.com").trim().toLowerCase();
  return null;
})();

function ensureChromePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH?.trim()) return;
  const fs = require("node:fs") as typeof import("node:fs");
  const candidates = [
    process.env.CHROME_PATH || "",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = c;
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
  const { ensureAssessmentAttempt, assessmentUrl } = await import(
    "../src/lib/formation-assessments/ensure"
  );
  const { resolveTemplateForDossier } = await import(
    "../src/lib/formation-assessments/resolve-template"
  );

  const { data: parts } = await service
    .from("formation_participants")
    .select("id, profile_id, job_title")
    .eq("dossier_id", DOSSIER)
    .limit(1);
  const part = parts?.[0];
  if (!part) throw new Error("Aucun participant sur le dossier Account management");

  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, first_name, last_name, email")
    .eq("id", part.profile_id)
    .maybeSingle();

  const tpl = await resolveTemplateForDossier(service, {
    dossierId: DOSSIER,
    kind: "positionnement",
  });
  if (!tpl || tpl.source !== "course" || !tpl.questions.length) {
    throw new Error(
      `Gabarit positionnement course attendu, got ${JSON.stringify({
        source: tpl?.source,
        q: tpl?.questions?.length,
        title: tpl?.title,
      })}`,
    );
  }

  const attempt = await ensureAssessmentAttempt(service, {
    dossierId: DOSSIER,
    kind: "positionnement",
    participantId: String(part.id),
    profileId: String(part.profile_id),
  });
  const posUrl = assessmentUrl(attempt.access_token);

  console.log("Formation :", tpl.title);
  console.log("Source    :", tpl.source, "·", tpl.questions.length, "questions");
  console.log("Participant:", profile?.full_name || profile?.email || part.id);
  console.log("Lien      :", posUrl);

  const origins = ["https://www.byound.fr", "http://localhost:3000"];
  let okOrigin: string | null = null;
  for (const origin of origins) {
    try {
      const res = await fetch(
        `${origin}/api/formation-assessments/${encodeURIComponent(attempt.access_token)}`,
      );
      const json = (await res.json()) as {
        kind?: string;
        title?: string;
        course_title?: string;
        questions?: unknown[];
        error?: string;
      };
      const qCount = Array.isArray(json.questions) ? json.questions.length : 0;
      console.log(`API ${origin} → ${res.status}`, {
        kind: json.kind,
        title: json.title,
        course: json.course_title,
        q: qCount,
        error: json.error,
      });
      if (res.ok && json.kind === "positionnement" && qCount > 0) {
        okOrigin = origin;
        break;
      }
    } catch (e) {
      console.log(`API ${origin} → fail`, e instanceof Error ? e.message : e);
    }
  }

  if (!okOrigin) {
    throw new Error("Aucune API n'a renvoyé le test de positionnement");
  }
  console.log(`✓ Lien valide sur ${okOrigin} — kind=positionnement, ${tpl.questions.length} Q`);

  if (!SEND_TO) {
    console.log("Astuce: ajoute --send email pour envoyer une convocation avec ce QR.");
    return;
  }

  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");

  const { loadDossierDocContext } = await import("../src/lib/formation-documents/context");
  const { fillConvocationPdf, buildConvocationHtml } = await import(
    "../src/lib/formation-documents/convocation-html"
  );
  const { buildFormationDocMail } = await import("../src/lib/formation-documents/mail");
  const { sendEmail } = await import("../src/lib/email/resend-client");
  const { EDGE_COCKPIT_FROM } = await import("../src/lib/email/edge-cockpit-from");

  const ctx = await loadDossierDocContext(service, DOSSIER);
  if (!ctx) throw new Error("Contexte dossier introuvable");

  const participantName =
    profile?.full_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Participant test";

  const buffer = await fillConvocationPdf(ctx, {
    participantName,
    participantJobTitle: part.job_title ? String(part.job_title) : null,
    positionnementUrl: posUrl,
  });
  if (!buffer?.length) throw new Error("PDF convocation échoué");

  const { ref } = buildConvocationHtml(ctx, { participantName });
  const courseTitle =
    ctx.course?.title || ctx.dossier.course_title || "Account management et fidélisation";

  const mail = buildFormationDocMail({
    kind: "convocation",
    recipientName: String(profile?.first_name || participantName.split(/\s+/)[0] || "toi"),
    courseTitle,
    includeCta: false,
    extraParagraphs: [
      "Sample avec VRAI lien positionnement (formation Account management).",
      `Lien test : ${posUrl}`,
      "Ouvre le PDF : QR + « Faire mon test » doivent ouvrir ce même test.",
    ],
  });

  const result = await sendEmail({
    to: SEND_TO,
    from: EDGE_COCKPIT_FROM,
    replyTo: "contact@byound.fr",
    subject: `[SAMPLE] Convocation + QR positionnement — ${courseTitle}`,
    html: mail.html,
    attachments: [
      {
        filename: "convocation-positionnement-account-mgmt.pdf",
        content: buffer,
      },
    ],
    skipBcc: true,
    tags: { type: "formation-convocation-positionnement-sample" },
  });

  if (!result.success) {
    console.error(result.error);
    process.exit(1);
  }
  console.log(`✓ Mail envoyé à ${SEND_TO} (message ${result.messageId})`);
  console.log(`  PDF ${buffer.length} o · ref ${ref}`);
  console.log(`  Ouvre aussi : ${posUrl}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
