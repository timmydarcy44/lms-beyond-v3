import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  getParticulierNewProofReceivedEmail,
  getParticulierSkillAnalysisEmail,
  getParticulierSkillValidatedEmail,
  type SkillValidationEmailResult,
} from "@/lib/emails/templates/particulier-edge-emails";
import type { SkillValidationVerdict } from "@/lib/hard-skills/skill-validation";

const EMAIL_RESULT_MAP: Record<string, SkillValidationEmailResult> = {
  validated: "validated",
  pending: "pending",
  insufficient: "insufficient",
  expert_needed: "more_info",
};

export async function sendSkillValidationEmails(params: {
  firstName: string;
  email: string;
  skillName: string;
  verdict: SkillValidationVerdict;
  sendProofReceived?: boolean;
}) {
  const { firstName, email, skillName, verdict, sendProofReceived = false } = params;
  if (!email) return;

  if (sendProofReceived) {
    const received = getParticulierNewProofReceivedEmail({ firstName, skillName });
    await sendEmail({ to: email, subject: received.subject, html: received.html, from: EDGE_COCKPIT_FROM });
  }

  const result = EMAIL_RESULT_MAP[verdict] ?? "pending";
  const analysis = getParticulierSkillAnalysisEmail({ firstName, skillName, result });
  await sendEmail({ to: email, subject: analysis.subject, html: analysis.html, from: EDGE_COCKPIT_FROM });

  if (verdict === "validated") {
    const validated = getParticulierSkillValidatedEmail({ firstName, skillName });
    await sendEmail({ to: email, subject: validated.subject, html: validated.html, from: EDGE_COCKPIT_FROM });
  }
}
