const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://fqqqejpakbccwvrlolpc.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TIM_SUPER_ADMIN_ID = "60c88469-3c53-417f-a81d-565a662ad2f5";

if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, key);

async function main() {
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("id, title, description, kind, price, display_format")
    .eq("slug", "soft-skills-profil-360")
    .maybeSingle();

  if (testError || !test) {
    console.error("[insert-soft-skills-catalog-item] Test introuvable", testError);
    process.exit(1);
  }

  const payload = {
    item_type: "test",
    content_id: test.id,
    title: test.title,
    description:
      test.description ??
      "Diagnostic complet des soft skills (gestion du stress, communication, collaboration, leadership…).",
    short_description:
      "Évaluation rapide de 10 dimensions de soft skills avec recommandations personnalisées.",
    hero_image_url: null,
    thumbnail_url: null,
    price: test.price ?? 0,
    is_free: (test.price ?? 0) === 0,
    currency: "EUR",
    category: "Soft skills",
    thematique: "Soft skills",
    target_audience: "all",
    is_active: true,
    is_featured: false,
    creator_id: TIM_SUPER_ADMIN_ID,
    created_by: TIM_SUPER_ADMIN_ID,
  };

  const { data: existing, error: existingError } = await supabase
    .from("catalog_items")
    .select("id")
    .eq("item_type", "test")
    .eq("content_id", test.id)
    .maybeSingle();

  if (existingError) {
    console.error("[insert-soft-skills-catalog-item] Erreur lecture", existingError);
    process.exit(1);
  }

  if (existing?.id) {
    const { error } = await supabase
      .from("catalog_items")
      .update(payload)
      .eq("id", existing.id);

    if (error) {
      console.error("[insert-soft-skills-catalog-item] Erreur mise à jour", error);
      process.exit(1);
    }

    console.log("[insert-soft-skills-catalog-item] Catalogue mis à jour.", existing.id);
    return;
  }

  const { data: inserted, error } = await supabase
    .from("catalog_items")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("[insert-soft-skills-catalog-item] Erreur insertion", error);
    process.exit(1);
  }

  console.log("[insert-soft-skills-catalog-item] Item ajouté au catalogue", inserted.id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


