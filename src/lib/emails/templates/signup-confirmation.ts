/**
 * Template email de confirmation d'inscription Beyond Connect
 */

export function getSignupConfirmationEmail({
  email,
  confirmationLink,
}: {
  email: string;
  confirmationLink: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre inscription</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #003087; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                Beyond Connect
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                Confirmez votre inscription
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Merci de vous être inscrit(e) sur Beyond Connect ! Pour finaliser votre inscription et créer votre profil, veuillez cliquer sur le bouton ci-dessous :
              </p>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${confirmationLink}" style="display: inline-block; padding: 14px 32px; background-color: #003087; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Confirmer mon inscription
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
              </p>
              <p style="margin: 10px 0 0; color: #003087; font-size: 14px; word-break: break-all;">
                ${confirmationLink}
              </p>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 12px; line-height: 1.6;">
                Ce lien est valide pendant 24 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Beyond Connect - Confirmez votre inscription

Bonjour,

Merci de vous être inscrit(e) sur Beyond Connect ! Pour finaliser votre inscription et créer votre profil, veuillez cliquer sur le lien ci-dessous :

${confirmationLink}

Ce lien est valide pendant 24 heures. Si vous n'avez pas demandé cette inscription, vous pouvez ignorer cet email.

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `;

  return { html, text };
}

