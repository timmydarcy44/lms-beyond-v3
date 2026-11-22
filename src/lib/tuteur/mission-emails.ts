import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { sendEmail } from "@/lib/email/resend-client";
import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";
import { publicAppUrl } from "@/lib/env";
import type { SupabaseClient } from "@supabase/supabase-js";

async function profileEmail(
  db: SupabaseClient,
  userId: string,
): Promise<{ email: string; name: string } | null> {
  const { data } = await db
    .from("profiles")
    .select("email, full_name, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();
  if (!data) return null;
  const email = String((data as { email?: string | null }).email ?? "").trim();
  if (!email) return null;
  const full = String((data as { full_name?: string | null }).full_name ?? "").trim();
  const parts = [
    (data as { first_name?: string | null }).first_name,
    (data as { last_name?: string | null }).last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return { email, name: full || parts || email };
}

function appBase() {
  return publicAppUrl().replace(/\/$/, "");
}

function paragraph(text: string) {
  return `<p style="margin:0 0 12px;line-height:1.5">${escapeEdgeEmailHtml(text)}</p>`;
}

function cta(href: string, label: string) {
  return `<p style="margin:20px 0 0"><a href="${escapeEdgeEmailHtml(href)}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600">${escapeEdgeEmailHtml(label)}</a></p>`;
}

export async function notifyLearnerMissionAssigned(params: {
  db: SupabaseClient;
  learnerId: string;
  tutorName: string;
  missions: Array<{ title: string; dueDate?: string | null }>;
}) {
  const learner = await profileEmail(params.db, params.learnerId);
  if (!learner) return { sent: false as const, reason: "no_learner_email" };
  const list = params.missions
    .map((m) => {
      const due = m.dueDate
        ? ` (échéance ${new Date(m.dueDate).toLocaleDateString("fr-FR")})`
        : "";
      return `• ${m.title}${due}`;
    })
    .join("\n");
  const subject =
    params.missions.length > 1
      ? `${params.missions.length} nouvelles missions de ton tuteur`
      : `Nouvelle mission : ${params.missions[0]?.title ?? "Mission"}`;
  const html = buildEdgeEmailShell({
    title: "Nouvelle mission",
    preheader: subject,
    bodyHtml: [
      paragraph(`Bonjour ${learner.name},`),
      paragraph(
        `${params.tutorName} t’a confié ${params.missions.length > 1 ? "des missions" : "une mission"} en entreprise.`,
      ),
      `<pre style="margin:0 0 12px;white-space:pre-wrap;font-family:inherit;line-height:1.5">${escapeEdgeEmailHtml(list)}</pre>`,
      paragraph("Connecte-toi pour lire le détail et déposer ta preuve."),
      cta(`${appBase()}/dashboard/apprenant/mon-entreprise`, "Voir mes missions"),
    ].join(""),
    footerNote: "Byound School · Alternance",
  });
  const result = await sendEmail({
    to: learner.email,
    subject,
    html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    tags: { kind: "tutor_mission_assigned" },
  });
  return { sent: result.success, reason: result.error };
}

export async function notifyTutorMissionSubmitted(params: {
  db: SupabaseClient;
  tutorId: string;
  learnerName: string;
  missionTitle: string;
  learnerNote?: string | null;
  proofUrl?: string | null;
}) {
  const tutor = await profileEmail(params.db, params.tutorId);
  if (!tutor) return { sent: false as const, reason: "no_tutor_email" };
  const subject = `${params.learnerName} a déposé une preuve · ${params.missionTitle}`;
  const parts = [
    paragraph(`Bonjour ${tutor.name},`),
    paragraph(
      `${params.learnerName} a envoyé une preuve pour la mission « ${params.missionTitle} ».`,
    ),
  ];
  if (params.learnerNote) {
    parts.push(
      paragraph("Commentaire de l’alternant :"),
      `<pre style="margin:0 0 12px;white-space:pre-wrap;font-family:inherit;line-height:1.5">${escapeEdgeEmailHtml(params.learnerNote)}</pre>`,
    );
  }
  if (params.proofUrl) {
    parts.push(
      paragraph(`Preuve jointe : ${params.proofUrl}`),
    );
  }
  parts.push(
    paragraph("Tu peux valider ou demander une correction depuis ton espace tuteur."),
    cta(`${appBase()}/dashboard/tuteur/missions?statut=a_valider`, "Ouvrir les missions à valider"),
  );
  const html = buildEdgeEmailShell({
    title: "Preuve déposée",
    preheader: subject,
    bodyHtml: parts.join(""),
    footerNote: "Byound School · Espace tuteur",
  });
  const result = await sendEmail({
    to: tutor.email,
    subject,
    html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    tags: { kind: "tutor_mission_submitted" },
  });
  return { sent: result.success, reason: result.error };
}

export async function notifyLearnerCorrectionRequested(params: {
  db: SupabaseClient;
  learnerId: string;
  tutorName: string;
  missionTitle: string;
  message: string;
}) {
  const learner = await profileEmail(params.db, params.learnerId);
  if (!learner) return { sent: false as const, reason: "no_learner_email" };
  const subject = `Correction demandée · ${params.missionTitle}`;
  const html = buildEdgeEmailShell({
    title: "Correction demandée",
    preheader: subject,
    bodyHtml: [
      paragraph(`Bonjour ${learner.name},`),
      paragraph(
        `${params.tutorName} te demande une correction sur la mission « ${params.missionTitle} ».`,
      ),
      paragraph("Message du tuteur :"),
      `<pre style="margin:0 0 12px;white-space:pre-wrap;font-family:inherit;line-height:1.5">${escapeEdgeEmailHtml(params.message)}</pre>`,
      paragraph("Reprends le travail puis renvoie une preuve mise à jour."),
      cta(`${appBase()}/dashboard/apprenant/mon-entreprise`, "Corriger ma mission"),
    ].join(""),
    footerNote: "Byound School · Alternance",
  });
  const result = await sendEmail({
    to: learner.email,
    subject,
    html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    tags: { kind: "tutor_mission_correction" },
  });
  return { sent: result.success, reason: result.error };
}

export async function notifyLearnerMissionValidated(params: {
  db: SupabaseClient;
  learnerId: string;
  tutorName: string;
  missionTitle: string;
  message?: string | null;
}) {
  const learner = await profileEmail(params.db, params.learnerId);
  if (!learner) return { sent: false as const, reason: "no_learner_email" };
  const subject = `Mission validée · ${params.missionTitle}`;
  const html = buildEdgeEmailShell({
    title: "Mission validée",
    preheader: subject,
    bodyHtml: [
      paragraph(`Bonjour ${learner.name},`),
      paragraph(
        `${params.tutorName} a validé ta mission « ${params.missionTitle} ».`,
      ),
      params.message
        ? `<pre style="margin:0 0 12px;white-space:pre-wrap;font-family:inherit;line-height:1.5">${escapeEdgeEmailHtml(params.message)}</pre>`
        : "",
      cta(`${appBase()}/dashboard/apprenant/mon-entreprise`, "Voir mon entreprise"),
    ].join(""),
    footerNote: "Byound School · Alternance",
  });
  const result = await sendEmail({
    to: learner.email,
    subject,
    html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    tags: { kind: "tutor_mission_validated" },
  });
  return { sent: result.success, reason: result.error };
}
