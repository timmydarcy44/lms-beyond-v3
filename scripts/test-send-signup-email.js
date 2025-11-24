/**
 * Script de test pour envoyer un email de confirmation d'inscription
 * Usage: node scripts/test-send-signup-email.js
 */

require('dotenv').config({ path: '.env.local' });

const { sendSignupConfirmationEmail } = require('../src/lib/emails/send');

async function testSendSignupEmail() {
  const email = 'contentin.cabinet@gmail.com';
  const firstName = 'Jessica';
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.jessicacontentin.fr';
  const confirmationLink = `${baseUrl}/jessica-contentin/ressources?confirmed=true`;

  console.log('📧 Envoi d\'un email de confirmation d\'inscription...');
  console.log('📬 Destinataire:', email);
  console.log('🔗 Lien de confirmation:', confirmationLink);
  console.log('');

  try {
    const result = await sendSignupConfirmationEmail(
      email,
      firstName,
      confirmationLink
    );

    if (result.success) {
      console.log('✅ Email envoyé avec succès!');
      console.log('📨 Message ID:', result.messageId);
      console.log('');
      console.log('Vérifiez la boîte email (et les spams) de', email);
    } else {
      console.error('❌ Erreur lors de l\'envoi de l\'email:');
      console.error('   ', result.error);
      console.log('');
      console.log('💡 Vérifiez que BREVO_API_KEY est configurée dans .env.local');
    }
  } catch (error) {
    console.error('❌ Exception:', error.message);
    console.error(error);
  }
}

testSendSignupEmail();

