/**
 * Script pour créer les comptes de démonstration via l'API Supabase Auth
 * 
 * Usage:
 *   node scripts/create-demo-accounts.js
 * 
 * Prérequis:
 *   - Avoir SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *   - Avoir NEXT_PUBLIC_SUPABASE_URL dans .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const users = [
  {
    email: 'formateur@beyond.fr',
    password: 'formateur123',
    metadata: {
      full_name: 'Tony Starck',
      first_name: 'Tony',
      last_name: 'Starck'
    },
    role: 'instructor'
  },
  {
    email: 'apprenant@beyond.fr',
    password: 'apprenant123',
    metadata: {
      full_name: 'Bruce Wayne',
      first_name: 'Bruce',
      last_name: 'Wayne'
    },
    role: 'student'
  },
  {
    email: 'tuteur@beyond.fr',
    password: 'tuteur123',
    metadata: {
      full_name: 'Jean tutorat',
      first_name: 'Jean',
      last_name: 'tutorat'
    },
    role: 'tutor'
  },
  {
    email: 'learner1@beyond.fr',
    password: 'learner123',
    metadata: {
      full_name: 'Alice Martin',
      first_name: 'Alice',
      last_name: 'Martin'
    },
    role: 'student'
  },
  {
    email: 'learner2@beyond.fr',
    password: 'learner123',
    metadata: {
      full_name: 'Bob Dupont',
      first_name: 'Bob',
      last_name: 'Dupont'
    },
    role: 'student'
  },
  {
    email: 'learner3@beyond.fr',
    password: 'learner123',
    metadata: {
      full_name: 'Clara Bernard',
      first_name: 'Clara',
      last_name: 'Bernard'
    },
    role: 'student'
  }
];

async function createUsers() {
  console.log('🚀 Création des comptes de démonstration...\n');

  for (const user of users) {
    try {
      // Vérifier si l'utilisateur existe déjà
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      if (existingUser) {
        console.log(`⚠️  L'utilisateur ${user.email} existe déjà (ID: ${existingUser.id})`);
        // Mettre à jour le mot de passe
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            password: user.password,
            user_metadata: user.metadata
          }
        );
        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`);
        } else {
          console.log(`   ✅ Mot de passe mis à jour`);
        }
        continue;
      }

      // Créer l'utilisateur
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata
      });

      if (error) {
        console.error(`❌ Erreur pour ${user.email}: ${error.message}`);
      } else {
        console.log(`✅ ${user.email} créé (ID: ${data.user.id})`);
      }
    } catch (error) {
      console.error(`❌ Erreur inattendue pour ${user.email}:`, error.message);
    }
  }

  console.log('\n✅ Création des utilisateurs terminée !');
  console.log('\n📝 Prochaines étapes:');
  console.log('   1. Exécutez le script SQL: supabase/CREATE_DEMO_ACCOUNTS_AND_DATA.sql');
  console.log('   2. Les données fictives seront créées automatiquement');
  console.log('\n🔑 Identifiants de connexion:');
  console.log('   - Formateur: formateur@beyond.fr / formateur123');
  console.log('   - Apprenant: apprenant@beyond.fr / apprenant123');
  console.log('   - Tuteur: tuteur@beyond.fr / tuteur123');
}

createUsers().catch(console.error);

