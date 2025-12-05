import { Suspense } from "react";
import { getServiceRoleClient } from "@/lib/supabase/server";
import RessourcesPageClient from "./page-client";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const JESSICA_CONTENTIN_UUID = "17364229-fe78-4986-ac69-41b880e34631"; // UUID direct de Jessica Contentin

// Fonction fallback utilisant l'ancienne méthode (requêtes multiples)
async function getCatalogItemsFallback(supabase: any, userId: string | null) {
  // Récupérer les items du catalogue
  const { data: directItems } = await supabase
    .from("catalog_items")
    .select("id, title, item_type, is_active, target_audience, creator_id, content_id, description, short_description, hero_image_url, thumbnail_url, price, is_free, category, stripe_checkout_url")
    .eq("created_by", JESSICA_CONTENTIN_UUID)
    .eq("is_active", true);

  if (!directItems || directItems.length === 0) {
    return [];
  }

  // Enrichir chaque item
  const enrichedItems = await Promise.all(
    directItems.map(async (item: any) => {
      let enrichedItem: any = {
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
        access_status: "pending_payment" as const,
        stripe_checkout_url: item.stripe_checkout_url || null,
      };

      // Enrichir selon le type d'item
      if (item.item_type === "ressource" && item.content_id) {
        const { data: resource } = await supabase
          .from("resources")
          .select("id, title, description, price, category, thumbnail_url, cover_url")
          .eq("id", item.content_id)
          .maybeSingle();
        
        if (resource) {
          enrichedItem.description = enrichedItem.description || resource.description;
          enrichedItem.price = enrichedItem.price || resource.price || 0;
          enrichedItem.is_free = !enrichedItem.price || enrichedItem.price === 0;
          enrichedItem.category = enrichedItem.category || resource.category;
          enrichedItem.hero_image_url = enrichedItem.hero_image_url || resource.cover_url || resource.thumbnail_url;
          enrichedItem.thumbnail_url = enrichedItem.thumbnail_url || resource.thumbnail_url || resource.cover_url;
        }
      } else if (item.item_type === "module" && item.content_id) {
        const { data: course } = await supabase
          .from("courses")
          .select("id, title, description, price, category, hero_image_url, thumbnail_url, cover_image")
          .eq("id", item.content_id)
          .maybeSingle();
        
        if (course) {
          enrichedItem.description = enrichedItem.description || course.description;
          enrichedItem.price = enrichedItem.price || course.price || 0;
          enrichedItem.is_free = !enrichedItem.price || enrichedItem.price === 0;
          enrichedItem.category = enrichedItem.category || course.category;
          enrichedItem.hero_image_url = enrichedItem.hero_image_url || course.hero_image_url || course.thumbnail_url || course.cover_image;
          enrichedItem.thumbnail_url = enrichedItem.thumbnail_url || course.thumbnail_url || course.hero_image_url || course.cover_image;
        }
      } else if (item.item_type === "test" && item.content_id) {
        const { data: test } = await supabase
          .from("tests")
          .select("id, title, description, price, category, hero_image_url, thumbnail_url, cover_image")
          .eq("id", item.content_id)
          .maybeSingle();
        
        if (test) {
          enrichedItem.description = enrichedItem.description || test.description;
          enrichedItem.price = enrichedItem.price || test.price || 0;
          enrichedItem.is_free = !enrichedItem.price || enrichedItem.price === 0;
          enrichedItem.category = enrichedItem.category || test.category;
          enrichedItem.hero_image_url = enrichedItem.hero_image_url || test.hero_image_url || test.thumbnail_url || test.cover_image;
          enrichedItem.thumbnail_url = enrichedItem.thumbnail_url || test.thumbnail_url || test.hero_image_url || test.cover_image;
        }
      }

      // Vérifier l'accès utilisateur
      if (userId) {
        const { data: access } = await supabase
          .from("catalog_access")
          .select("access_status")
          .eq("catalog_item_id", item.id)
          .eq("user_id", userId)
          .in("access_status", ["purchased", "manually_granted", "free"])
          .maybeSingle();
        
        if (access) {
          enrichedItem.access_status = access.access_status;
        } else if (enrichedItem.is_free) {
          enrichedItem.access_status = "free";
        }
      } else if (enrichedItem.is_free) {
        enrichedItem.access_status = "free";
      }

      return enrichedItem;
    })
  );

  return enrichedItems;
}

// Fonction avec cache pour récupérer les items du catalogue
// Cache de 5 minutes pour réduire drastiquement les requêtes DB
async function getCachedCatalogItems(userId: string | null) {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.warn("[RessourcesPage] Supabase client is null");
    return [];
  }

  try {
    // Utiliser la fonction SQL optimisée qui fait tout en une seule requête
    // au lieu de 60-80 requêtes multiples
    const { data, error } = await supabase.rpc('get_jessica_catalog_items', {
      user_id_param: userId || null
    });

    if (error) {
      // Ne pas logger l'erreur si c'est juste que la fonction n'existe pas encore
      // (elle sera créée via le script SQL)
      if (error.code !== '42883') { // 42883 = function does not exist
        console.error("[RessourcesPage] Error calling get_jessica_catalog_items:", error);
      }
      // Fallback : utiliser l'ancienne méthode avec requêtes multiples
      console.log("[RessourcesPage] Falling back to old method...");
      return await getCatalogItemsFallback(supabase, userId);
    }

    return data || [];
  } catch (error) {
    console.error("[RessourcesPage] Exception calling get_jessica_catalog_items:", error);
    // Fallback : utiliser l'ancienne méthode
    console.log("[RessourcesPage] Falling back to old method due to exception...");
    return await getCatalogItemsFallback(supabase, userId);
  }
}

// Désactiver le cache pour éviter l'erreur 2MB
// Les index SQL et la fonction optimisée suffisent pour les performances
// const getCachedItems = unstable_cache(
//   getCachedCatalogItems,
//   ['jessica-catalog-items'],
//   { revalidate: 300 }
// );

export default async function RessourcesPage() {
  // Récupérer l'utilisateur connecté (optionnel)
  let userFirstName: string | null = null;
  let userId: string | null = null;
  
  try {
    const { getServerClient } = await import("@/lib/supabase/server");
    const authClient = await getServerClient();
    if (authClient) {
      const { data: { user } } = await authClient.auth.getUser();
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
  } catch (error) {
    // Ignorer les erreurs d'auth pour cette page publique
    console.log("[RessourcesPage] Could not get user (non-blocking):", error);
  }

  // Récupérer les items (1 seule requête optimisée au lieu de 60-80)
  // Cache désactivé car les données peuvent dépasser 2MB
  // Les index SQL et la fonction optimisée suffisent pour les performances
  const items = await getCachedCatalogItems(userId);

  console.log("[RessourcesPage] Retrieved items count:", items.length, "with cache");

  // Sérialiser les items pour éviter les problèmes de sérialisation Next.js
  const serializedItems = items.map((item: any) => ({
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
    thematique: null, // Pas dans la fonction SQL pour l'instant
    duration: null, // Pas dans la fonction SQL pour l'instant
    level: null, // Pas dans la fonction SQL pour l'instant
    target_audience: item.target_audience || null,
    access_status: item.access_status || "pending_payment",
    stripe_checkout_url: item.stripe_checkout_url || null,
    creator_id: null, // Pas nécessaire dans la réponse
  }));

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6A664]"></div>
      </div>
    }>
      <RessourcesPageClient 
        initialItems={serializedItems as any} 
        userFirstName={userFirstName}
      />
    </Suspense>
  );
}

