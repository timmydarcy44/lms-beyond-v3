import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getExpertApprovedEmail(params: { firstName: string; dashboardLink: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const html = buildEdgeEmailShell({
    title: "Votre profil a été validé",
    preheader: "Accédez à votre espace formateur EDGE",
    bodyHtml: `<p>Bonjour ${greeting},</p>
     <p>Bonne nouvelle : votre profil a été validé par notre équipe.</p>
     <p>Vous pouvez désormais accéder à votre espace formateur et être référencé dans le réseau EDGE.</p>`,
    cta: { label: "Accéder à mon espace", href: params.dashboardLink },
  });
  return { subject: "Votre profil EDGE a été validé", html };
}

export function getExpertRejectedEmail(params: { firstName: string; reason: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const reason = escapeHtml(params.reason.trim());
  const greeting = firstName || "Bonjour";
  const html = buildEdgeEmailShell({
    title: "Votre candidature EDGE",
    bodyHtml: `<p>Bonjour ${greeting},</p>
     <p>Nous vous remercions pour votre candidature au réseau EDGE.</p>
     <p>Après examen de votre dossier, nous ne sommes pas en mesure de valider votre profil pour le moment.</p>
     ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ""}
     <p>Nous restons à votre disposition pour toute question.</p>`,
  });
  return { subject: "Votre candidature EDGE", html };
}

export function getExpertNeedsInfoEmail(params: { firstName: string; message: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const message = escapeHtml(params.message.trim());
  const greeting = firstName || "Bonjour";
  const html = buildEdgeEmailShell({
    title: "Informations complémentaires",
    bodyHtml: `<p>Bonjour ${greeting},</p>
     <p>Nous avons besoin d'informations complémentaires pour finaliser l'examen de votre dossier.</p>
     <p style="white-space:pre-wrap;">${message}</p>
     <p>Connectez-vous à votre espace formateur pour compléter votre profil.</p>`,
  });
  return { subject: "Complétez votre dossier EDGE", html };
}
