/**
 * Script pour supprimer l'utilisateur demo95958@gmail.com via l'API
 * Usage: node scripts/delete-demo-user-api.js
 */

const email = 'demo95958@gmail.com';
const apiUrl = 'http://localhost:3000/api/beyond-connect/admin/delete-user';

async function deleteUser() {
  try {
    console.log(`🔍 Suppression de l'utilisateur ${email}...`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ ${data.message}`);
      if (data.userId) {
        console.log(`   ID supprimé: ${data.userId}`);
      }
    } else {
      console.error(`❌ Erreur: ${data.error || data.message || 'Erreur inconnue'}`);
      if (data.details) {
        console.error(`   Détails: ${data.details}`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'appel API:', error.message);
    console.error('   Assurez-vous que le serveur est démarré (npm run dev)');
  }
}

deleteUser();

