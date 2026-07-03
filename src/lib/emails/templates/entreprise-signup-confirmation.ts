import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getEntrepriseSignupConfirmationEmail(params: {
  firstName: string;
  companyName: string;
  confirmationLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const companyName = escapeHtml(params.companyName.trim());
  const greeting = firstName || "Bonjour";

  const html = buildEdgeEmailShell({
    title: `Bienvenue ${greeting}`,
    preheader: "Activez votre essai EDGE Entreprise — 30 jours gratuits",
    bodyHtml: `<p>Votre essai gratuit de 30 jours${companyName ? ` pour <strong>${companyName}</strong>` : ""} est prêt.</p>
      <p>Confirmez votre email pour accéder au dashboard RH, inviter vos collaborateurs et lancer vos diagnostics Beyond.</p>`,
    cta: { label: "Activer mon espace entreprise", href: params.confirmationLink },
    footerNote: "Essai 30 jours · sans carte bancaire · lien valable 24 h",
  });

  const subject = firstName
    ? `${params.firstName.trim()}, activez votre essai EDGE Entreprise`
    : "Activez votre essai EDGE Entreprise";

  return { subject, html };
}
