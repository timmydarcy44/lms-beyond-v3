import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierDiagnosticCommercialEmail(params: {
  firstName: string;
  openingParagraph: string;
  walletHref: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const opening = escapeHtml(params.openingParagraph.trim());

  const html = buildEdgeEmailShell({
    title: `${greeting}, votre diagnostic est complet`,
    preheader: "Retrouvez votre badge Diagnostic Commercial dans votre Wallet EDGE",
    bodyHtml: `<p>${opening}</p>
      <p>Vous venez d'obtenir votre badge <strong>Diagnostic Commercial</strong> — retrouvez-le dans votre Wallet EDGE.</p>`,
    cta: { label: "Voir mon Wallet", href: params.walletHref },
  });

  return {
    subject: "Votre Diagnostic Commercial EDGE",
    html,
  };
}
