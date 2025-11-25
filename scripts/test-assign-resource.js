/**
 * Script de test pour vérifier l'assignation de ressource et l'envoi d'email
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const TEST_USER_ID = process.argv[2];
const TEST_CATALOG_ITEM_ID = process.argv[3];

if (!TEST_USER_ID || !TEST_CATALOG_ITEM_ID) {
  console.error('Usage: node scripts/test-assign-resource.js <userId> <catalogItemId>');
  console.error('Exemple: node scripts/test-assign-resource.js abc-123 def-456');
  process.exit(1);
}

async function testAssignResource() {
  console.log('🧪 Test d\'assignation de ressource...\n');
  console.log('User ID:', TEST_USER_ID);
  console.log('Catalog Item ID:', TEST_CATALOG_ITEM_ID);
  console.log('API URL:', `${API_URL}/api/admin/assign-resource`);
  console.log('');

  try {
    const response = await fetch(`${API_URL}/api/admin/assign-resource`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: En production, vous devrez inclure les cookies d'authentification
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        catalogItemId: TEST_CATALOG_ITEM_ID,
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.emailSent) {
      console.log('\n✅ Email envoyé avec succès!');
    } else {
      console.log('\n❌ Email non envoyé');
      if (data.emailError) {
        console.log('Erreur email:', data.emailError);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAssignResource();

