function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function edgeEmailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;padding:32px 16px 48px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:24px;">
        <tr><td style="padding:36px 28px 32px;">
          <p style="margin:0 0 24px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#635BFF;">Réseau EDGE</p>
          ${bodyHtml}
          <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.45);">L'équipe EDGE</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function getExpertApprovedEmail(params: { firstName: string; dashboardLink: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const html = edgeEmailShell(
    "Profil validé",
    `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;">Bonjour ${greeting},</h1>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
       Bonne nouvelle : votre profil a été validé par notre équipe.
     </p>
     <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
       Vous pouvez désormais accéder à votre espace formateur et être référencé dans le réseau EDGE.
     </p>
     <a href="${params.dashboardLink}" style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:600;color:#fff;text-decoration:none;border-radius:14px;background:#635BFF;">
       Accéder à mon espace
     </a>`,
  );
  return { subject: "Votre profil EDGE a été validé", html };
}

export function getExpertRejectedEmail(params: { firstName: string; reason: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const reason = escapeHtml(params.reason.trim());
  const greeting = firstName || "Bonjour";
  const html = edgeEmailShell(
    "Candidature",
    `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;">Bonjour ${greeting},</h1>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
       Nous vous remercions pour votre candidature au réseau EDGE.
     </p>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
       Après examen de votre dossier, nous ne sommes pas en mesure de valider votre profil pour le moment.
     </p>
     ${reason ? `<p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);"><strong>Motif :</strong> ${reason}</p>` : ""}
     <p style="margin:0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
       Nous restons à votre disposition pour toute question.
     </p>`,
  );
  return { subject: "Votre candidature EDGE", html };
}

export function getExpertNeedsInfoEmail(params: { firstName: string; message: string }) {
  const firstName = escapeHtml(params.firstName.trim());
  const message = escapeHtml(params.message.trim());
  const greeting = firstName || "Bonjour";
  const html = edgeEmailShell(
    "Informations complémentaires",
    `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#fff;">Bonjour ${greeting},</h1>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
       Nous avons besoin d'informations complémentaires pour finaliser l'examen de votre dossier.
     </p>
     <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);white-space:pre-wrap;">${message}</p>
     <p style="margin:0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
       Connectez-vous à votre espace formateur pour compléter votre profil.
     </p>`,
  );
  return { subject: "Complétez votre dossier EDGE", html };
}
