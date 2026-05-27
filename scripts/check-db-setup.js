/**
 * Script pour vérifier la configuration de la base de données
 * Usage: node scripts/check-db-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration de la base de données...\n');

// Vérifier .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ .env.local non trouvé');
  console.log('📝 Créez ce fichier avec les variables Supabase (voir SETUP_DB.md)\n');
} else {
  console.log('✅ .env.local trouvé');
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
  const hasDbPassword = envContent.includes('SUPABASE_DB_PASSWORD=');
  
  console.log(`   ${hasUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL`);
  console.log(`   ${hasAnonKey ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY`);
  console.log(`   ${hasServiceKey ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY`);
  console.log(`   ${hasDatabaseUrl || hasDbPassword ? '✅' : '⚠️ '} DATABASE_URL ou SUPABASE_DB_PASSWORD (Prisma optionnel)`);
  console.log('   ℹ️  Open Badges admin : supabase/migrations/20260527130000_open_badges_admin_columns.sql\n');
}

// Vérifier les migrations
const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations');
const migrationsExist = fs.existsSync(migrationsPath);

if (migrationsExist) {
  const migrations = fs.readdirSync(migrationsPath)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`✅ ${migrations.length} migration(s) trouvée(s):`);
  migrations.forEach(m => console.log(`   - ${m}`));
  console.log('');
} else {
  console.log('⚠️  Dossier migrations non trouvé\n');
}

console.log('📚 Pour plus d\'informations, consultez SETUP_DB.md');









