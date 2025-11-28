/**
 * Script pour tester l'accès à Beyond Connect pour Alfred et Bruce
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testAccess() {
  console.log("🔍 Test d'accès à Beyond Connect\n");

  // 1. Récupérer Alfred via profiles
  const { data: alfredProfile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", "admin@beyondcenter.fr")
    .single();

  if (!alfredProfile) {
    console.error("❌ Alfred (admin@beyondcenter.fr) non trouvé");
    return;
  }
  console.log("✅ Alfred trouvé:", alfredProfile.id, "role:", alfredProfile.role);

  // 2. Récupérer Bruce via profiles
  const { data: bruceProfile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", "demo@beyondcenter.fr")
    .single();

  if (!bruceProfile) {
    console.error("❌ Bruce (demo@beyondcenter.fr) non trouvé");
    return;
  }
  console.log("✅ Bruce trouvé:", bruceProfile.id, "role:", bruceProfile.role);

  // 3. Récupérer l'organisation
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("name", "Beyond Center Demo")
    .single();

  if (!org) {
    console.error("❌ Organisation 'Beyond Center Demo' non trouvée");
    return;
  }
  console.log("✅ Organisation trouvée:", org.id, org.name);

  // 4. Vérifier les memberships
  const { data: alfredMembership } = await supabase
    .from("org_memberships")
    .select("org_id, role")
    .eq("user_id", alfredProfile.id)
    .eq("org_id", org.id)
    .single();

  console.log("\n📋 Membership d'Alfred:", alfredMembership);

  const { data: bruceMembership } = await supabase
    .from("org_memberships")
    .select("org_id, role")
    .eq("user_id", bruceProfile.id)
    .eq("org_id", org.id)
    .single();

  console.log("📋 Membership de Bruce:", bruceMembership);

  // 5. Vérifier Beyond Connect
  const { data: feature } = await supabase
    .from("organization_features")
    .select("org_id, feature_key, is_enabled")
    .eq("org_id", org.id)
    .eq("feature_key", "beyond_connect")
    .single();

  console.log("\n🔐 Feature Beyond Connect:", feature);

  // 6. Test d'accès pour Alfred
  console.log("\n🧪 Test d'accès pour Alfred:");
  if (alfredMembership?.role === "admin" && feature?.is_enabled === true) {
    console.log("✅ Alfred devrait avoir accès (admin + feature activée)");
  } else {
    console.log("❌ Alfred n'a PAS accès");
    console.log("   - Role:", alfredMembership?.role);
    console.log("   - Feature enabled:", feature?.is_enabled);
  }

  // 7. Test d'accès pour Bruce
  console.log("\n🧪 Test d'accès pour Bruce:");
  if (bruceMembership?.role === "learner" && feature?.is_enabled === true) {
    console.log("✅ Bruce devrait avoir accès (learner + feature activée)");
  } else {
    console.log("❌ Bruce n'a PAS accès");
    console.log("   - Role:", bruceMembership?.role);
    console.log("   - Feature enabled:", feature?.is_enabled);
  }
}

testAccess().catch(console.error);

