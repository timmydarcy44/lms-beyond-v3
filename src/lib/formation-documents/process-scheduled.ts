import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { appOrigin } from "@/lib/formation-documents/context";
import { sendFormationDocument } from "@/lib/formation-documents/send";
import {
  assessmentUrl,
  ensureAssessmentAttempt,
} from "@/lib/formation-assessments/ensure";

type DueRow = {
  id: string;
  dossier_id: string;
  kind: string;
  to_email: string;
  document_id: string | null;
  slot_id: string | null;
  participant_id: string | null;
  profile_id: string | null;
  payload: Record<string, unknown> | null;
};

function relanceCopy(kind: string): { title: string; body: string; cta: string } {
  if (kind.startsWith("devis_")) {
    return {
      title: "Rappel — votre devis",
      body: "Nous n'avons pas encore reçu votre retour sur le devis de formation. Souhaitez-vous l'accepter ?",
      cta: "Voir le devis",
    };
  }
  if (kind.startsWith("convention_")) {
    return {
      title: "Rappel — votre convention",
      body: "La convention de formation attend toujours votre acceptation.",
      cta: "Voir la convention",
    };
  }
  if (kind === "absent_relance") {
    return {
      title: "Absence constatée",
      body: "Vous n'avez pas émargé pour une demi-journée de formation. Prévenez Byound si c'est une erreur, ou justifiez votre absence auprès de votre employeur.",
      cta: "Contacter Byound",
    };
  }
  if (kind === "eval_froid_j60") {
    return {
      title: "Votre avis à froid",
      body: "Deux mois après la formation, partagez vos retours en quelques écrans (une question à la fois).",
      cta: "Commencer l'évaluation",
    };
  }
  if (kind === "questionnaire_entreprise_j60") {
    return {
      title: "Questionnaire entreprise",
      body: "Deux mois après la session, votre retour entreprise nous aide à améliorer les parcours.",
      cta: "Répondre au questionnaire",
    };
  }
  return {
    title: "Byound Formation",
    body: "Un message concernant votre dossier formation.",
    cta: "Ouvrir",
  };
}

async function resolveViewUrl(service: SupabaseClient, row: DueRow): Promise<string> {
  if (row.document_id) {
    const { data: doc } = await service
      .from("formation_documents")
      .select("access_token, accept_token, kind, status")
      .eq("id", row.document_id)
      .maybeSingle();
    if (doc?.access_token) {
      if (doc.status === "signed") return "";
      const base = `${appOrigin()}/d/${doc.access_token}`;
      if ((doc.kind === "devis" || doc.kind === "convention") && doc.accept_token) {
        return `${base}?accept=${encodeURIComponent(String(doc.accept_token))}`;
      }
      return base;
    }
  }
  return `${appOrigin()}/`;
}

