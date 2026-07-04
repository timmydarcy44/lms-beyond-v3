import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierProfilComportementalEmail(params: {
  firstName: string;
  profilHref: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  const html = buildEdgeEmailShell({
    title: "Votre Profil comportemental EDGE est disponible",
    preheader: "Consultez vos résultats et vos priorités de progression",
    bodyHtml: `<p>${greeting},</p>
      <p>Votre <strong>Profil comportemental EDGE</strong> est maintenant disponible.</p>
      <p>Vous pouvez consulter vos résultats, découvrir vos priorités de progression et accéder à vos recommandations personnalisées.</p>`,
    cta: { label: "Voir mon Profil EDGE", href: params.profilHref },
  });

  return {
    subject: "Votre Profil comportemental EDGE est disponible",
    html,
  };
}

/** @deprecated */
export function getParticulierDiagnosticCommercialEmail(params: {
  firstName: string;
  openingParagraph: string;
  walletHref: string;
}) {
  return getParticulierProfilComportementalEmail({
    firstName: params.firstName,
    profilHref: params.walletHref.replace(/\/badges\/?$/, "/profil-comportemental"),
  });
}
