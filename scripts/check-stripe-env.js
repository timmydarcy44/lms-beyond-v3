// Script pour vérifier les variables d'environnement Stripe
require('dotenv').config({ path: '.env.local' });

console.log('=== Vérification des variables Stripe ===\n');

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY;

console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', publishableKey ? `✓ Présente (${publishableKey.substring(0, 20)}...)` : '✗ Manquante');
console.log('STRIPE_SECRET_KEY:', secretKey ? `✓ Présente (${secretKey.substring(0, 20)}...)` : '✗ Manquante');

if (publishableKey) {
  if (publishableKey.startsWith('pk_test_')) {
    console.log('  → Mode: TEST');
  } else if (publishableKey.startsWith('pk_live_')) {
    console.log('  → Mode: PRODUCTION');
  } else {
    console.log('  → ⚠ Format de clé inattendu');
  }
}

if (secretKey) {
  if (secretKey.startsWith('sk_test_')) {
    console.log('  → Mode: TEST');
  } else if (secretKey.startsWith('sk_live_')) {
    console.log('  → Mode: PRODUCTION');
  } else {
    console.log('  → ⚠ Format de clé inattendu');
  }
}

console.log('\n=== Résultat ===');
if (publishableKey && secretKey) {
  console.log('✓ Configuration Stripe complète');
} else {
  console.log('✗ Configuration Stripe incomplète');
  if (!publishableKey) console.log('  - Ajoutez NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY dans .env.local');
  if (!secretKey) console.log('  - Ajoutez STRIPE_SECRET_KEY dans .env.local');
}

