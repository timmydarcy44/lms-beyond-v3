import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getExpertRegistrationConfirmationEmail(params: {
  firstName: string;
  passwordSetupLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";

  const html = buildEdgeEmailShell({
    title: "Bienvenue dans le réseau EDGE",
    preheader: "Créez votre mot de passe pour accéder à votre espace formateur",
    bodyHtml: `<p>Bonjour ${greeting},</p>
      <p>Votre profil a bien été enregistré.</p>
      <p>Pour accéder à votre espace formateur restreint, veuillez créer votre mot de passe.</p>
      <p>Votre profil est actuellement en cours de validation par notre équipe. Tant qu'il n'est pas validé, vous pourrez uniquement consulter l'état de votre candidature et compléter certaines informations.</p>
      <p>Nous reviendrons vers vous très prochainement.</p>`,
    cta: { label: "Créer mon mot de passe", href: params.passwordSetupLink },
  });

  return {
    subject: "Bienvenue dans le réseau EDGE",
    html,
  };
}
