/**
 * Templates d'email pour les notifications d'offres d'emploi Beyond Connect
 */

/**
 * Email envoyé au candidat lorsqu'une nouvelle offre correspond à son profil
 */
export function getNewJobMatchEmail({
  candidateName,
  jobTitle,
  companyName,
  jobLocation,
  jobLink,
  matchScore,
}: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  jobLocation?: string;
  jobLink: string;
  matchScore?: number;
}) {
  const locationText = jobLocation ? ` à ${jobLocation}` : "";
  const matchText = matchScore ? ` (${matchScore}% de correspondance)` : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle offre qui vous correspond - Beyond Connect</title>
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
                Une nouvelle opportunité vous attend ! 🎯
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${candidateName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Nous avons trouvé une offre d'emploi qui correspond à votre profil${matchText} :
              </p>
              
              <div style="background-color: #f0f7ff; border-left: 4px solid #003087; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 10px; color: #003087; font-size: 20px; font-weight: 600;">
                  ${jobTitle}
                </h3>
                <p style="margin: 0 0 5px; color: #4a4a4a; font-size: 16px; font-weight: 600;">
                  ${companyName}
                </p>
                ${jobLocation ? `<p style="margin: 0; color: #8a8a8a; font-size: 14px;">📍 ${jobLocation}</p>` : ""}
              </div>
              
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${jobLink}" style="display: inline-block; padding: 14px 32px; background-color: #003087; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Voir l'offre
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #8a8a8a; font-size: 14px; line-height: 1.6;">
                Ne manquez pas cette opportunité ! Consultez l'offre complète et postulez si elle vous intéresse.
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
Beyond Connect - Nouvelle offre qui vous correspond

Bonjour ${candidateName},

Nous avons trouvé une offre d'emploi qui correspond à votre profil${matchText} :

${jobTitle}
${companyName}
${jobLocation ? `📍 ${jobLocation}` : ""}

Voir l'offre : ${jobLink}

Ne manquez pas cette opportunité ! Consultez l'offre complète et postulez si elle vous intéresse.

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `.trim();

  return { html, text };
}

/**
 * Email envoyé au candidat lors d'une mise à jour de statut de candidature
 */
export function getApplicationStatusUpdateEmail({
  candidateName,
  jobTitle,
  companyName,
  status,
  statusMessage,
  applicationLink,
}: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  status: "accepted" | "rejected" | "interview" | "review";
  statusMessage?: string;
  applicationLink: string;
}) {
  const statusConfig = {
    accepted: {
      title: "Félicitations ! Votre candidature a été acceptée 🎉",
      color: "#28a745",
      bgColor: "#d4edda",
      borderColor: "#28a745",
    },
    rejected: {
      title: "Mise à jour concernant votre candidature",
      color: "#dc3545",
      bgColor: "#f8d7da",
      borderColor: "#dc3545",
    },
    interview: {
      title: "Entretien programmé ! 📅",
      color: "#003087",
      bgColor: "#f0f7ff",
      borderColor: "#003087",
    },
    review: {
      title: "Mise à jour de votre candidature",
      color: "#ffc107",
      bgColor: "#fff3cd",
      borderColor: "#ffc107",
    },
  };

  const config = statusConfig[status];
  const defaultMessage = statusMessage || {
    accepted: "Votre candidature a été acceptée ! Le recruteur vous contactera prochainement pour la suite du processus.",
    rejected: "Malheureusement, votre candidature n'a pas été retenue pour ce poste. Nous vous encourageons à continuer à postuler à d'autres offres.",
    interview: "Votre candidature a retenu l'attention ! Un entretien a été programmé. Le recruteur vous contactera avec les détails.",
    review: "Votre candidature est en cours d'examen. Le recruteur vous tiendra informé(e) de l'avancement.",
  }[status];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mise à jour de candidature - Beyond Connect</title>
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
                ${config.title}
              </h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Bonjour ${candidateName},
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Nous avons une mise à jour concernant votre candidature pour le poste de <strong>${jobTitle}</strong> chez <strong>${companyName}</strong>.
              </p>
              
              <div style="background-color: ${config.bgColor}; border-left: 4px solid ${config.borderColor}; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: ${config.color}; font-size: 15px; line-height: 1.6; font-weight: 600;">
                  ${defaultMessage}
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
              
              ${status === "rejected" ? `
              <p style="margin: 30px 0 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Ne vous découragez pas ! Continuez à enrichir votre profil et explorez d'autres opportunités qui correspondent à vos compétences.
              </p>
              ` : ""}
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
Beyond Connect - Mise à jour de candidature

${config.title}

Bonjour ${candidateName},

Nous avons une mise à jour concernant votre candidature pour le poste de ${jobTitle} chez ${companyName}.

${defaultMessage}

Voir ma candidature : ${applicationLink}

${status === "rejected" ? "Ne vous découragez pas ! Continuez à enrichir votre profil et explorez d'autres opportunités qui correspondent à vos compétences." : ""}

© ${new Date().getFullYear()} Beyond Connect. Tous droits réservés.
  `.trim();

  return { html, text };
}

