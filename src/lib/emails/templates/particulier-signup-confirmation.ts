export function getParticulierSignupConfirmationEmail(params: {
  firstName: string;
  confirmationLink: string;
}) {
  const firstName = params.firstName.trim();
  const greeting = firstName || "Bonjour";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Bienvenue ${greeting}</title></head>
<body style="margin:0;padding:32px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;color:#050505;">
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Bienvenue ${greeting}</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Vous venez de créer votre espace EDGE.</p>
  <p style="font-size:16px;line-height:1.6;margin:0 0 8px;">Vous pourrez compléter :</p>
  <ul style="font-size:16px;line-height:1.6;margin:0 0 24px;padding-left:20px;">
    <li>votre test comportemental ;</li>
    <li>votre test de personnalité ;</li>
    <li>votre test des soft skills.</li>
  </ul>
  <p style="margin:0 0 24px;">
    <a href="${params.confirmationLink}" style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px;background:#050505;">
      Ouvrir mon espace EDGE
    </a>
  </p>
  <p style="font-size:13px;line-height:1.5;color:#666;margin:0;">Inscription gratuite · sans engagement · lien valable 24 h</p>
</body>
</html>`;

  return {
    subject: firstName ? `${firstName}, bienvenue sur EDGE` : "Bienvenue sur EDGE",
    html,
  };
}
