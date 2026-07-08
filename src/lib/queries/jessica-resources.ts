"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import {
  JESSICA_CONTENTIN_PROFILE_ID,
  jessicaCatalogItemsOrFilter,
} from "@/lib/jessica-contentin/catalog-ownership";
import { JESSICA_CONTENTIN_EMAIL, JESSICA_STUDIO_ORG_ID } from "@/lib/jessica-contentin/studio-config";

export type JessicaResource = {
  id: string;
  title: string;
  item_type: "module" | "ressource" | "test" | "parcours";
  content_id: string;
};

async function ensureJessicaCoursesInCatalog(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  jessicaId: string,
): Promise<void> {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, cover_image, status")
    .eq("org_id", JESSICA_STUDIO_ORG_ID);

  if (!courses?.length) return;

  const { data: existingItems } = await supabase
    .from("catalog_items")
    .select("content_id")
    .eq("item_type", "module")
    .or(jessicaCatalogItemsOrFilter(jessicaId));

  const existingContentIds = new Set((existingItems ?? []).map((item) => item.content_id));

  const now = new Date().toISOString();
  for (const course of courses) {
    if (existingContentIds.has(course.id)) continue;

    const { error } = await supabase.from("catalog_items").insert({
      content_id: course.id,
      item_type: "module",
      title: course.title,
      description: course.description ?? null,
      short_description: course.description?.substring(0, 150) ?? null,
      hero_image_url: course.cover_image ?? null,
      thumbnail_url: course.cover_image ?? null,
      price: 0,
      is_free: true,
      target_audience: "apprenant",
      creator_id: jessicaId,
      created_by: jessicaId,
      is_active: course.status === "published",
      created_at: now,
      updated_at: now,
    });

    if (error) {
      console.warn("[jessica-resources] Could not sync course to catalog:", course.id, error.message);
    }
  }
}

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
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    const jessicaId = jessicaProfile?.id ?? JESSICA_CONTENTIN_PROFILE_ID;

    await ensureJessicaCoursesInCatalog(supabase, jessicaId);

    const { data: catalogItems, error } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, content_id, is_active")
      .or(jessicaCatalogItemsOrFilter(jessicaId))
      .order("title", { ascending: true });

    if (error) {
      console.error("[jessica-resources] Error fetching resources:", error);
      return [];
    }

    if (!catalogItems?.length) {
      return [];
    }

    return catalogItems.map((item) => ({
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
