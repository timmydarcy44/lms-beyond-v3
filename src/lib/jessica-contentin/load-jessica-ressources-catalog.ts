import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_UUID = "17364229-fe78-4986-ac69-41b880e34631";

async function getCatalogItemsFallback(supabase: ReturnType<typeof getServiceRoleClient>, userId: string | null) {
  if (!supabase) return [];

  const { data: directItems } = await supabase
    .from("catalog_items")
    .select(
      "id, title, item_type, is_active, target_audience, creator_id, content_id, description, short_description, hero_image_url, thumbnail_url, price, is_free, category, stripe_checkout_url",
    )
    .eq("created_by", JESSICA_CONTENTIN_UUID)
    .eq("is_active", true);

  if (!directItems?.length) return [];

  return Promise.all(
    directItems.map(async (item) => {
      const enrichedItem: Record<string, unknown> = {
        id: item.id,
        item_type: item.item_type,
        content_id: item.content_id || item.id,
        title: item.title,
        description: item.description || null,
        short_description: item.short_description || null,
        hero_image_url: item.hero_image_url || null,
        thumbnail_url: item.thumbnail_url || null,
        price: item.price || 0,
        is_free: item.is_free || false,
        category: item.category || null,
        target_audience: item.target_audience || null,
        access_status: "pending_payment",
        stripe_checkout_url: item.stripe_checkout_url || null,
      };

      if (item.item_type === "ressource" && item.content_id) {
        const { data: resource } = await supabase
          .from("resources")
          .select("id, title, description, price, thumbnail_url, cover_url, slug")
          .eq("id", item.content_id)
          .maybeSingle();
        if (resource) {
          enrichedItem.description = enrichedItem.description || resource.description;
          enrichedItem.price = enrichedItem.price || resource.price || 0;
          enrichedItem.is_free = !enrichedItem.price || enrichedItem.price === 0;
          enrichedItem.hero_image_url = enrichedItem.hero_image_url || resource.cover_url || resource.thumbnail_url;
          enrichedItem.thumbnail_url = enrichedItem.thumbnail_url || resource.thumbnail_url || resource.cover_url;
          enrichedItem.slug = resource.slug;
        }
      }

      if (userId) {
        const { data: access } = await supabase
          .from("catalog_access")
          .select("access_status")
          .eq("catalog_item_id", item.id)
          .eq("user_id", userId)
          .in("access_status", ["purchased", "manually_granted", "free"])
          .maybeSingle();
        if (access) enrichedItem.access_status = access.access_status;
        else if (enrichedItem.is_free) enrichedItem.access_status = "free";
      } else if (enrichedItem.is_free) {
        enrichedItem.access_status = "free";
      }

      return enrichedItem;
    }),
  );
}

async function getCachedCatalogItems(userId: string | null) {
  const supabase = getServiceRoleClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.rpc("get_jessica_catalog_items", {
      user_id_param: userId || null,
    });
    if (error) {
      if (error.code !== "42883") {
        console.error("[loadJessicaRessourcesCatalog]", error);
      }
      return getCatalogItemsFallback(supabase, userId);
    }
    return data || [];
  } catch {
    return getCatalogItemsFallback(supabase, userId);
  }
}

export async function loadJessicaRessourcesCatalog() {
  let userFirstName: string | null = null;
  let userId: string | null = null;

  try {
    const { getServerClient } = await import("@/lib/supabase/server");
    const authClient = await getServerClient();
    if (authClient) {
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (user) {
        userId = user.id;
        const supabase = getServiceRoleClient();
        if (supabase) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", user.id)
            .maybeSingle();
          if (profile) {
            const { getUserName } = await import("@/lib/utils/user-name");
            userFirstName = getUserName(profile.full_name || profile.email || user.email || "");
          }
        }
      }
    }
  } catch {
    // page publique
  }

  const items = await getCachedCatalogItems(userId);
  const serializedItems = items.map((item: Record<string, unknown>) => ({
    id: item.id,
    item_type: item.item_type,
    content_id: item.content_id,
    title: item.title,
    description: item.description || null,
    short_description: item.short_description || null,
    hero_image_url: item.hero_image_url || null,
    thumbnail_url: item.thumbnail_url || null,
    price: item.price || 0,
    is_free: item.is_free || false,
    category: item.category || null,
    thematique: null,
    duration: null,
    level: null,
    target_audience: item.target_audience || null,
    access_status: item.access_status || "pending_payment",
    stripe_checkout_url: item.stripe_checkout_url || null,
    slug: item.slug || null,
    created_by: item.created_by || null,
  }));

  return { serializedItems, userFirstName };
}
