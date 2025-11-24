import { getServiceRoleClient } from "@/lib/supabase/server";
import RessourcesPageClient from "./page-client";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const JESSICA_CONTENTIN_UUID = "17364229-fe78-4986-ac69-41b880e34631"; // UUID direct de Jessica Contentin

export default async function RessourcesPage() {
  // Utiliser le service role client pour éviter les problèmes de cookies
  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.warn("[RessourcesPage] Supabase client is null");
    return <RessourcesPageClient initialItems={[]} userFirstName={null} />;
  }

  // Récupérer l'ID de Jessica Contentin (utiliser l'UUID direct si disponible)
  let jessicaProfileId = JESSICA_CONTENTIN_UUID;
  
  const { data: jessicaProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();

  if (jessicaProfile) {
    jessicaProfileId = jessicaProfile.id;
    console.log("[RessourcesPage] Found Jessica Contentin profile:", {
      id: jessicaProfile.id,
      email: jessicaProfile.email,
      matchesUUID: jessicaProfile.id === JESSICA_CONTENTIN_UUID,
    });
  } else {
    console.warn("[RessourcesPage] Jessica Contentin profile not found by email, using UUID directly:", JESSICA_CONTENTIN_UUID);
  }

  // Vérifier que l'UUID existe bien dans la base
  const { data: uuidCheck } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", jessicaProfileId)
    .maybeSingle();

  if (!uuidCheck) {
    console.error("[RessourcesPage] ERROR: UUID", jessicaProfileId, "does not exist in profiles table!");
    return <RessourcesPageClient initialItems={[]} userFirstName={null} />;
  }

  console.log("[RessourcesPage] Using Jessica Contentin ID:", jessicaProfileId);

  // Récupérer l'utilisateur connecté (optionnel) - utiliser getServerClient pour l'auth
  let userFirstName: string | null = null;
  try {
    const { getServerClient } = await import("@/lib/supabase/server");
    const authClient = await getServerClient();
    if (authClient) {
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
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
  } catch (error) {
    // Ignorer les erreurs d'auth pour cette page publique
    console.log("[RessourcesPage] Could not get user (non-blocking):", error);
  }

  // Requête directe pour vérifier les items dans la base
  // Utiliser le service role client qui bypass RLS
  const { data: directItems, error: directError } = await supabase
    .from("catalog_items")
    .select("id, title, item_type, is_active, target_audience, creator_id, content_id")
    .eq("creator_id", jessicaProfileId)
    .eq("is_active", true);
  
  console.log("[RessourcesPage] Direct query result:", {
    directItemsCount: directItems?.length || 0,
    directError: directError?.message,
    jessicaProfileId: jessicaProfileId,
    items: directItems?.map(item => ({
      id: item.id,
      title: item.title,
      item_type: item.item_type,
      target_audience: item.target_audience,
    })),
  });

  // Utiliser directement la requête Supabase pour éviter les problèmes de cookies
  // Enrichir les items avec les données des tables resources, courses, tests
  let filteredItems: any[] = [];
  
  if (directItems && directItems.length > 0) {
    // Enrichir chaque item avec les données de sa table respective
    const enrichedItems = await Promise.all(
      directItems.map(async (item: any) => {
        let enrichedItem: any = {
          id: item.id,
          item_type: item.item_type,
          content_id: item.content_id || item.id,
          title: item.title,
          description: null,
          short_description: null,
          hero_image_url: null,
          thumbnail_url: null,
          price: 0,
          is_free: false,
          category: null,
          thematique: null,
          duration: null,
          level: null,
          target_audience: item.target_audience,
          access_status: "pending_payment" as const,
          creator_id: item.creator_id,
        };

        // Enrichir selon le type d'item
        if (item.item_type === "ressource" && item.content_id) {
          const { data: resource } = await supabase
            .from("resources")
            .select("id, title, description, price, category, hero_image_url, thumbnail_url, cover_url, file_url")
            .eq("id", item.content_id)
            .maybeSingle();
          
          if (resource) {
            enrichedItem.description = resource.description;
            enrichedItem.price = resource.price || 0;
            enrichedItem.is_free = !resource.price || resource.price === 0;
            enrichedItem.category = resource.category;
            enrichedItem.hero_image_url = resource.hero_image_url || resource.thumbnail_url || resource.cover_url;
            enrichedItem.thumbnail_url = resource.thumbnail_url || resource.hero_image_url || resource.cover_url;
          }
        } else if (item.item_type === "module" && item.content_id) {
          const { data: course } = await supabase
            .from("courses")
            .select("id, title, description, price, category, hero_image_url, thumbnail_url, cover_image")
            .eq("id", item.content_id)
            .maybeSingle();
          
          if (course) {
            enrichedItem.description = course.description;
            enrichedItem.price = course.price || 0;
            enrichedItem.is_free = !course.price || course.price === 0;
            enrichedItem.category = course.category;
            enrichedItem.hero_image_url = course.hero_image_url || course.thumbnail_url || course.cover_image;
            enrichedItem.thumbnail_url = course.thumbnail_url || course.hero_image_url || course.cover_image;
          }
        } else if (item.item_type === "test" && item.content_id) {
          const { data: test } = await supabase
            .from("tests")
            .select("id, title, description, price, category, hero_image_url, thumbnail_url, cover_image")
            .eq("id", item.content_id)
            .maybeSingle();
          
          if (test) {
            enrichedItem.description = test.description;
            enrichedItem.price = test.price || 0;
            enrichedItem.is_free = !test.price || test.price === 0;
            enrichedItem.category = test.category;
            enrichedItem.hero_image_url = test.hero_image_url || test.thumbnail_url || test.cover_image;
            enrichedItem.thumbnail_url = test.thumbnail_url || test.hero_image_url || test.cover_image;
          }
        }

        // Récupérer aussi les données du catalog_item pour compléter
        const { data: catalogItem } = await supabase
          .from("catalog_items")
          .select("id, title, description, short_description, hero_image_url, thumbnail_url, price, is_free, category, stripe_checkout_url")
          .eq("id", item.id)
          .maybeSingle();
        
        if (catalogItem) {
          enrichedItem.title = catalogItem.title || enrichedItem.title;
          enrichedItem.description = catalogItem.description || enrichedItem.description;
          enrichedItem.short_description = catalogItem.short_description;
          enrichedItem.hero_image_url = catalogItem.hero_image_url || enrichedItem.hero_image_url;
          enrichedItem.thumbnail_url = catalogItem.thumbnail_url || enrichedItem.thumbnail_url;
          enrichedItem.price = catalogItem.price || enrichedItem.price;
          enrichedItem.is_free = catalogItem.is_free !== undefined ? catalogItem.is_free : enrichedItem.is_free;
          enrichedItem.category = catalogItem.category || enrichedItem.category;
          enrichedItem.stripe_checkout_url = catalogItem.stripe_checkout_url;
        }

        return enrichedItem;
      })
    );

    filteredItems = enrichedItems;
  }

  console.log("[RessourcesPage] Final enriched items count:", filteredItems.length);

  // Sérialiser les items pour éviter les problèmes de sérialisation Next.js
  // Enlever les propriétés non sérialisables et s'assurer que tout est JSON-safe
  const serializedItems = filteredItems.map((item) => ({
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
    thematique: item.thematique || null,
    duration: item.duration || null,
    level: item.level || null,
    target_audience: (item as any).target_audience || null,
    access_status: item.access_status || "pending_payment",
    stripe_checkout_url: (item as any).stripe_checkout_url || null,
    creator_id: (item as any).creator_id || null,
  }));

  console.log("[RessourcesPage] Serialized items count:", serializedItems.length);

  return (
    <RessourcesPageClient 
      initialItems={serializedItems as any} 
      userFirstName={userFirstName}
    />
  );
}

