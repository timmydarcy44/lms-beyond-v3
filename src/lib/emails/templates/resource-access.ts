/**
 * Template email pour notifier qu'une ressource a été assignée
 */

export interface ResourceAccessEmailData {
  firstName?: string;
  email: string;
  resourceTitle: string;
  resourceUrl: string;
}

export function getResourceAccessEmail(data: ResourceAccessEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { firstName, resourceTitle, resourceUrl } = data;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.jessicacontentin.fr";
  const loginUrl = `${baseUrl}/jessica-contentin/login?next=${encodeURIComponent(resourceUrl)}`;

  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const subject = "Jessica vous a ouvert un accès";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F8F5F0; color: #2F2A25;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F8F5F0;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #C6A664 0%, #8B6F47 100%);">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 600;">Jessica CONTENTIN</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2F2A25;">
                ${greeting}
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #2F2A25;">
                Je viens de vous ouvrir un accès à la ressource suivante :
              </p>
              
              <div style="background-color: #F8F5F0; border-left: 4px solid #C6A664; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #2F2A25;">
                  ${resourceTitle}
                </p>
              </div>
              
              <p style="margin: 30px 0 20px; font-size: 16px; line-height: 1.6; color: #2F2A25;">
                Vous pouvez maintenant y accéder directement depuis votre compte.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="${resourceUrl}" style="display: inline-block; padding: 16px 32px; background-color: #C6A664; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                      Accéder à la ressource
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br>
                <a href="${resourceUrl}" style="color: #C6A664; text-decoration: underline; word-break: break-all;">${resourceUrl}</a>
              </p>
              
              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                Si vous n'avez pas encore de compte, vous pouvez vous connecter ici :<br>
                <a href="${loginUrl}" style="color: #C6A664; text-decoration: underline;">${loginUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: #F8F5F0; border-top: 1px solid #E6D9C6;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Cordialement,<br>
                <strong style="color: #2F2A25;">Jessica CONTENTIN</strong>
              </p>
              <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                Cet email a été envoyé automatiquement. Merci de ne pas y répondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${greeting}

Je viens de vous ouvrir un accès à la ressource suivante :

${resourceTitle}

Vous pouvez maintenant y accéder directement depuis votre compte en cliquant sur ce lien :

${resourceUrl}

Si vous n'avez pas encore de compte, vous pouvez vous connecter ici :
${loginUrl}

Cordialement,
Jessica CONTENTIN
  `.trim();

  return { subject, html, text };
}

