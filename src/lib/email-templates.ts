type AppleEmailParams = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
};

const LOGO_URL =
  "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/nevo./Nevo_logo.png";

export function buildAppleEmail({ title, body, ctaLabel, ctaUrl }: AppleEmailParams) {
  return `
  <div style="background:#ffffff; padding:32px 16px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color:#000000;">
    <div style="max-width:600px; margin:0 auto; text-align:center;">
      <img src="${LOGO_URL}" alt="nevo." width="120" style="display:block; margin:0 auto 24px; height:auto;" />
      <h1 style="font-size:22px; font-weight:500; margin:0 0 16px;">${title}</h1>
      <p style="font-size:16px; line-height:1.6; margin:0 0 24px;">${body}</p>
      <a href="${ctaUrl}" style="display:inline-block; padding:12px 20px; background:#000000; color:#ffffff; text-decoration:none; border-radius:8px; font-size:15px;">
        ${ctaLabel}
      </a>
    </div>
  </div>
  `;
}

export function getAccessEmailTemplate() {
  return {
    subject: "Votre accès Premium est actif",
    html: buildAppleEmail({
      title: "Votre compte est prêt.",
      body: "Votre abonnement Premium est actif.",
      ctaLabel: "Créer votre mot de passe",
      ctaUrl: "https://nevo-app.fr/app-landing/login",
    }),
  };
}

export function getWelcomeEmailTemplate() {
  return {
    subject: "Bienvenue dans l'aventure",
    html: buildAppleEmail({
      title: "Bienvenue dans l'aventure.",
      body: "Votre accès est désormais illimité.",
      ctaLabel: "Ouvrir l'application",
      ctaUrl: "https://nevo-app.fr/app-landing/particuliers",
    }),
  };
}

export function getStrategicEmailTemplate() {
  return {
    subject: "Commencez à voir ce qui compte.",
    html: buildAppleEmail({
      title: "Le pouvoir de la clarté.",
      body: "Prenez un instant pour explorer votre nouvelle perspective.",
      ctaLabel: "Dashboard",
      ctaUrl: "https://nevo-app.fr/app-landing/particuliers",
    }),
  };
}

export function getEngagementEmailTemplate() {
  return {
    subject: "Allez plus loin.",
    html: buildAppleEmail({
      title: "L'intuition, guidée par les données.",
      body: "Vos premiers résultats dessinent des tendances.",
      ctaLabel: "Voir mes analyses",
      ctaUrl: "https://nevo-app.fr/app-landing/particuliers",
    }),
  };
}

export function getResetPasswordEmailTemplate(resetUrl: string) {
  return {
    subject: "Demande de nouveau mot de passe",
    html: buildAppleEmail({
      title: "Demande de nouveau mot de passe.",
      body: "Votre lien expire dans 60 minutes.",
      ctaLabel: "Réinitialiser mon mot de passe",
      ctaUrl: resetUrl,
    }),
  };
}
