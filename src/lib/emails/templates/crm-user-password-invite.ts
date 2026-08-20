import { buildEdgeEmailShell, escapeEdgeEmailHtml } from "@/lib/emails/edge-email-shell";

export function getCrmUserPasswordInviteEmail(params: {
  firstName: string;
  passwordSetupLink: string;
}) {
  const firstName = escapeEdgeEmailHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";

  const html = buildEdgeEmailShell({
    title: "Bienvenue sur EDGE",
    preheader: "Créez votre mot de passe pour activer votre compte",
    bodyHtml: `<p>Bonjour ${greeting},</p>
      <p>Un compte EDGE a été créé pour vous.</p>
      <p>Pour y accéder, créez votre mot de passe via le bouton ci-dessous. Ce lien est personnel et valable 24&nbsp;h.</p>`,
    cta: { label: "Créer mon mot de passe", href: params.passwordSetupLink },
    footerNote: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  });

  return {
    subject: "EDGE — Créez votre mot de passe",
    html,
  };
}
