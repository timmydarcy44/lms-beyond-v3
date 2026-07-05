import { buildEdgeEmailShell, edgeEmailParagraph } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierProfileRelanceEmail(params: {
  firstName: string;
  profilHref: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName ? `Bonjour ${firstName}` : "Bonjour";

  const html = buildEdgeEmailShell({
    title: "Votre Profil EDGE n'est pas encore complet",
    preheader: "Complétez Soft skills et Fonctionnement pour une analyse plus précise",
    bodyHtml: [
      edgeEmailParagraph(greeting + ","),
      edgeEmailParagraph("Votre Profil comportemental EDGE est disponible."),
      edgeEmailParagraph(
        "Pour débloquer une analyse plus complète, complétez encore Soft skills et Fonctionnement / motivation.",
      ),
    ].join(""),
    cta: { label: "Compléter mon Profil EDGE", href: params.profilHref },
  });

  return {
    subject: "Votre Profil EDGE n'est pas encore complet",
    html,
  };
}
