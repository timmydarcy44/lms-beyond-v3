import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import {
  ASSESSMENT_LABELS,
  type AssessmentKind,
} from "@/lib/formation-assessments/types";
import { assessmentUrl, ensureAssessmentAttempt } from "@/lib/formation-assessments/ensure";
import { loadDossierDocContext } from "@/lib/formation-documents/context";

export async function sendAssessmentInvites(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: AssessmentKind;
    /** Si true, uniquement les participants sans tentative completed */
    onlyPending?: boolean;
  },
): Promise<{ sent: number; errors: string[] }> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  if (!ctx) return { sent: 0, errors: ["Dossier introuvable"] };

  const label = ASSESSMENT_LABELS[params.kind];
  const course = ctx.dossier.course_title || ctx.session?.title || "Formation";
  const errors: string[] = [];
  let sent = 0;

  if (params.kind === "questionnaire_entreprise") {
    const email = ctx.dossier.contact_email;
    if (!email) return { sent: 0, errors: ["Contact entreprise sans e-mail"] };
    const attempt = await ensureAssessmentAttempt(service, {
      dossierId: params.dossierId,
      kind: params.kind,
    });
    if (params.onlyPending && attempt.status === "completed") {
      return { sent: 0, errors: [] };
    }
    const url = assessmentUrl(attempt.access_token);
    const html = buildEdgeEmailShell({
      title: label,
      preheader: `Questionnaire entreprise — ${course}`,
      bodyHtml: `${edgeEmailParagraph(
        ctx.dossier.contact_name
          ? `Bonjour ${escapeEdgeEmailHtml(ctx.dossier.contact_name)},`
          : "Bonjour,",
      )}${edgeEmailParagraph(
        `Deux mois après la formation « ${escapeEdgeEmailHtml(course)} », votre retour entreprise nous aide à améliorer les parcours.`,
      )}`,
      cta: { label: "Répondre au questionnaire", href: url },
    });
    const result = await sendEmail({
      to: email,
      from: EDGE_COCKPIT_FROM,
      subject: `${label} — Byound`,
      html,
      tags: { type: `formation-${params.kind}`, dossier_id: params.dossierId },
    });
    if (!result.success) errors.push(result.error || email);
    else sent += 1;
    return { sent, errors };
  }

  for (const p of ctx.participants.filter((x) => x.email)) {
    const attempt = await ensureAssessmentAttempt(service, {
      dossierId: params.dossierId,
      kind: params.kind,
      participantId: p.id,
      profileId: p.profile_id,
    });
    if (params.onlyPending && attempt.status === "completed") continue;

    const url = assessmentUrl(attempt.access_token);
    const body =
      params.kind === "positionnement"
        ? `Avant ou au début de « ${escapeEdgeEmailHtml(course)} », merci de répondre à quelques questions (1 écran = 1 question).`
        : params.kind === "eval_chaud"
          ? `La formation « ${escapeEdgeEmailHtml(course)} » vient de se terminer. Votre avis à chaud nous est précieux.`
          : `Deux mois après « ${escapeEdgeEmailHtml(course)} », partagez l'impact sur votre pratique.`;

    const html = buildEdgeEmailShell({
      title: label,
      preheader: body,
      bodyHtml: `${edgeEmailParagraph(`Bonjour ${escapeEdgeEmailHtml(p.name)},`)}${edgeEmailParagraph(body)}`,
      cta: { label: "Commencer", href: url },
    });
    const result = await sendEmail({
      to: p.email!,
      from: EDGE_COCKPIT_FROM,
      subject: `${label} — Byound`,
      html,
      tags: { type: `formation-${params.kind}`, dossier_id: params.dossierId },
    });
    if (!result.success) errors.push(`${p.email}: ${result.error}`);
    else sent += 1;
  }

  return { sent, errors };
}
