/**
 * Script pour supprimer l'utilisateur demo95958@gmail.com de Supabase
 * Usage: node scripts/delete-demo-user.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteDemoUser() {
  const email = 'demo95958@gmail.com';
  
  console.log(`🔍 Recherche de l'utilisateur ${email}...`);

  try {
    // 1. Trouver l'utilisateur par email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', listError);
      return;
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.log(`✅ L'utilisateur ${email} n'existe pas dans la base de données.`);
      return;
    }

    console.log(`📋 Utilisateur trouvé:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Créé le: ${new Date(user.created_at).toLocaleString('fr-FR')}`);

    // 2. Supprimer les données associées dans public.profiles
    console.log(`\n🗑️  Suppression du profil...`);
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) {
      console.error('⚠️  Erreur lors de la suppression du profil:', profileError.message);
    } else {
      console.log('✅ Profil supprimé');
    }

    // 3. Supprimer les candidatures Beyond Connect
    console.log(`\n🗑️  Suppression des candidatures...`);
    const { error: applicationsError } = await supabase
      .from('beyond_connect_applications')
      .delete()
      .eq('user_id', user.id);

    if (applicationsError) {
      console.error('⚠️  Erreur lors de la suppression des candidatures:', applicationsError.message);
    } else {
      console.log('✅ Candidatures supprimées');
    }

    // 4. Supprimer l'utilisateur de auth.users
    console.log(`\n🗑️  Suppression de l'utilisateur de auth.users...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression de l\'utilisateur:', deleteError);
      return;
    }

    console.log(`\n✅ Utilisateur ${email} supprimé avec succès !`);
    console.log(`   ID supprimé: ${user.id}`);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

deleteDemoUser();

