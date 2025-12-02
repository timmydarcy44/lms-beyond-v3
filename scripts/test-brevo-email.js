/**
 * Script de test pour vérifier l'envoi d'email via Brevo
 * Usage: node scripts/test-brevo-email.js
 */

require('dotenv').config({ path: '.env.local' });

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

console.log("🔍 Test de la configuration Brevo...\n");
console.log("BREVO_API_KEY existe:", !!BREVO_API_KEY);
console.log("BREVO_API_KEY longueur:", BREVO_API_KEY?.length || 0);
if (BREVO_API_KEY) {
  console.log("BREVO_API_KEY commence par:", BREVO_API_KEY.substring(0, 15));
}
console.log("");

if (!BREVO_API_KEY) {
  console.error("❌ BREVO_API_KEY n'est pas configurée dans .env.local");
  process.exit(1);
}

async function testEmail() {
  const testEmail = "timdarcypro@gmail.com"; // Email de test
  
  const payload = {
    sender: {
      name: "Jessica CONTENTIN",
      email: "contentin.cabinet@gmail.com",
    },
    to: [{ email: testEmail }],
    subject: "Test d'envoi d'email - Beyond Connect",
    htmlContent: `
      <h1>Test d'envoi d'email</h1>
      <p>Si vous recevez cet email, la configuration Brevo fonctionne correctement !</p>
      <p>Clé API utilisée: ${BREVO_API_KEY.substring(0, 15)}...</p>
    `,
    textContent: "Test d'envoi d'email - Si vous recevez cet email, la configuration Brevo fonctionne correctement !",
  };

  console.log("📧 Envoi d'un email de test à", testEmail, "...\n");

  try {
    const response = await fetch(`${BREVO_API_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Status HTTP:", response.status);
    console.log("Response OK:", response.ok);
    console.log("");

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erreur lors de l'envoi:");
      console.error(JSON.stringify(data, null, 2));
      
      if (data.code === "unauthorized" || data.message === "Key not found") {
        console.error("\n⚠️  La clé API Brevo n'est pas valide ou a expiré.");
        console.error("Vérifiez votre clé API dans le dashboard Brevo:");
        console.error("https://app.brevo.com/settings/keys/api");
      }
      
      return;
    }

    console.log("✅ Email envoyé avec succès !");
    console.log("Message ID:", data.messageId);
    console.log("\n📬 Vérifiez votre boîte de réception (et les spams) pour", testEmail);
    
  } catch (error) {
    console.error("❌ Erreur:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testEmail();

