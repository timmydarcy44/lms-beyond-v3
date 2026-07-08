"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { fetchJessicaAssignableCatalogItems } from "@/lib/jessica-contentin/sync-jessica-catalog";

export type JessicaResource = {
  id: string;
  title: string;
  item_type: "module" | "ressource" | "test" | "parcours";
  content_id: string;
};

export async function getJessicaResources(): Promise<JessicaResource[]> {
  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.error("[jessica-resources] Service role client not available");
    return [];
  }

  try {
    const catalogItems = await fetchJessicaAssignableCatalogItems(supabase);

    return catalogItems.map((item) => ({
      id: item.id,
      title: item.title,
      item_type: item.item_type as JessicaResource["item_type"],
      content_id: item.content_id || item.id,
    }));
  } catch (error) {
    console.error("[jessica-resources] Error fetching resources:", error);
    return [];
  }
}
