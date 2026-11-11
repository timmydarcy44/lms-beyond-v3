/**
 * Envoie à une adresse de test tous les e-mails du parcours
 * devis → signature → positionnement → convocation → Backstage / rappel.
 *
 * Usage:
 *   pnpm exec tsx scripts/send-formation-workflow-samples.ts
 *   pnpm exec tsx scripts/send-formation-workflow-samples.ts toi@example.com
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { render } from "@react-email/render";
import { createClient } from "@supabase/supabase-js";

const envPath = path.join(process.cwd(), ".env.local");
dotenv.config({ path: envPath, override: true });

const TO =
  (process.argv[2] || process.env.BACKSTAGE_TEST_TO || "timmydarcy44@gmail.com")
    .trim()
    .toLowerCase();

async function main() {
  if (!TO.includes("@")) throw new Error("Adresse de test invalide");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");

  const { sendEmail } = await import("../src/lib/email/resend-client");
  const { EDGE_COCKPIT_FROM } = await import("../src/lib/email/edge-cockpit-from");
  const { buildFormationDocMail } = await import("../src/lib/formation-documents/mail");
  const {
    buildEdgeEmailShell,
    edgeEmailParagraph,
    escapeEdgeEmailHtml,
  } = await import("../src/lib/emails/edge-email-shell");
  const { BackstageEmail } = await import("../emails/backstage/BackstageEmail");
  const { BackstageReminderEmail } = await import(
    "../emails/backstage/BackstageReminderEmail"
  );
  const { BACKSTAGE_CHECKLIST } = await import(
    "../src/lib/formation-documents/backstage"
  );
  const { qrImageUrl } = await import(
    "../src/lib/formation-documents/backstage-signed-url"
  );

  const viewUrl = "https://www.byound.fr/doc?token=sample-preview";
  const course = "Analyse comportementale appliquée au management";
  const org = "Printngo";
  const contact = "Timmy Darcy";

  const results: Array<{ label: string; ok: boolean; id?: string; error?: string }> = [];

  async function send(label: string, subject: string, html: string, replyTo?: string) {
    const r = await sendEmail({
      to: TO,
      from: EDGE_COCKPIT_FROM,
      replyTo: replyTo || "contact@byound.fr",
      subject: `[SAMPLE] ${subject}`,
      html,
      skipBcc: true,
      tags: { type: "formation-workflow-sample", label },
    });
    results.push({
      label,
      ok: r.success,
      id: r.messageId,
      error: r.error,
    });
    console.log(r.success ? `✓ ${label}` : `✗ ${label}: ${r.error}`);
  }

  // 1. Devis
  {
    const mail = buildFormationDocMail({
      kind: "devis",
      recipientName: contact,
      courseTitle: course,
      organizationName: org,
      viewUrl,
      amountHtCents: 120000,
      amountTvaCents: 24000,
      amountTtcCents: 144000,
      quoteNumber: "DEV-2026-0042",
      issuedAt: new Date().toISOString(),
    });
    await send("01-devis", mail.subject, mail.html);
  }

  // 2. Relance devis J+3
  {
    const html = buildEdgeEmailShell({
      title: "Rappel — votre devis",
      preheader: "Nous n'avons pas encore reçu votre retour sur le devis.",
      bodyHtml: `${edgeEmailParagraph(`Bonjour ${escapeEdgeEmailHtml(contact)},`)}${edgeEmailParagraph(
        "Nous n'avons pas encore reçu votre retour sur le devis de formation. Consultez-le, puis acceptez et signez-le en ligne.",
      )}${edgeEmailParagraph(`Formation : ${course}`)}`,
      cta: { label: "Accepter et signer le devis", href: viewUrl },
      footerNote: "Byound — rappel devis J+3",
    });
    await send("02-devis-relance-j3", "Rappel — votre devis — Byound", html);
  }

  // 3. OTP signature devis
  {
    const html = buildEdgeEmailShell({
      title: "Code de signature — devis",
      preheader: "Votre code : 482917",
      bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">Bonjour ${escapeEdgeEmailHtml(contact)},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Voici le code pour signer le devis « ${escapeEdgeEmailHtml(course)} » :
      </p>
      <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#111;">482917</p>
      <p style="margin:16px 0 0;font-size:13px;color:#8A8A8A;">Valable 10 minutes. Ne le partagez pas.</p>`,
      footerNote: "Byound · signature document formation",
    });
    await send("03-otp-devis", "Code Byound 482917 — signature devis", html);
  }

  // 4. Notif staff devis accepté
  {
    const html = buildEdgeEmailShell({
      title: "Devis accepté(e)",
      preheader: `${org} — ${course}`,
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;">Un client a accepté le devis en ligne.</p>
        <p style="margin:0;font-size:14px;color:#4A4A4A;"><strong>Entreprise</strong> ${escapeEdgeEmailHtml(org)}<br/>
        <strong>Formation</strong> ${escapeEdgeEmailHtml(course)}<br/>
        <strong>Montant</strong> 1 200,00 € HT<br/>
        <strong>Contact</strong> ${escapeEdgeEmailHtml(contact)}</p>`,
      footerNote: "Notification automatique — acceptation publique /doc",
    });
    await send("04-notif-devis-accepte", "Devis accepté — Printngo", html);
  }

  // 5. Convention
  {
    const mail = buildFormationDocMail({
      kind: "convention",
      recipientName: contact,
      courseTitle: course,
      organizationName: org,
      viewUrl,
      issuedAt: new Date().toISOString(),
    });
    await send("05-convention", mail.subject, mail.html);
  }

  // 6. OTP convention
  {
    const html = buildEdgeEmailShell({
      title: "Code de signature — convention",
      preheader: "Votre code : 719304",
      bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">Bonjour ${escapeEdgeEmailHtml(contact)},</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4A4A4A;">
        Voici le code pour signer la convention « ${escapeEdgeEmailHtml(course)} » :
      </p>
      <p style="margin:0;font-size:32px;font-weight:800;letter-spacing:8px;color:#111;">719304</p>
      <p style="margin:16px 0 0;font-size:13px;color:#8A8A8A;">Valable 10 minutes.</p>`,
      footerNote: "Byound · signature document formation",
    });
    await send("06-otp-convention", "Code Byound 719304 — signature convention", html);
  }

  // 7. Notif staff convention
  {
    const html = buildEdgeEmailShell({
      title: "Convention acceptée",
      preheader: `${org} — ${course}`,
      bodyHtml: `<p style="margin:0 0 16px;font-size:15px;color:#4A4A4A;">Un client a accepté la convention en ligne.</p>
        <p style="margin:0;font-size:14px;color:#4A4A4A;"><strong>Entreprise</strong> ${escapeEdgeEmailHtml(org)}<br/>
        <strong>Formation</strong> ${escapeEdgeEmailHtml(course)}</p>`,
      footerNote: "Notification automatique — acceptation publique /doc",
    });
    await send("07-notif-convention-acceptee", "Convention acceptée — Printngo", html);
  }

  // 8. Positionnement apprenant
  {
    const html = buildEdgeEmailShell({
      title: "Test de positionnement",
      preheader: "À faire 2–3 jours avant la session",
      bodyHtml: `${edgeEmailParagraph(`Bonjour ${escapeEdgeEmailHtml(contact)},`)}${edgeEmailParagraph(
        `Votre formation « ${escapeEdgeEmailHtml(course)} » approche. Merci de répondre à ce court test de positionnement (une question par écran) — idéalement 2 à 3 jours avant la session.`,
      )}`,
      cta: {
        label: "Commencer le test",
        href: "https://www.byound.fr/formation-assessment?token=sample",
      },
      footerNote: "Byound — positionnement J-3",
    });
    await send("08-positionnement", "Test de positionnement — Byound", html);
  }

  // 9. Synthèse positionnement formateur
  {
    const html = buildEdgeEmailShell({
      title: "Synthèse positionnement",
      preheader: `2 réponse(s) — ${course}`,
      bodyHtml: `${edgeEmailParagraph("Bonjour Hugo,")}${edgeEmailParagraph(
        `Voici la synthèse du positionnement pour « ${escapeEdgeEmailHtml(course)} » (2/2 répondus).`,
      )}
      <div style="margin:0 0 16px;padding:12px 14px;border:1px solid #E8E8E8;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:15px;color:#111;font-weight:600;">Participant A · 72%</p>
        <p style="margin:0;font-size:14px;color:#4A4A4A;">Niveau confortable sur le management situationnel.</p>
      </div>
      <div style="margin:0 0 16px;padding:12px 14px;border:1px solid #E8E8E8;border-radius:12px;">
        <p style="margin:0 0 8px;font-size:15px;color:#111;font-weight:600;">Participant B · 45%</p>
        <p style="margin:0;font-size:14px;color:#4A4A4A;">Besoin de rappeler les bases comportementales.</p>
      </div>`,
      footerNote: "Byound — synthèse formateur",
    });
    await send(
      "09-synthese-positionnement",
      `Synthèse positionnement — ${course}`,
      html,
    );
  }

  // 10. Convocation
  {
    const mail = buildFormationDocMail({
      kind: "convocation",
      recipientName: contact,
      courseTitle: course,
      viewUrl,
    });
    await send("10-convocation", mail.subject, mail.html);
  }

  // 11. Livret d'accueil
  {
    const mail = buildFormationDocMail({
      kind: "livret",
      recipientName: contact,
      courseTitle: course,
      viewUrl,
    });
    await send("11-livret", mail.subject, mail.html);
  }

  // 12. Backstage J-2
  {
    const emargerUrl = "https://www.byound.fr/e?slot=sample";
    const html = await render(
      BackstageEmail({
        preheader: `Byound Backstage · votre session de lundi chez ${org} : émargement, checklist et documents.`,
        trainerFirstName: "Hugo",
        dateLabel: "Lundi 9 novembre",
        dayPartPill: "Matin",
        courseTitle: course,
        locationKindLabel: "Lieu · chez le client",
        locationDetail: "51 Rue des Saules, 14760 Carpiquet",
        clientName: org,
        participantCount: 2,
        emargerUrl,
        qrImageUrl: qrImageUrl(emargerUrl, 220),
        checklist: BACKSTAGE_CHECKLIST.map((c) => ({ moment: c.moment, text: c.text })),
        docs: [
          {
            key: "programme",
            title: "Programme",
            subtitle: "Objectifs et déroulé",
            href: viewUrl,
            iconBg: "#6E5BFF",
            iconLabel: "P",
          },
          {
            key: "participants",
            title: "Participants",
            subtitle: "2 inscrits · fonctions",
            href: "https://www.byound.fr/backstage",
            iconBg: "#3B82F6",
            iconLabel: "2",
          },
          {
            key: "infos",
            title: "Infos pratiques",
            subtitle: "Accès, contact sur place",
            href: viewUrl,
            iconBg: "#F59E0B",
            iconLabel: "i",
          },
        ],
        formateurUrl: "https://www.byound.fr/dashboard/formateur",
        contactName: "Timmy Darcy",
        contactPhone: "07 89 87 65 67",
        contactInitials: "TD",
      }),
    );
    await send(
      "12-backstage",
      `Backstage · Lundi 9 novembre, ${org} — ${course}`,
      html,
      "contact@byound.fr",
    );
  }

  // 13. Rappel jour J
  {
    const html = await render(
      BackstageReminderEmail({
        preheader: "Backstage · c'est aujourd'hui, ouvrez l'émargement",
        dateLine: "Lundi 9 novembre · 09:00 · 51 Rue des Saules, 14760 Carpiquet",
        emargerUrl: "https://www.byound.fr/e?slot=sample",
        contactName: "Timmy Darcy",
        contactPhone: "07 89 87 65 67",
      }),
    );
    await send(
      "13-backstage-rappel",
      "Backstage · c'est aujourd'hui, ouvrez l'émargement",
      html,
      "contact@byound.fr",
    );
  }

  const ok = results.filter((r) => r.ok).length;
  const fail = results.filter((r) => !r.ok);
  console.log(`\nEnvoyé ${ok}/${results.length} → ${TO}`);
  if (fail.length) {
    console.error("Échecs:", fail);
    process.exit(1);
  }

  // Optionnel : aussi tenter un vrai Backstage sur Printngo si la table existe
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const sb = createClient(url, key);
      const { sendBackstageEmail } = await import(
        "../src/lib/formation-documents/backstage"
      );
      const dossierId = "5bee16a8-dbd1-4851-951d-642d6b4101cd";
      const slotId = "9783d913-ec8f-4f36-b4eb-be2ef60a2ca5";
      const live = await sendBackstageEmail(sb, {
        dossierId,
        toEmail: TO,
        slotId,
        mailType: "backstage",
        force: true,
      });
      console.log(
        live.ok
          ? `✓ 14-backstage-live-printngo (${live.messageId || "ok"})`
          : `✗ 14-backstage-live-printngo: ${live.error}`,
      );
    }
  } catch (e) {
    console.warn("Backstage live Printngo sauté:", e instanceof Error ? e.message : e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
