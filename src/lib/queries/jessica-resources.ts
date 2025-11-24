"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export type JessicaResource = {
  id: string;
  title: string;
  item_type: "module" | "ressource" | "test" | "parcours";
  content_id: string;
};

export async function getJessicaResources(): Promise<JessicaResource[]> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return [];
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return [];
  }

  try {
    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return [];
    }

    // Récupérer tous les catalog_items de Jessica
    const { data: catalogItems } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, content_id")
      .eq("creator_id", jessicaProfile.id)
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (!catalogItems) {
      return [];
    }

    return catalogItems.map((item: any) => ({
      id: item.id,
      title: item.title,
      item_type: item.item_type,
      content_id: item.content_id || item.id,
    }));
  } catch (error) {
    console.error("[jessica-resources] Error fetching resources:", error);
    return [];
  }
}

