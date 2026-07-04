import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

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
    bodyHtml: `<p>${greeting},</p>
      <p>Votre <strong>Profil comportemental EDGE</strong> est disponible.</p>
      <p>Pour débloquer une analyse plus complète et des recommandations plus précises, il vous reste deux explorations à compléter :</p>
      <ul style="margin:16px 0;padding-left:20px;">
        <li>Soft skills</li>
        <li>Fonctionnement / motivation</li>
      </ul>`,
    cta: { label: "Compléter mon Profil EDGE", href: params.profilHref },
  });

  return {
    subject: "Votre Profil EDGE n'est pas encore complet",
    html,
  };
}
