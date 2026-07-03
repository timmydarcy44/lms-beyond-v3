import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierSignupConfirmationEmail(params: {
  firstName: string;
  confirmationLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const subjectName = firstName || "Votre";

  const html = buildEdgeEmailShell({
    title: `Bienvenue ${greeting}`,
    preheader: "Ouvrez votre cockpit EDGE — DISC, IDMC, soft skills",
    bodyHtml: `<p>Vous venez de faire le premier pas vers une vision claire de votre profil professionnel.</p>
      <p>Un clic, et votre cockpit s'ouvre — DISC, IDMC, soft skills, tout au même endroit.</p>`,
    cta: { label: "Ouvrir mon cockpit", href: params.confirmationLink },
    footerNote: "Inscription gratuite · sans engagement · lien valable 24 h",
  });

  const subject =
    subjectName === "Votre"
      ? "Votre cockpit vous attend"
      : `${params.firstName.trim()}, votre cockpit vous attend`;

  return { subject, html };
}
