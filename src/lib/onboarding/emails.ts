import { sendEmail } from "@/lib/email/resend-client";
import { appOrigin } from "@/lib/onboarding/slug";

const DARCY_NOTIFY = process.env.ONBOARDING_NOTIFY_EMAIL?.trim() || "darcy@edgebs.fr";

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
    from: "Timmy Darcy <darcy@edgebs.fr>",
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
    from: "Beyond <noreply@edgebs.fr>",
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
  await sendEmail({
    from: "Beyond <noreply@edgebs.fr>",
    to: params.email,
    subject: `${params.companyName} vous invite sur Beyond`,
    html: `
      <p>Bonjour ${params.firstName},</p>
      <p><strong>${params.companyName}</strong> utilise Beyond pour accompagner le développement de ses équipes.</p>
      <p>En 10 minutes, découvrez votre profil cognitif et accédez à vos formations personnalisées :</p>
      <p><a href="${params.inviteLink}">Rejoindre Beyond →</a></p>
    `,
  });
}
