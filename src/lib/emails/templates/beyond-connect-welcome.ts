/**
 * Template email de bienvenue Beyond Connect (après confirmation d'email)
 */

export function getBeyondConnectWelcomeEmail({
  firstName,
  email,
  dashboardLink,
}: {
  firstName?: string;
  email: string;
  dashboardLink: string;
}) {
  const displayName = firstName || "Cher/Chère candidat(e)";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Beyond Connect</title>
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
                Bienvenue ${displayName} ! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Félicitations ! Votre compte Beyond Connect a été activé avec succès. Vous êtes maintenant prêt(e) à créer votre profil et à découvrir des opportunités professionnelles adaptées à vos compétences.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #003087; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; color: #003087; font-size: 18px; font-weight: 600;">
                  Prochaines étapes :
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                  <li>Complétez votre profil professionnel</li>
                  <li>Ajoutez vos compétences et expériences</li>
                  <li>Passez le test des Soft Skills</li>
                  <li>Explorez les offres d'emploi personnalisées</li>
                </ul>
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${dashboardLink}" style="display: inline-block; padding: 14px 32px; background-color: #003087; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Accéder à mon espace
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Si vous avez des questions, n'hésitez pas à nous contacter. Nous sommes là pour vous accompagner dans votre parcours professionnel.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f9f9f9; border-radius: 0 0 8px 8px;">
              <p style="margin: 0 0 10px; color: #8a8a8a; font-size: 12px;">
                © ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
              </p>
              <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                <a href="${dashboardLink}" style="color: #003087; text-decoration: none;">Accéder à mon espace</a>
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
Beyond Connect - Bienvenue !

${displayName},

Félicitations ! Votre compte Beyond Connect a été activé avec succès. Vous êtes maintenant prêt(e) à créer votre profil et à découvrir des opportunités professionnelles adaptées à vos compétences.

Prochaines étapes :
- Complétez votre profil professionnel
- Ajoutez vos compétences et expériences
- Passez le test des Soft Skills
- Explorez les offres d'emploi personnalisées

Accéder à mon espace : ${dashboardLink}

Si vous avez des questions, n'hésitez pas à nous contacter. Nous sommes là pour vous accompagner dans votre parcours professionnel.

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `.trim();

  return { html, text };
}

