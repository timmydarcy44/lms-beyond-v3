const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://fqqqejpakbccwvrlolpc.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, key);

const SOFT_SKILLS_TEST_BASE = {
  slug: "soft-skills-profil-360",
  title: "Soft Skills – Profil 360",
  description:
    "Évaluez 10 dimensions clés des soft skills (gestion du stress, communication, collaboration, créativité, leadership…) et obtenez un classement personnalisé.",
  status: "published",
  published: true,
  kind: "quiz",
  duration_minutes: 25,
  display_format: "ranking",
  category: "soft_skills",
  evaluation_type: "questionnaire",
  skills: "soft skills, communication, adaptabilité, leadership, collaboration",
  price: 0,
  org_id: "33e9a355-9e75-4151-83b9-dda09e83a70d",
  created_by: "60c88469-3c53-417f-a81d-565a662ad2f5",
  owner_id: "60c88469-3c53-417f-a81d-565a662ad2f5",
  builder_snapshot: {
    version: "soft-skills-v1",
    questionnaireType: "mental_health",
    questionnaireTitle: "Soft Skills – Profil 360",
    questionnaireSlug: "soft-skills-profil-360",
    questionnaireId: "deb25da7-c6e5-4b95-9c89-8abba2a75153",
    dimensions: [
      "gestion_emotions_stress",
      "communication_influence",
      "perseverance_action",
      "organisation_priorites",
      "empathie_ecoute_active",
      "resolution_problemes",
      "collaboration_conflits",
      "creativite_adaptabilite",
      "leadership_vision",
      "confiance_decision",
    ],
  },
};

async function main() {
  const testPayload = { ...SOFT_SKILLS_TEST_BASE };

  const { data: existing } = await supabase
    .from("tests")
    .select("id")
    .eq("slug", SOFT_SKILLS_TEST.slug)
    .maybeSingle();

  if (existing?.id) {
    console.log(`[insert-soft-skills-test] Un test existe déjà (id=${existing.id}), mise à jour…`);
    const { error } = await supabase
      .from("tests")
      .update(SOFT_SKILLS_TEST)
      .eq("id", existing.id);
    if (error) {
      console.error("[insert-soft-skills-test] Erreur mise à jour", error);
      process.exit(1);
    }
    console.log("[insert-soft-skills-test] Test mis à jour.");
    return;
  }

  const { data, error } = await supabase
    .from("tests")
    .insert(SOFT_SKILLS_TEST)
    .select("id")
    .single();

  if (error) {
    console.error("[insert-soft-skills-test] Erreur insertion", error);
    process.exit(1);
  }

  console.log("[insert-soft-skills-test] Test créé :", data.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


