/**
 * Templates d'emails pour Jessica Contentin
 */

export interface EmailTemplateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  resourceTitle?: string;
  resourcePrice?: number;
  purchaseDate?: string;
  confirmationLink?: string;
  loginLink?: string;
  resourceLink?: string; // Lien direct vers la ressource achetée
}

/**
 * Template d'email de confirmation d'inscription
 */
export function getSignupConfirmationEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const firstName = data.firstName || "Cher/Chère utilisateur/trice";
  const confirmationLink = data.confirmationLink || "https://www.jessicacontentin.fr/jessica-contentin/login";
  const loginLink = data.loginLink || "https://www.jessicacontentin.fr/jessica-contentin/login";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur Jessica Contentin</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; line-height: 1.6; color: #2F2A25; background-color: #F8F5F0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #C6A664; font-size: 28px; margin: 0;">Jessica CONTENTIN</h1>
      <p style="color: #2F2A25; font-size: 14px; margin-top: 8px;">Psychopédagogue certifiée en neuroéducation</p>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #2F2A25; font-size: 24px; margin-bottom: 20px;">Bienvenue ${firstName} !</h2>
      
      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Merci de vous être inscrit(e) sur mon site. Je suis ravie de vous accueillir dans ma communauté !
      </p>

      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Pour finaliser votre inscription et accéder à toutes mes ressources, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmationLink}" style="display: inline-block; background-color: #C6A664; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Confirmer mon email
        </a>
      </div>

      <p style="color: #2F2A25; font-size: 14px; margin-top: 30px;">
        Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br>
        <a href="${confirmationLink}" style="color: #C6A664; word-break: break-all;">${confirmationLink}</a>
      </p>

      <p style="color: #2F2A25; font-size: 16px; margin-top: 30px;">
        Une fois votre email confirmé, vous serez automatiquement redirigé(e) vers la page des ressources où vous pourrez découvrir tous mes contenus.
      </p>
      
      <p style="color: #2F2A25; font-size: 14px; margin-top: 20px; padding: 15px; background-color: #F8F5F0; border-left: 4px solid #C6A664; border-radius: 4px;">
        <strong>💡 Astuce :</strong> Si vous ne recevez pas l'email, vérifiez votre dossier spam ou indésirables.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #E6D9C6; padding-top: 30px; text-align: center;">
      <p style="color: #2F2A25; font-size: 14px; margin-bottom: 10px;">
        <a href="${loginLink}" style="color: #C6A664; text-decoration: none;">Se connecter</a>
      </p>
      <p style="color: #8B6F47; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Bienvenue ${firstName} !

Merci de vous être inscrit(e) sur mon site. Je suis ravie de vous accueillir dans ma communauté !

Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur ce lien :
${confirmationLink}

Une fois votre email confirmé, vous pourrez accéder à toutes mes ressources et formations.

Se connecter : ${loginLink}

© ${new Date().getFullYear()} Jessica Contentin. Tous droits réservés.
  `.trim();

  return {
    subject: "Confirmez votre adresse email - Jessica CONTENTIN",
    html,
    text,
  };
}

/**
 * Template d'email de confirmation d'achat
 */
export function getPurchaseConfirmationEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const firstName = data.firstName || "Cher/Chère utilisateur/trice";
  const resourceTitle = data.resourceTitle || "votre ressource";
  const resourcePrice = data.resourcePrice || 0;
  const purchaseDate = data.purchaseDate || new Date().toLocaleDateString("fr-FR");
  // loginLink est maintenant le lien vers "mon compte" (CTA principal)
  const accountLink = data.loginLink || "https://www.jessicacontentin.fr/jessica-contentin/mon-compte";
  // resourceLink est le lien secondaire vers les ressources ou la ressource spécifique
  const resourceLink = data.resourceLink || "https://www.jessicacontentin.fr/jessica-contentin/ressources";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation d'achat - Jessica Contentin</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; line-height: 1.6; color: #2F2A25; background-color: #F8F5F0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #C6A664; font-size: 28px; margin: 0;">Jessica CONTENTIN</h1>
      <p style="color: #2F2A25; font-size: 14px; margin-top: 8px;">Psychopédagogue certifiée en neuroéducation</p>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #2F2A25; font-size: 24px; margin-bottom: 20px;">Merci pour votre achat ${firstName} !</h2>
      
      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Votre achat a été confirmé avec succès. Vous avez maintenant accès à :
      </p>

      <div style="background-color: #F8F5F0; border: 1px solid #E6D9C6; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #2F2A25; font-size: 18px; margin: 0 0 10px 0;">${resourceTitle}</h3>
        <p style="color: #8B6F47; font-size: 14px; margin: 5px 0;">
          <strong>Prix :</strong> ${resourcePrice.toFixed(2)} €
        </p>
        <p style="color: #8B6F47; font-size: 14px; margin: 5px 0;">
          <strong>Date d'achat :</strong> ${purchaseDate}
        </p>
      </div>

      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Vous pouvez maintenant accéder à cette ressource depuis votre espace personnel.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${accountLink}" style="display: inline-block; background-color: #C6A664; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
          Accéder à mon compte
        </a>
        <br>
        <a href="${resourceLink}" style="display: inline-block; color: #C6A664; padding: 10px 20px; text-decoration: none; font-size: 14px;">
          Voir toutes mes ressources
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #E6D9C6; padding-top: 30px; text-align: center;">
      <p style="color: #2F2A25; font-size: 14px; margin-bottom: 10px;">
        <a href="${accountLink}" style="color: #C6A664; text-decoration: none;">Mon compte</a>
      </p>
      <p style="color: #8B6F47; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Merci pour votre achat ${firstName} !

Votre achat a été confirmé avec succès. Vous avez maintenant accès à :

${resourceTitle}
Prix : ${resourcePrice.toFixed(2)} €
Date d'achat : ${purchaseDate}

Vous pouvez maintenant accéder à cette ressource depuis votre espace personnel :
${accountLink}

Voir toutes mes ressources :
${resourceLink}

© ${new Date().getFullYear()} Jessica Contentin. Tous droits réservés.
  `.trim();

  return {
    subject: `Confirmation de votre achat - ${resourceTitle}`,
    html,
    text,
  };
}

