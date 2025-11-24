/**
 * Script pour vérifier la configuration BREVO
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration BREVO...\n');

// Vérifier .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
let envLocalExists = false;
let brevoKeyInLocal = false;

if (fs.existsSync(envLocalPath)) {
  envLocalExists = true;
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  brevoKeyInLocal = envContent.includes('BREVO_API_KEY=') && 
                    envContent.split('BREVO_API_KEY=')[1]?.split('\n')[0]?.trim().length > 0;
  
  if (brevoKeyInLocal) {
    const keyValue = envContent.split('BREVO_API_KEY=')[1]?.split('\n')[0]?.trim();
    console.log('✅ BREVO_API_KEY trouvée dans .env.local');
    console.log(`   Longueur: ${keyValue?.length || 0} caractères`);
    console.log(`   Commence par: ${keyValue?.substring(0, 10) || 'N/A'}...`);
  } else {
    console.log('❌ BREVO_API_KEY non trouvée ou vide dans .env.local');
  }
} else {
  console.log('⚠️  Fichier .env.local non trouvé');
}

// Vérifier .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('BREVO_API_KEY=')) {
    console.log('⚠️  BREVO_API_KEY trouvée dans .env (utilisez .env.local pour le développement)');
  }
}

// Instructions
console.log('\n📋 Instructions pour configurer BREVO_API_KEY:\n');
console.log('1. Obtenez votre clé API BREVO:');
console.log('   - Connectez-vous à https://app.brevo.com');
console.log('   - Allez dans Settings → API Keys');
console.log('   - Créez ou copiez une clé API (format: xkeysib-...)\n');

console.log('2. Ajoutez la clé dans .env.local:');
console.log('   BREVO_API_KEY=xkeysib-votre-cle-api-ici\n');

console.log('3. Pour Vercel (production):');
console.log('   - Allez dans votre projet Vercel');
console.log('   - Settings → Environment Variables');
console.log('   - Ajoutez BREVO_API_KEY avec votre clé');
console.log('   - Sélectionnez: Production, Preview, Development\n');

if (!brevoKeyInLocal) {
  console.log('⚠️  Action requise: Ajoutez BREVO_API_KEY dans .env.local et redémarrez le serveur');
  process.exit(1);
} else {
  console.log('✅ Configuration BREVO correcte!');
  process.exit(0);
}

