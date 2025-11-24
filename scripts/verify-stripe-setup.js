// Script pour vérifier et guider la configuration Stripe
const fs = require('fs');
const path = require('path');

console.log('=== Vérification de la configuration Stripe ===\n');

const envLocalPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ Le fichier .env.local n\'existe pas');
  console.log('\n📝 Créez le fichier .env.local à la racine du projet avec :');
  console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx');
  console.log('STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx');
  process.exit(1);
}

const envContent = fs.readFileSync(envLocalPath, 'utf8');
const lines = envContent.split('\n');

let hasPublishableKey = false;
let hasSecretKey = false;

lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=')) {
    hasPublishableKey = true;
    const value = trimmed.split('=')[1]?.trim();
    if (value && value.length > 0) {
      console.log(`✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY trouvée (ligne ${index + 1})`);
      if (value.startsWith('pk_test_') || value.startsWith('pk_live_')) {
        console.log(`  → Format correct: ${value.substring(0, 20)}...`);
      } else {
        console.log(`  ⚠ Format inattendu (devrait commencer par pk_test_ ou pk_live_)`);
      }
    } else {
      console.log(`✗ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY trouvée mais vide (ligne ${index + 1})`);
    }
  }
  if (trimmed.startsWith('STRIPE_SECRET_KEY=')) {
    hasSecretKey = true;
    const value = trimmed.split('=')[1]?.trim();
    if (value && value.length > 0) {
      console.log(`✓ STRIPE_SECRET_KEY trouvée (ligne ${index + 1})`);
      if (value.startsWith('sk_test_') || value.startsWith('sk_live_')) {
        console.log(`  → Format correct: ${value.substring(0, 20)}...`);
      } else {
        console.log(`  ⚠ Format inattendu (devrait commencer par sk_test_ ou sk_live_)`);
      }
    } else {
      console.log(`✗ STRIPE_SECRET_KEY trouvée mais vide (ligne ${index + 1})`);
    }
  }
});

console.log('\n=== Résultat ===');
if (hasPublishableKey && hasSecretKey) {
  console.log('✓ Les deux variables Stripe sont présentes dans .env.local');
  console.log('\n⚠️  IMPORTANT: Redémarrez le serveur de développement pour que les changements prennent effet:');
  console.log('   1. Arrêtez le serveur (Ctrl+C)');
  console.log('   2. Relancez: npm run dev');
} else {
  console.log('✗ Configuration incomplète');
  if (!hasPublishableKey) {
    console.log('\n  ❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante');
    console.log('     Ajoutez cette ligne dans .env.local:');
    console.log('     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx');
  }
  if (!hasSecretKey) {
    console.log('\n  ❌ STRIPE_SECRET_KEY manquante');
    console.log('     Ajoutez cette ligne dans .env.local:');
    console.log('     STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx');
  }
  console.log('\n📝 Où trouver les clés Stripe:');
  console.log('   1. Connectez-vous à https://dashboard.stripe.com');
  console.log('   2. Allez dans Developers → API keys');
  console.log('   3. Copiez la "Publishable key" (pk_test_...)');
  console.log('   4. Copiez la "Secret key" (sk_test_...)');
}

