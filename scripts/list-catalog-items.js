const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://fqqqejpakbccwvrlolpc.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, key);

async function main() {
  const { data, error } = await supabase
    .from("catalog_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  console.log({ error });
  if (data) {
    console.log("Keys:", Object.keys(data[0] || {}));
    data.forEach((item) => {
      console.log(
        JSON.stringify(
          {
            id: item.id,
            item_type: item.item_type,
            content_id: item.content_id,
            title: item.title,
            description: item.description,
            short_description: item.short_description,
            creator_id: item.creator_id,
            is_active: item.is_active,
            target_audience: item.target_audience,
            category: item.category,
            thematique: item.thematique,
            price: item.price,
            hero_image_url: item.hero_image_url,
            thumbnail_url: item.thumbnail_url,
            is_featured: item.is_featured,
            order_index: item.order_index,
            created_at: item.created_at,
          },
          null,
          2,
        ),
      );
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});


