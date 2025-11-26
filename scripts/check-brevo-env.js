/**
 * Script pour vérifier la configuration de BREVO_API_KEY
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de la configuration BREVO_API_KEY\n');

// Vérifier .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('✅ Fichier .env.local trouvé');
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  
  if (envContent.includes('BREVO_API_KEY')) {
    console.log('✅ BREVO_API_KEY trouvée dans .env.local');
    
    // Extraire la valeur (gérer les retours à la ligne et espaces)
    const lines = envContent.split('\n');
    let brevoLine = null;
    for (const line of lines) {
      if (line.trim().startsWith('BREVO_API_KEY=')) {
        brevoLine = line;
        break;
      }
    }
    
    if (brevoLine) {
      // Extraire la valeur après le signe =
      const match = brevoLine.match(/BREVO_API_KEY\s*=\s*(.+)/);
      if (match) {
        const key = match[1].trim();
        // Supprimer les guillemets si présents
        const cleanKey = key.replace(/^["']|["']$/g, '');
        
        if (cleanKey && cleanKey.length > 0) {
          console.log(`✅ Clé trouvée (longueur: ${cleanKey.length} caractères)`);
          console.log(`   Commence par: ${cleanKey.substring(0, 10)}...`);
          
          // Vérifier le format
          if (cleanKey.startsWith('xkeysib-')) {
            console.log('✅ Format de clé BREVO correct (commence par xkeysib-)');
          } else {
            console.warn('⚠️  Format de clé suspect (devrait commencer par xkeysib-)');
            console.warn(`   Commence par: ${cleanKey.substring(0, 20)}`);
          }
        } else {
          console.error('❌ BREVO_API_KEY est vide dans .env.local');
        }
      } else {
        console.error('❌ Impossible d\'extraire la valeur de BREVO_API_KEY');
        console.log('   Ligne trouvée:', brevoLine.substring(0, 50));
      }
    } else {
      console.error('❌ BREVO_API_KEY trouvée mais format incorrect');
    }
  } else {
    console.error('❌ BREVO_API_KEY non trouvée dans .env.local');
    console.log('\n💡 Ajoutez cette ligne dans .env.local:');
    console.log('   BREVO_API_KEY=xkeysib-votre-cle-ici');
  }
} else {
  console.error('❌ Fichier .env.local non trouvé');
  console.log('\n💡 Créez un fichier .env.local à la racine du projet avec:');
  console.log('   BREVO_API_KEY=xkeysib-votre-cle-ici');
}

console.log('\n📝 Note: Après avoir ajouté/modifié BREVO_API_KEY dans .env.local,');
console.log('   vous devez redémarrer le serveur de développement (npm run dev)');

