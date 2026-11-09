import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";
import { appOrigin } from "@/lib/formation-documents/context";

export async function resolveTrainerEmail(
  service: SupabaseClient,
  dossierId: string,
): Promise<string | null> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("trainer_user_id")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier?.trainer_user_id) return null;
  const { data: profile } = await service
    .from("profiles")
    .select("email, reference_email")
    .eq("id", dossier.trainer_user_id)
    .maybeSingle();
  const email = String(profile?.reference_email || profile?.email || "")
    .trim()
    .toLowerCase();
  return email.includes("@") ? email : null;
}

/** Synthèse HTML des réponses positionnement pour le formateur. */
export async function buildPositionnementSynthHtml(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ htmlBody: string; courseTitle: string; completed: number; pending: number }> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("course_title")
    .eq("id", dossierId)
    .maybeSingle();
  const courseTitle = String(dossier?.course_title || "Formation");

  const { resolveTemplateForDossier } = await import(
    "@/lib/formation-assessments/resolve-template"
  );
  const template = await resolveTemplateForDossier(service, {
    dossierId,
    kind: "positionnement",
  });
  const questions = (template?.questions ?? []) as AssessmentQuestion[];

  const { data: participants } = await service
    .from("formation_participants")
    .select("id, profile_id")
    .eq("dossier_id", dossierId);

  const { data: attempts } = await service
    .from("formation_assessment_attempts")
    .select("participant_id, profile_id, status, score_pct, answers, completed_at")
    .eq("dossier_id", dossierId)
    .eq("kind", "positionnement");

  const profileIds = Array.from(
    new Set([
      ...(participants ?? []).map((p) => String(p.profile_id)),
      ...(attempts ?? []).map((a) => String(a.profile_id || "")).filter(Boolean),
    ]),
  );
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const nameById = new Map(
    (profiles ?? []).map((p) => {
      const name =
        String(p.full_name ?? "").trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        String(p.email ?? "Participant");
      return [String(p.id), name] as const;
    }),
  );

  const completedAttempts = (attempts ?? []).filter((a) => a.status === "completed");
  const completedIds = new Set(
    completedAttempts.map((a) => String(a.participant_id || a.profile_id || "")),
  );
  const total = (participants ?? []).length;
  const completed = completedAttempts.length;
  const pending = Math.max(0, total - completedIds.size);

  const lines: string[] = [];
  lines.push(
    edgeEmailParagraph(
      `Synthèse du positionnement pour « ${escapeEdgeEmailHtml(courseTitle)} » : ${completed} réponse(s) reçue(s)${total ? ` / ${total} participant(s)` : ""}${pending ? `, ${pending} en attente` : ""}.`,
    ),
  );

  if (!completedAttempts.length) {
    lines.push(edgeEmailParagraph("Aucune réponse complétée pour le moment."));
  } else {
    for (const a of completedAttempts) {
      const name =
        nameById.get(String(a.profile_id || "")) ||
        "Participant";
      const score =
        a.score_pct != null ? ` · score ${Number(a.score_pct).toFixed(0)} %` : "";
      const answers = (a.answers || {}) as Record<string, unknown>;
      const details = questions
        .map((q) => {
          if (q.type === "section") return null;
          const raw = answers[q.id];
          if (raw == null || raw === "") return null;
          const display = Array.isArray(raw) ? raw.map(String).join(", ") : String(raw);
          return `• ${escapeEdgeEmailHtml(q.prompt)} → <strong>${escapeEdgeEmailHtml(display)}</strong>`;
        })
        .filter(Boolean)
        .join("<br/>");
      lines.push(
        `<div style="margin:0 0 16px;padding:12px 14px;border:1px solid #E8E8E8;border-radius:12px;">
<p style="margin:0 0 8px;font-size:15px;color:#111;font-weight:600;">${escapeEdgeEmailHtml(name)}${escapeEdgeEmailHtml(score)}</p>
<p style="margin:0;font-size:14px;color:#4A4A4A;line-height:1.5;">${details || "Réponses enregistrées."}</p>
</div>`,
      );
    }
  }

  lines.push(
    edgeEmailParagraph(
      `Dossier : ${appOrigin()}/super/crm/programmation (ouvrez la fiche pour le détail).`,
    ),
  );

  return {
    htmlBody: lines.join(""),
    courseTitle,
    completed,
    pending,
  };
}

export async function sendPositionnementSynthToTrainer(
  service: SupabaseClient,
  params: { dossierId: string; toEmail: string },
): Promise<{ ok: boolean; error?: string }> {
  const synth = await buildPositionnementSynthHtml(service, params.dossierId);
  const html = buildEdgeEmailShell({
    title: "Synthèse positionnement",
    preheader: `${synth.completed} réponse(s) — ${synth.courseTitle}`,
    bodyHtml: `${edgeEmailParagraph("Bonjour,")}${synth.htmlBody}`,
  });
  const result = await sendEmail({
    to: params.toEmail,
    from: EDGE_COCKPIT_FROM,
    subject: `Synthèse positionnement — ${synth.courseTitle}`,
    html,
    tags: { type: "formation-positionnement-synth", dossier_id: params.dossierId },
  });
  return result.success
    ? { ok: true }
    : { ok: false, error: result.error || "email_failed" };
}
