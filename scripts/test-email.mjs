/**
 * Script de test pour envoyer un email de confirmation d'inscription
 * Usage: node scripts/test-email.mjs
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: join(__dirname, '..', '.env.local') });

// Utiliser uniquement la variable d'environnement
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3';

if (!BREVO_API_KEY) {
  console.error('❌ BREVO_API_KEY n\'est pas configurée');
  process.exit(1);
}

const email = 'contentin.cabinet@gmail.com';
const firstName = 'Jessica';
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jessicacontentin.fr';
const confirmationLink = `${baseUrl}/jessica-contentin/ressources?confirmed=true`;

// Template HTML simplifié pour le test
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre adresse email - Jessica CONTENTIN</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif; line-height: 1.6; color: #2F2A25; background-color: #F8F5F0; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; padding: 40px;">
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="color: #C6A664; font-size: 28px; margin: 0;">Jessica CONTENTIN</h1>
      <p style="color: #2F2A25; font-size: 14px; margin-top: 8px;">Psychopédagogue certifiée en neuroéducation</p>
    </div>
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
    </div>
  </div>
</body>
</html>
`;

const textContent = `
Bienvenue ${firstName} !

Merci de vous être inscrit(e) sur mon site. Je suis ravie de vous accueillir dans ma communauté !

Pour finaliser votre inscription, veuillez confirmer votre adresse email en cliquant sur ce lien :
${confirmationLink}

Une fois votre email confirmé, vous serez automatiquement redirigé(e) vers la page des ressources où vous pourrez découvrir tous mes contenus.

© ${new Date().getFullYear()} Jessica CONTENTIN. Tous droits réservés.
`;

console.log('📧 Envoi d\'un email de confirmation d\'inscription...');
console.log('📬 Destinataire:', email);
console.log('🔗 Lien de confirmation:', confirmationLink);
console.log('');

try {
  const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Jessica CONTENTIN',
        email: 'contentin.cabinet@gmail.com', // Utiliser l'email vérifié du compte BREVO
      },
      to: [{ email }],
      subject: 'Confirmez votre adresse email - Jessica CONTENTIN',
      htmlContent,
      textContent,
      replyTo: {
        name: 'Jessica CONTENTIN',
        email: 'contentin.cabinet@gmail.com',
      },
      tags: ['signup', 'confirmation', 'test'],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    console.error('❌ Erreur lors de l\'envoi de l\'email:');
    console.error('   Status:', response.status);
    console.error('   Message:', errorData.message || errorData);
    process.exit(1);
  }

  const data = await response.json();
  console.log('✅ Email envoyé avec succès!');
  console.log('📨 Message ID:', data.messageId);
  console.log('');
  console.log('Vérifiez la boîte email (et les spams) de', email);
} catch (error) {
  console.error('❌ Exception:', error.message);
  console.error(error);
  process.exit(1);
}

