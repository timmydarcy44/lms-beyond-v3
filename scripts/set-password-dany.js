/**
 * Script pour définir le mot de passe de Dany Pain
 * Usage: node scripts/set-password-dany.js
 * 
 * Assurez-vous d'avoir SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre .env.local
 */

require('dotenv').config({ path: '.env.local' });

// Charger toutes les variables d'environnement
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Variables d\'environnement:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ (longueur: ' + SUPABASE_SERVICE_ROLE_KEY.length + ')' : '❌');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Erreur: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

async function setPassword() {
  try {
    console.log('🔐 Définition du mot de passe pour paindany36@gmail.com...');

    // Trouver l'utilisateur
    const listUsersResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!listUsersResponse.ok) {
      const error = await listUsersResponse.json();
      throw new Error(`Erreur lors de la recherche: ${JSON.stringify(error)}`);
    }

    const usersData = await listUsersResponse.json();
    const user = usersData.users.find(u => u.email === 'paindany36@gmail.com');

    if (!user) {
      throw new Error('Utilisateur paindany36@gmail.com non trouvé');
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}`);

    // Mettre à jour le mot de passe
    const updateResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: 'caentraining14',
        email_confirm: true,
      }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      throw new Error(`Erreur lors de la mise à jour: ${JSON.stringify(error)}`);
    }

    const updateData = await updateResponse.json();
    console.log('✅ Mot de passe défini avec succès!');
    console.log(`   Email: ${updateData.user.email}`);
    console.log(`   ID: ${updateData.user.id}`);
    console.log('\n📧 Dany peut maintenant se connecter avec:');
    console.log('   Email: paindany36@gmail.com');
    console.log('   Mot de passe: caentraining14');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

setPassword();

