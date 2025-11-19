import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les IDs des contenus du catalogue auxquels l'organisation a accès
 */
export async function getOrganizationCatalogAccess(organizationId: string): Promise<{
  courses: string[];
  paths: string[];
  resources: string[];
  tests: string[];
}> {
  const supabase = await getServerClient();

  if (!supabase) {
    return { courses: [], paths: [], resources: [], tests: [] };
  }

  const { data: accesses, error } = await supabase
    .from("catalog_access")
    .select(`
      catalog_item_id,
      catalog_items:catalog_item_id (
        item_type,
        content_id
      )
    `)
    .eq("organization_id", organizationId)
    .in("access_status", ["purchased", "manually_granted", "free"]);

  if (error) {
    console.error("[catalogue-access] Error fetching access:", error);
    return { courses: [], paths: [], resources: [], tests: [] };
  }

  const result = {
    courses: [] as string[],
    paths: [] as string[],
    resources: [] as string[],
    tests: [] as string[],
  };

  accesses?.forEach((access: any) => {
    const item = access.catalog_items;
    if (!item) return;

    const contentId = item.content_id;
    switch (item.item_type) {
      case "module":
        result.courses.push(contentId);
        break;
      case "parcours":
        result.paths.push(contentId);
        break;
      case "ressource":
        result.resources.push(contentId);
        break;
      case "test":
        result.tests.push(contentId);
        break;
    }
  });

  return result;
}

/**
 * Vérifie si un contenu spécifique est accessible via le catalogue
 */
export async function hasCatalogAccess(
  organizationId: string,
  contentId: string,
  contentType: "module" | "parcours" | "ressource" | "test"
): Promise<boolean> {
  const supabase = await getServerClient();

  if (!supabase) {
    return false;
  }

  const { data: access, error } = await supabase
    .from("catalog_access")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("catalog_items:catalog_item_id(content_id)", contentId)
    .eq("catalog_items:catalog_item_id(item_type)", contentType)
    .in("access_status", ["purchased", "manually_granted", "free"])
    .single();

  if (error || !access) {
    return false;
  }

  return true;
}