export async function processDueFormationMails(
  service: SupabaseClient,
  limit = 40,
): Promise<{ processed: number; sent: number; skipped: number; errors: string[] }> {
  const now = new Date().toISOString();
  const { data: due, error } = await service
    .from("formation_scheduled_mails")
    .select(
      "id, dossier_id, kind, to_email, document_id, slot_id, participant_id, profile_id, payload",
    )
    .is("sent_at", null)
    .is("cancelled_at", null)
    .lte("scheduled_at", now)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    return { processed: 0, sent: 0, skipped: 0, errors: [error.message] };
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const raw of due ?? []) {
    const row = raw as DueRow;

    if (row.document_id && (row.kind.includes("devis_") || row.kind.includes("convention_"))) {
      const { data: doc } = await service
        .from("formation_documents")
        .select("status")
        .eq("id", row.document_id)
        .maybeSingle();
      if (doc?.status === "signed") {
        await service
          .from("formation_scheduled_mails")
          .update({
            cancelled_at: now,
            cancel_reason: "already_signed",
            updated_at: now,
          })
          .eq("id", row.id);
        skipped += 1;
        continue;
      }
    }

    if (row.kind === "convocation_j7") {
      const result = await sendFormationDocument(service, {
        dossierId: row.dossier_id,
        kind: "convocation",
        to: row.to_email,
      });
      if (!result.ok) {
        errors.push(`${row.id}: ${result.error}`);
        continue;
      }
      await service
        .from("formation_scheduled_mails")
        .update({ sent_at: now, updated_at: now })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    if (row.kind === "positionnement_j3") {
      try {
        const attempt = await ensureAssessmentAttempt(service, {
          dossierId: row.dossier_id,
          kind: "positionnement",
          participantId: row.participant_id,
          profileId: row.profile_id,
        });
        if (attempt.status === "completed") {
          await service
            .from("formation_scheduled_mails")
            .update({
              cancelled_at: now,
              cancel_reason: "already_completed",
              updated_at: now,
            })
            .eq("id", row.id);
          skipped += 1;
          continue;
        }
        const name =
          row.payload && typeof row.payload.name === "string" ? row.payload.name : null;
        const course =
          row.payload && typeof row.payload.course_title === "string"
            ? row.payload.course_title
            : "votre formation";
        const result = await sendEmail({
          to: row.to_email,
          from: EDGE_COCKPIT_FROM,
          subject: "Test de positionnement — Byound",
          html: buildEdgeEmailShell({
            title: "Test de positionnement",
            preheader: "À faire 2–3 jours avant la session",
            bodyHtml: `${edgeEmailParagraph(
              name ? `Bonjour ${escapeEdgeEmailHtml(name)},` : "Bonjour,",
            )}${edgeEmailParagraph(
              `Votre formation « ${escapeEdgeEmailHtml(course)} » approche. Merci de répondre à ce court test de positionnement (une question par écran) — idéalement 2 à 3 jours avant la session.`,
            )}`,
            cta: { label: "Commencer le test", href: assessmentUrl(attempt.access_token) },
          }),
          tags: { type: "formation-positionnement", dossier_id: row.dossier_id },
        });
        if (!result.success) {
          errors.push(`${row.id}: ${result.error}`);
          continue;
        }
      } catch (e) {
        errors.push(`${row.id}: ${e instanceof Error ? e.message : "positionnement"}`);
        continue;
      }
      await service
        .from("formation_scheduled_mails")
        .update({ sent_at: now, updated_at: now })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    if (row.kind === "positionnement_synth_formateur") {
      const { sendPositionnementSynthToTrainer } = await import(
        "@/lib/formation-assessments/synth"
      );
      const result = await sendPositionnementSynthToTrainer(service, {
        dossierId: row.dossier_id,
        toEmail: row.to_email,
      });
      if (!result.ok) {
        errors.push(`${row.id}: ${result.error}`);
        continue;
      }
      await service
        .from("formation_scheduled_mails")
        .update({ sent_at: now, updated_at: now })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    if (row.kind === "pack_formateur_j1") {
      const { sendPackFormateurEmail } = await import(
        "@/lib/formation-documents/pack-formateur"
      );
      const result = await sendPackFormateurEmail(service, {
        dossierId: row.dossier_id,
        toEmail: row.to_email,
        slotId: row.slot_id,
        payload: row.payload,
      });
      if (!result.ok) {
        errors.push(`${row.id}: ${result.error}`);
        continue;
      }
      await service
        .from("formation_scheduled_mails")
        .update({ sent_at: now, updated_at: now })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    if (row.kind === "eval_froid_j60" || row.kind === "questionnaire_entreprise_j60") {
      const kind =
        row.kind === "eval_froid_j60" ? "eval_froid" : "questionnaire_entreprise";
      const attempt = await ensureAssessmentAttempt(service, {
        dossierId: row.dossier_id,
        kind,
        participantId: kind === "questionnaire_entreprise" ? null : row.participant_id,
        profileId: row.profile_id,
      });
      const copy = relanceCopy(row.kind);
      const name =
        row.payload && typeof row.payload.name === "string" ? row.payload.name : null;
      const html = buildEdgeEmailShell({
        title: copy.title,
        preheader: copy.body,
        bodyHtml: `${edgeEmailParagraph(
          name ? `Bonjour ${escapeEdgeEmailHtml(name)},` : "Bonjour,",
        )}${edgeEmailParagraph(copy.body)}`,
        cta: { label: copy.cta, href: assessmentUrl(attempt.access_token) },
      });
      const result = await sendEmail({
        to: row.to_email,
        from: EDGE_COCKPIT_FROM,
        subject: `${copy.title} — Byound`,
        html,
        tags: { type: `formation-${row.kind}`, dossier_id: row.dossier_id },
      });
      if (!result.success) {
        errors.push(`${row.id}: ${result.error}`);
        continue;
      }
      await service
        .from("formation_scheduled_mails")
        .update({ sent_at: now, updated_at: now })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    const copy = relanceCopy(row.kind);
    const viewUrl = await resolveViewUrl(service, row);
    if (!viewUrl && (row.kind.includes("devis_") || row.kind.includes("convention_"))) {
      await service
        .from("formation_scheduled_mails")
        .update({
          cancelled_at: now,
          cancel_reason: "already_signed",
          updated_at: now,
        })
        .eq("id", row.id);
      skipped += 1;
      continue;
    }

    const name =
      row.payload && typeof row.payload.name === "string" ? row.payload.name : null;
    const greeting = name
      ? `Bonjour ${escapeEdgeEmailHtml(name)},`
      : "Bonjour,";

    const html = buildEdgeEmailShell({
      title: copy.title,
      preheader: copy.body,
      bodyHtml: `${edgeEmailParagraph(greeting)}${edgeEmailParagraph(copy.body)}`,
      cta: { label: copy.cta, href: viewUrl || `${appOrigin()}/` },
      footerNote: "Byound — message automatique lié à votre dossier formation.",
    });

    const result = await sendEmail({
      to: row.to_email,
      from: EDGE_COCKPIT_FROM,
      subject: `${copy.title} — Byound`,
      html,
      tags: { type: `formation-${row.kind}`, dossier_id: row.dossier_id },
    });

    if (!result.success) {
      errors.push(`${row.id}: ${result.error || "email_failed"}`);
      continue;
    }

    await service
      .from("formation_scheduled_mails")
      .update({ sent_at: now, updated_at: now })
      .eq("id", row.id);
    sent += 1;
  }

  return { processed: (due ?? []).length, sent, skipped, errors };
}
