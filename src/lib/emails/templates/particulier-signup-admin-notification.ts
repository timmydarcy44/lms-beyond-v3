import { buildEdgeEmailShell } from "@/lib/emails/edge-email-shell";

const ADMIN_EMAIL = "timmydarcy44@gmail.com";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getParticulierAdminSignupNotificationEmail(params: {
  firstName: string;
  lastName: string;
  email: string;
  objectif: string;
  registeredAt: string;
  adminProfileUrl?: string | null;
}) {
  const rows = [
    ["Prénom", params.firstName],
    ["Nom", params.lastName],
    ["Email", params.email],
    ["Objectif choisi", params.objectif || "—"],
    ["Date d'inscription", params.registeredAt],
  ];

  const tableHtml = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:14px;color:#666;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;font-size:14px;color:#050505;font-weight:500;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const profileLink = params.adminProfileUrl
    ? `<p style="margin:16px 0 0;font-size:14px;color:#050505;"><a href="${params.adminProfileUrl}" style="color:#050505;font-weight:600;">Voir le profil dans l'admin</a></p>`
    : "";

  const html = buildEdgeEmailShell({
    title: "Nouvelle inscription particulier EDGE",
    preheader: `${params.firstName} ${params.lastName} — ${params.objectif || "objectif non précisé"}`,
    bodyHtml: `<p>Une nouvelle inscription particulier vient d'être enregistrée sur EDGE.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;width:100%;">${tableHtml}</table>
      ${profileLink}`,
    footerNote: "Notification automatique — EDGE Particulier",
  });

  return {
    to: ADMIN_EMAIL,
    subject: "Nouvelle inscription particulier EDGE",
    html,
  };
}
