/**
 * Templates d'email pour les candidatures Beyond Connect
 */

/**
 * Email envoyé au candidat après soumission d'une candidature
 */
export function getApplicationConfirmationEmail({
  candidateName,
  jobTitle,
  companyName,
  applicationLink,
}: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationLink: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Candidature envoyée - Beyond Connect</title>
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
                Candidature envoyée avec succès ! ✅
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${candidateName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Votre candidature pour le poste de <strong>${jobTitle}</strong> chez <strong>${companyName}</strong> a bien été transmise au recruteur.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #003087; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                  <strong>Prochaines étapes :</strong><br>
                  Le recruteur va examiner votre profil et votre candidature. Vous serez notifié(e) dès qu'il y aura une mise à jour concernant votre candidature.
                </p>
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${applicationLink}" style="display: inline-block; padding: 14px 32px; background-color: #003087; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir ma candidature
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                En attendant, continuez à enrichir votre profil et à explorer d'autres opportunités sur Beyond Connect !
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
Beyond Connect - Candidature envoyée

Bonjour ${candidateName},

Votre candidature pour le poste de ${jobTitle} chez ${companyName} a bien été transmise au recruteur.

Prochaines étapes :
Le recruteur va examiner votre profil et votre candidature. Vous serez notifié(e) dès qu'il y aura une mise à jour concernant votre candidature.

Voir ma candidature : ${applicationLink}

En attendant, continuez à enrichir votre profil et à explorer d'autres opportunités sur Beyond Connect !

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `.trim();

  return { html, text };
}

/**
 * Email envoyé au recruteur lorsqu'une nouvelle candidature est reçue
 */
export function getNewApplicationNotificationEmail({
  recruiterName,
  candidateName,
  jobTitle,
  companyName,
  applicationLink,
  candidateProfileLink,
}: {
  recruiterName: string;
  candidateName: string;
  jobTitle: string;
  companyName: string;
  applicationLink: string;
  candidateProfileLink: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle candidature - Beyond Connect</title>
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
                Nouvelle candidature reçue 📨
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${recruiterName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Vous avez reçu une nouvelle candidature pour le poste de <strong>${jobTitle}</strong> chez <strong>${companyName}</strong>.
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #003087; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px; color: #003087; font-size: 16px; font-weight: 600;">
                  Candidat(e) : ${candidateName}
                </p>
                <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                  Poste : ${jobTitle}
                </p>
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${applicationLink}" style="display: inline-block; padding: 14px 32px; background-color: #003087; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 5px;">
                      Voir la candidature
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 10px;">
                    <a href="${candidateProfileLink}" style="display: inline-block; padding: 14px 32px; background-color: #ffffff; color: #003087; text-decoration: none; border: 2px solid #003087; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 5px;">
                      Voir le profil
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                Connectez-vous à votre espace recruteur pour gérer toutes vos candidatures.
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
Beyond Connect - Nouvelle candidature

Bonjour ${recruiterName},

Vous avez reçu une nouvelle candidature pour le poste de ${jobTitle} chez ${companyName}.

Candidat(e) : ${candidateName}
Poste : ${jobTitle}

Voir la candidature : ${applicationLink}
Voir le profil : ${candidateProfileLink}

Connectez-vous à votre espace recruteur pour gérer toutes vos candidatures.

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `.trim();

  return { html, text };
}

