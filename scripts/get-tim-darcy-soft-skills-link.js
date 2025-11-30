/**
 * Script pour récupérer l'ID du questionnaire Soft Skills de Tim Darcy
 * et générer le lien direct vers le test
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement manquantes');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getQuestionnaireLink() {
  try {
    console.log('🔍 Recherche du questionnaire Soft Skills de Tim Darcy...\n');

    // Récupérer le questionnaire
    const { data: questionnaire, error } = await supabase
      .from('mental_health_questionnaires')
      .select(`
        id,
        title,
        description,
        created_at,
        created_by,
        profiles!inner(email)
      `)
      .eq('title', 'Soft Skills – Profil 360')
      .eq('profiles.email', 'timdarcypro@gmail.com')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Erreur lors de la recherche:', error.message);
      process.exit(1);
    }

    if (!questionnaire) {
      console.error('❌ Questionnaire non trouvé');
      console.error('   Vérifiez que le questionnaire "Soft Skills – Profil 360" existe');
      console.error('   et qu\'il a été créé par timdarcypro@gmail.com');
      process.exit(1);
    }

    console.log('✅ Questionnaire trouvé!\n');
    console.log('📋 Détails:');
    console.log('   ID:', questionnaire.id);
    console.log('   Titre:', questionnaire.title);
    console.log('   Créé le:', new Date(questionnaire.created_at).toLocaleString('fr-FR'));
    console.log('   Créateur:', questionnaire.profiles?.email || 'N/A');
    console.log('');

    // Générer le lien
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${baseUrl}/dashboard/apprenant/questionnaires/${questionnaire.id}`;

    console.log('🔗 Lien du test Soft Skills:');
    console.log('   ' + link);
    console.log('');
    console.log('📝 Format du lien:');
    console.log(`   {BASE_URL}/dashboard/apprenant/questionnaires/${questionnaire.id}`);
    console.log('');
    console.log('💡 Note: Remplacez {BASE_URL} par votre URL de production si nécessaire');
    console.log('   (ex: https://votre-domaine.com)');

    return link;
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    process.exit(1);
  }
}

getQuestionnaireLink();

