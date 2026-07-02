function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function getExpertRegistrationConfirmationEmail(params: {
  firstName: string;
  passwordSetupLink: string;
}) {
  const firstName = escapeHtml(params.firstName.trim());
  const greeting = firstName || "Bonjour";
  const link = params.passwordSetupLink;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bienvenue dans le réseau EDGE</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0a0a0a;padding:32px 16px 48px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:36px 28px 8px;">
              <p style="margin:0 0 24px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#635BFF;">Réseau EDGE</p>
              <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.25;color:#ffffff;">
                Bonjour ${greeting},
              </h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
                Votre profil a bien été enregistré.
              </p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:rgba(255,255,255,0.72);">
                Pour accéder à votre espace formateur restreint, veuillez créer votre mot de passe :
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 28px 24px;">
              <a href="${link}" target="_blank" rel="noopener noreferrer"
                 style="display:inline-block;padding:16px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;background:#635BFF;">
                Créer mon mot de passe
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 32px;">
              <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
                Votre profil est actuellement en cours de validation par notre équipe.
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
                Tant que votre profil n'est pas validé, vous pourrez uniquement consulter l'état de votre candidature et compléter certaines informations.
              </p>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.55);">
                Nous reviendrons vers vous très prochainement.
              </p>
              <p style="margin:24px 0 0;font-size:14px;line-height:1.65;color:rgba(255,255,255,0.45);">
                L'équipe EDGE
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {
    subject: "Bienvenue dans le réseau EDGE",
    html,
  };
}