/**
 * Template d'email de bienvenue (après confirmation)
 */
export function getWelcomeEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const firstName = data.firstName || "Cher/Chère utilisateur/trice";
  const loginLink = data.loginLink || "https://www.jessicacontentin.fr/jessica-contentin/ressources";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue - Jessica Contentin</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; line-height: 1.6; color: #2F2A25; background-color: #F8F5F0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #C6A664; font-size: 28px; margin: 0;">Jessica CONTENTIN</h1>
      <p style="color: #2F2A25; font-size: 14px; margin-top: 8px;">Psychopédagogue certifiée en neuroéducation</p>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #2F2A25; font-size: 24px; margin-bottom: 20px;">Bienvenue ${firstName} !</h2>
      
      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Votre compte a été activé avec succès. Vous pouvez maintenant accéder à toutes mes ressources et formations.
      </p>

      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Découvrez mes contenus sur la parentalité, la neuroéducation, et l'accompagnement des enfants.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${loginLink}" style="display: inline-block; background-color: #C6A664; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Découvrir mes ressources
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #E6D9C6; padding-top: 30px; text-align: center;">
      <p style="color: #8B6F47; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Bienvenue ${firstName} !

Votre compte a été activé avec succès. Vous pouvez maintenant accéder à toutes mes ressources et formations.

Découvrez mes contenus sur la parentalité, la neuroéducation, et l'accompagnement des enfants.

Accéder à mes ressources : ${loginLink}

© ${new Date().getFullYear()} Jessica Contentin. Tous droits réservés.
  `.trim();

  return {
    subject: "Bienvenue sur Jessica CONTENTIN",
    html,
    text,
  };
}

/**
 * Template d'email de réinitialisation de mot de passe
 */
export function getPasswordResetEmail(data: EmailTemplateData): { subject: string; html: string; text: string } {
  const firstName = data.firstName || "Cher/Chère utilisateur/trice";
  const resetLink = data.confirmationLink || "https://www.jessicacontentin.fr/jessica-contentin/reset-password";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Réinitialisation de mot de passe - Jessica CONTENTIN</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; line-height: 1.6; color: #2F2A25; background-color: #F8F5F0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #C6A664; font-size: 28px; margin: 0;">Jessica CONTENTIN</h1>
      <p style="color: #2F2A25; font-size: 14px; margin-top: 8px;">Psychopédagogue certifiée en neuroéducation</p>
    </div>

    <!-- Content -->
    <div style="margin-bottom: 40px;">
      <h2 style="color: #2F2A25; font-size: 24px; margin-bottom: 20px;">Réinitialisation de votre mot de passe</h2>
      
      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Bonjour ${firstName},
      </p>

      <p style="color: #2F2A25; font-size: 16px; margin-bottom: 20px;">
        Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="display: inline-block; background-color: #C6A664; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 16px;">
          Réinitialiser mon mot de passe
        </a>
      </div>

      <p style="color: #2F2A25; font-size: 14px; margin-top: 30px;">
        Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :<br>
        <a href="${resetLink}" style="color: #C6A664; word-break: break-all;">${resetLink}</a>
      </p>

      <p style="color: #2F2A25; font-size: 14px; margin-top: 30px; padding: 15px; background-color: #F8F5F0; border-left: 4px solid #C6A664; border-radius: 4px;">
        <strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top: 1px solid #E6D9C6; padding-top: 30px; text-align: center;">
      <p style="color: #2F2A25; font-size: 14px; margin-bottom: 10px;">
        <a href="https://www.jessicacontentin.fr/jessica-contentin/login" style="color: #C6A664; text-decoration: none;">Se connecter</a>
      </p>
      <p style="color: #8B6F47; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Réinitialisation de votre mot de passe

Bonjour ${firstName},

Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :

${resetLink}

⚠️ Important : Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.

Se connecter : https://www.jessicacontentin.fr/jessica-contentin/login

© ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
  `.trim();

  return {
    subject: "Réinitialisation de votre mot de passe - Jessica CONTENTIN",
    html,
    text,
  };
}

