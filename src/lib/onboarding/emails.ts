import { sendEmail } from "@/lib/email/resend-client";
import { getCollaboratorInviteEmail } from "@/lib/emails/templates/collaborator-mail";
import { appOrigin } from "@/lib/onboarding/slug";

const configuredNotify = process.env.ONBOARDING_NOTIFY_EMAIL?.trim() || "timmydarcy44@gmail.com";
const DARCY_NOTIFY = /@edgebs\.fr/i.test(configuredNotify) ? "timmydarcy44@gmail.com" : configuredNotify;

export async function sendOnboardingEmails(params: {
  companyName: string;
  drhEmail: string;
  drhName: string;
  estimatedUsers: number | null;
  dealId: string;
  organisationId: string;
  activationLink?: string;
}) {
  const origin = appOrigin();
  const activationLink =
    params.activationLink ?? `${origin}/onboarding/${params.organisationId}`;

  await sendEmail({
    from: "Timmy Darcy <noreply@byound.fr>",
    to: params.drhEmail,
    subject: `Bienvenue sur Beyond — Votre espace ${params.companyName} est prêt`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;line-height:1.5;color:#111">
        <h2>Bonjour ${params.drhName},</h2>
        <p>Votre organisation <strong>${params.companyName}</strong> vient d'être créée sur Beyond.</p>
        <p>Pour activer votre compte et configurer votre espace RH :</p>
        <p><a href="${activationLink}" style="display:inline-block;background:#6633CC;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Activer mon compte Beyond →</a></p>
        <ul>
          <li>Importer vos collaborateurs (fichier CSV)</li>
          <li>Créer vos équipes automatiquement</li>
          <li>Lancer les premiers diagnostics psychométriques</li>
        </ul>
        <p>À très bientôt,<br>Darcy — Fondateur Beyond</p>
      </div>
    `,
  });

  await sendEmail({
    from: "Beyond <noreply@byound.fr>",
    to: DARCY_NOTIFY,
    subject: `✅ Nouvelle organisation créée : ${params.companyName}`,
    html: `
      <p>Organisation : <strong>${params.companyName}</strong></p>
      <p>DRH invité : ${params.drhEmail}</p>
      <p>Salariés estimés : ${params.estimatedUsers ?? "—"}</p>
      <p><a href="${origin}/super/crm/pipeline-btob/${params.dealId}">Voir la fiche CRM →</a></p>
      <p><a href="${origin}/dashboard/entreprise?org=${params.organisationId}">Espace entreprise →</a></p>
    `,
  });
}

export async function sendCollaboratorInviteEmail(params: {
  email: string;
  firstName: string;
  companyName: string;
  inviteLink: string;
}) {
  const mail = getCollaboratorInviteEmail({
    firstName: params.firstName,
    companyName: params.companyName,
    inviteLink: params.inviteLink,
  });
  const sent = await sendEmail({
    to: params.email,
    subject: mail.subject,
    html: mail.html,
  });
  if (!sent.success) {
    console.error("[collaborator-invite] resend", params.email, sent.error);
  }
  return sent;
}
