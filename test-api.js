// Test script pour vérifier les API endpoints
// À exécuter dans la console du navigateur sur localhost:3000

async function testAPI() {
  const baseUrl = 'http://localhost:3000/api';
  
  console.log('🧪 Test des API endpoints...');
  
  // Test 1: Listes formations (nécessite org slug)
  try {
    const formations = await fetch(`${baseUrl}/lists/formations?org=test-org`);
    console.log('✅ Formations list:', await formations.json());
  } catch (e) {
    console.log('❌ Formations list:', e.message);
  }
  
  // Test 2: Création formation (nécessite auth + org)
  try {
    const createFormation = await fetch(`${baseUrl}/formations?org=test-org`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Formation',
        description: 'Description test',
        visibility_mode: 'private'
      })
    });
    console.log('✅ Create formation:', await createFormation.json());
  } catch (e) {
    console.log('❌ Create formation:', e.message);
  }
  
  // Test 3: Parcours list
  try {
    const parcours = await fetch(`${baseUrl}/parcours?org=test-org`);
    console.log('✅ Parcours list:', await parcours.json());
  } catch (e) {
    console.log('❌ Parcours list:', e.message);
  }
  
  console.log('🏁 Tests terminés');
}

// Exécuter: testAPI()
