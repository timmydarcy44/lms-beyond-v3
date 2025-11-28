/**
 * Script pour créer le compte de test Bruce Wayne (demo@beyondcenter.fr)
 * avec des données mockées pour Beyond Care (apprenant et entreprise)
 * 
 * Usage:
 *   node scripts/create-bruce-wayne-beyond-care.js
 * 
 * Prérequis:
 *   - Avoir SUPABASE_SERVICE_ROLE_KEY dans .env.local
 *   - Avoir NEXT_PUBLIC_SUPABASE_URL dans .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Variables d'environnement manquantes:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL:", !!SUPABASE_URL);
  console.error("   - SUPABASE_SERVICE_ROLE_KEY:", !!SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEMO_USER = {
  email: "demo@beyondcenter.fr",
  password: "Demo123!@#",
  fullName: "Bruce Wayne",
  firstName: "Bruce",
  lastName: "Wayne",
  phone: "+33612345678",
  role: "learner",
};

const DEMO_ADMIN = {
  email: "admin@beyondcenter.fr",
  password: "Admin123!@#",
  fullName: "Alfred Pennyworth",
  firstName: "Alfred",
  lastName: "Pennyworth",
  phone: "+33612345679",
  role: "admin",
};

const DEMO_ORG = {
  name: "Beyond Center Demo",
  slug: "beyond-center-demo",
};

async function createUser() {
  console.log("🚀 Création du compte de test Bruce Wayne...\n");

  try {
    // Vérifier si l'utilisateur existe déjà
    let userId;
    let existingUser = null;
    
    try {
      const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && existingUsers?.users) {
        existingUser = existingUsers.users.find((u) => u.email === DEMO_USER.email);
      }
    } catch (err) {
      console.log(`   ⚠️  Impossible de lister les utilisateurs, tentative de création...`);
    }

    if (existingUser) {
      console.log(`⚠️  L'utilisateur ${DEMO_USER.email} existe déjà (ID: ${existingUser.id})`);
      userId = existingUser.id;

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: DEMO_USER.password,
        user_metadata: {
          full_name: DEMO_USER.fullName,
          first_name: DEMO_USER.firstName,
          last_name: DEMO_USER.lastName,
        },
      });

      if (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`);
      } else {
        console.log(`   ✅ Mot de passe mis à jour`);
      }
    } else {
      // Créer l'utilisateur
      const { data, error } = await supabase.auth.admin.createUser({
        email: DEMO_USER.email,
        password: DEMO_USER.password,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_USER.fullName,
          first_name: DEMO_USER.firstName,
          last_name: DEMO_USER.lastName,
        },
      });

      if (error) {
        if (error.code === 'email_exists' || error.message.includes('already been registered')) {
          // L'utilisateur existe mais n'a pas été trouvé dans la liste, récupérer son ID
          console.log(`⚠️  L'utilisateur existe déjà, récupération de l'ID...`);
          const { data: users } = await supabase.auth.admin.listUsers();
          const foundUser = users?.users?.find((u) => u.email === DEMO_USER.email);
          if (foundUser) {
            userId = foundUser.id;
            console.log(`   ✅ Utilisateur trouvé (ID: ${userId})`);
            
            // Mettre à jour le mot de passe
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
              password: DEMO_USER.password,
              user_metadata: {
                full_name: DEMO_USER.fullName,
                first_name: DEMO_USER.firstName,
                last_name: DEMO_USER.lastName,
              },
            });
            if (!updateError) {
              console.log(`   ✅ Mot de passe mis à jour`);
            }
          } else {
            throw error;
          }
        } else {
          console.error(`❌ Erreur lors de la création: ${error.message}`);
          throw error;
        }
      } else {
        userId = data.user.id;
        console.log(`✅ Utilisateur créé (ID: ${userId})`);
      }
    }

    // Créer ou mettre à jour le profil
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: DEMO_USER.email,
        full_name: DEMO_USER.fullName,
        first_name: DEMO_USER.firstName,
        last_name: DEMO_USER.lastName,
        phone: DEMO_USER.phone,
        role: DEMO_USER.role,
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      console.error(`❌ Erreur lors de la création du profil: ${profileError.message}`);
      throw profileError;
    }

    console.log(`✅ Profil créé/mis à jour`);

    return userId;
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    throw error;
  }
}

async function createAdminUser() {
  console.log("\n👔 Création du compte admin (Alfred Pennyworth)...\n");

  try {
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_ADMIN.email);

    let adminId;

    if (existingUser) {
      console.log(`⚠️  L'utilisateur admin ${DEMO_ADMIN.email} existe déjà (ID: ${existingUser.id})`);
      adminId = existingUser.id;

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.admin.updateUserById(adminId, {
        password: DEMO_ADMIN.password,
        user_metadata: {
          full_name: DEMO_ADMIN.fullName,
          first_name: DEMO_ADMIN.firstName,
          last_name: DEMO_ADMIN.lastName,
        },
      });

      if (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour: ${updateError.message}`);
      } else {
        console.log(`   ✅ Mot de passe mis à jour`);
      }
    } else {
      // Créer l'utilisateur admin
      const { data, error } = await supabase.auth.admin.createUser({
        email: DEMO_ADMIN.email,
        password: DEMO_ADMIN.password,
        email_confirm: true,
        user_metadata: {
          full_name: DEMO_ADMIN.fullName,
          first_name: DEMO_ADMIN.firstName,
          last_name: DEMO_ADMIN.lastName,
        },
      });

      if (error) {
        console.error(`❌ Erreur lors de la création: ${error.message}`);
        throw error;
      }

      adminId = data.user.id;
      console.log(`✅ Utilisateur admin créé (ID: ${adminId})`);
    }

    // Créer ou mettre à jour le profil admin
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: adminId,
        email: DEMO_ADMIN.email,
        full_name: DEMO_ADMIN.fullName,
        first_name: DEMO_ADMIN.firstName,
        last_name: DEMO_ADMIN.lastName,
        phone: DEMO_ADMIN.phone,
        role: DEMO_ADMIN.role,
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      console.error(`❌ Erreur lors de la création du profil admin: ${profileError.message}`);
      throw profileError;
    }

    console.log(`✅ Profil admin créé/mis à jour`);

    return adminId;
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    throw error;
  }
}

async function createOrganization(userId, adminId) {
  console.log("\n🏢 Création de l'organisation de test...\n");

  try {
    // Vérifier si l'organisation existe déjà
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("slug", DEMO_ORG.slug)
      .maybeSingle();

    let orgId;

    if (existingOrg) {
      console.log(`⚠️  L'organisation existe déjà (ID: ${existingOrg.id})`);
      orgId = existingOrg.id;
    } else {
      // Créer l'organisation
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: DEMO_ORG.name,
          slug: DEMO_ORG.slug,
        })
        .select("id")
        .single();

      if (orgError) {
        console.error(`❌ Erreur lors de la création de l'organisation: ${orgError.message}`);
        throw orgError;
      }

      orgId = org.id;
      console.log(`✅ Organisation créée (ID: ${orgId})`);
    }

    // Ajouter l'utilisateur à l'organisation en tant qu'apprenant
    const { error: membershipError } = await supabase.from("org_memberships").upsert(
      {
        org_id: orgId,
        user_id: userId,
        role: "learner",
      },
      {
        onConflict: "org_id,user_id",
      }
    );

    if (membershipError) {
      console.error(`❌ Erreur lors de l'ajout à l'organisation: ${membershipError.message}`);
      throw membershipError;
    }

    console.log(`✅ Utilisateur ajouté à l'organisation en tant qu'apprenant`);

    // Ajouter l'admin à l'organisation en tant qu'admin
    const { error: adminMembershipError } = await supabase.from("org_memberships").upsert(
      {
        org_id: orgId,
        user_id: adminId,
        role: "admin",
      },
      {
        onConflict: "org_id,user_id",
      }
    );

    if (adminMembershipError) {
      console.error(`❌ Erreur lors de l'ajout de l'admin à l'organisation: ${adminMembershipError.message}`);
      throw adminMembershipError;
    }

    console.log(`✅ Admin ajouté à l'organisation en tant qu'admin`);

    // Activer Beyond Care pour l'organisation
    const { error: featureError } = await supabase.from("organization_features").upsert(
      {
        org_id: orgId,
        feature_key: "beyond_care",
        is_enabled: true,
        enabled_at: new Date().toISOString(),
        enabled_by: adminId,
      },
      {
        onConflict: "org_id,feature_key",
      }
    );

    if (featureError) {
      console.error(`❌ Erreur lors de l'activation de Beyond Care: ${featureError.message}`);
      throw featureError;
    }

    console.log(`✅ Beyond Care activé pour l'organisation`);

    return orgId;
  } catch (error) {
    console.error("❌ Erreur inattendue:", error);
    throw error;
  }
}

console.log("📋 Résumé:");
console.log(`   Apprenant:`);
console.log(`     Email: ${DEMO_USER.email}`);
console.log(`     Mot de passe: ${DEMO_USER.password}`);
console.log(`     Nom: ${DEMO_USER.fullName}`);
console.log(`   Admin:`);
console.log(`     Email: ${DEMO_ADMIN.email}`);
console.log(`     Mot de passe: ${DEMO_ADMIN.password}`);
console.log(`     Nom: ${DEMO_ADMIN.fullName}`);
console.log(`   Organisation: ${DEMO_ORG.name}`);
console.log("\n");

createUser()
  .then((userId) => createAdminUser().then((adminId) => ({ userId, adminId })))
  .then(({ userId, adminId }) => createOrganization(userId, adminId))
  .then((orgId) => {
    console.log("\n✅ Comptes de test créés avec succès !");
    console.log("\n📝 Prochaines étapes:");
    console.log("   1. Exécutez le script SQL: supabase/CREATE_BRUCE_WAYNE_BEYOND_CARE_DATA.sql");
    console.log("   2. Les données mockées (questionnaires, réponses, indicateurs) seront créées");
    console.log("\n🔑 Identifiants de connexion:");
    console.log(`   Apprenant:`);
    console.log(`     Email: ${DEMO_USER.email}`);
    console.log(`     Mot de passe: ${DEMO_USER.password}`);
    console.log(`   Admin (Entreprise):`);
    console.log(`     Email: ${DEMO_ADMIN.email}`);
    console.log(`     Mot de passe: ${DEMO_ADMIN.password}`);
    console.log("\n✨ Vous pouvez maintenant vous connecter et accéder à Beyond Care !");
  })
  .catch((error) => {
    console.error("\n❌ Échec de la création:", error);
    process.exit(1);
  });

