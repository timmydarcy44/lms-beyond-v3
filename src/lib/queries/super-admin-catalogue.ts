import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

export type CatalogItemForSuperAdmin = {
  id: string;
  item_type: "module" | "parcours" | "ressource" | "test";
  content_id: string;
  title: string;
  description: string | null;
  short_description: string | null;
  hero_image_url: string | null;
  thumbnail_url: string | null;
  price: number;
  is_free: boolean;
  category: string | null;
  thematique: string | null;
  duration: string | null;
  level: string | null;
  target_audience?: "pro" | "apprenant" | "all";
  created_by: string;
};

/**
 * Récupère les items du catalogue créés par un Super Admin spécifique (par email)
 */
export async function getCatalogItemsByCreatorEmail(
  creatorEmail: string
): Promise<CatalogItemForSuperAdmin[]> {
  const supabase = await getServiceRoleClientOrFallback();

  if (!supabase) {
    return [];
  }

  // D'abord, récupérer l'ID de l'utilisateur depuis son email
  const { data: creatorProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", creatorEmail)
    .eq("role", "super_admin")
    .single();

  if (profileError || !creatorProfile) {
    console.error("[super-admin-catalogue] Error finding creator:", profileError);
    return [];
  }

  // Récupérer les items du catalogue créés par cet utilisateur
  const { data: items, error } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("created_by", creatorProfile.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[super-admin-catalogue] Error fetching catalog items:", error);
    return [];
  }

  return (items || []) as CatalogItemForSuperAdmin[];
}

/**
 * Récupère tous les items du catalogue pour le Super Admin
 */
export async function getCatalogItemsForSuperAdmin(): Promise<CatalogItemForSuperAdmin[]> {
  const supabase = await getServiceRoleClientOrFallback();

  if (!supabase) {
    return [];
  }

  // Récupérer tous les items actifs du catalogue
  const { data: items, error } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[super-admin-catalogue] Error fetching catalog items:", error);
    return [];
  }

  return (items || []) as CatalogItemForSuperAdmin[];
}
