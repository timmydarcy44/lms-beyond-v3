import { buildEdgeEmailShell, edgeEmailParagraph } from "@/lib/emails/edge-email-shell";

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
    bodyHtml: [
      edgeEmailParagraph(greeting + ","),
      edgeEmailParagraph("Votre Profil comportemental EDGE est maintenant disponible."),
      edgeEmailParagraph(
        "Consultez vos résultats, découvrez vos priorités de progression et accédez à vos recommandations personnalisées.",
      ),
    ].join(""),
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
