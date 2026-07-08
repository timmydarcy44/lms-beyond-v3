import type { SupabaseClient } from "@supabase/supabase-js";
import {
  catalogItemBelongsToJessica,
  JESSICA_CONTENTIN_PROFILE_ID,
  jessicaCatalogItemsOrFilter,
} from "@/lib/jessica-contentin/catalog-ownership";
import { JESSICA_CONTENTIN_EMAIL, JESSICA_STUDIO_ORG_ID } from "@/lib/jessica-contentin/studio-config";

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: string | null;
};

export async function resolveJessicaProfileId(
  supabase: SupabaseClient,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", JESSICA_CONTENTIN_EMAIL)
    .maybeSingle();
  return data?.id ?? JESSICA_CONTENTIN_PROFILE_ID;
}

export async function getJessicaStudioCourseIds(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: orgCourses } = await supabase
    .from("courses")
    .select("id")
    .eq("org_id", JESSICA_STUDIO_ORG_ID);
  for (const row of orgCourses ?? []) {
    if (row.id) ids.add(String(row.id));
  }

  const jessicaId = await resolveJessicaProfileId(supabase);
  const { data: ownedCourses } = await supabase
    .from("courses")
    .select("id")
    .or(`creator_id.eq.${jessicaId},created_by.eq.${jessicaId},owner_id.eq.${jessicaId}`);
  for (const row of ownedCourses ?? []) {
    if (row.id) ids.add(String(row.id));
  }

  return ids;
}

async function upsertModuleCatalogItem(
  supabase: SupabaseClient,
  jessicaId: string,
  course: CourseRow,
): Promise<void> {
  const { data: existingRows } = await supabase
    .from("catalog_items")
    .select("id, creator_id, created_by, is_active")
    .eq("content_id", course.id)
    .eq("item_type", "module")
    .order("created_at", { ascending: false })
    .limit(3);

  const now = new Date().toISOString();
  const payload = {
    title: course.title,
    description: course.description ?? null,
    short_description: course.description?.substring(0, 150) ?? null,
    hero_image_url: course.cover_image ?? null,
    thumbnail_url: course.cover_image ?? null,
    price: 0,
    is_free: true,
    target_audience: "apprenant" as const,
    creator_id: jessicaId,
    created_by: jessicaId,
    is_active: true,
    updated_at: now,
  };

  const existing = existingRows?.[0];
  if (existing) {
    await supabase.from("catalog_items").update(payload).eq("id", existing.id);
    if (existingRows && existingRows.length > 1) {
      const staleIds = existingRows.slice(1).map((r) => r.id);
      await supabase.from("catalog_items").delete().in("id", staleIds);
    }
    return;
  }

  await supabase.from("catalog_items").insert({
    content_id: course.id,
    item_type: "module",
    ...payload,
    created_at: now,
  });
}

/** Synchronise les formations studio Jessica vers catalog_items (assignables CRM). */
export async function syncJessicaStudioCatalog(
  supabase: SupabaseClient,
  jessicaId?: string,
): Promise<void> {
  const profileId = jessicaId ?? (await resolveJessicaProfileId(supabase));
  const courseIds = await getJessicaStudioCourseIds(supabase);
  if (!courseIds.size) return;

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, cover_image, status")
    .in("id", Array.from(courseIds));

  for (const course of courses ?? []) {
    try {
      await upsertModuleCatalogItem(supabase, profileId, course as CourseRow);
    } catch (error) {
      console.warn("[sync-jessica-catalog] course sync failed:", course.id, error);
    }
  }
}

export type JessicaCatalogItemRef = {
  id: string;
  title: string;
  item_type: string;
  content_id: string | null;
  creator_id?: string | null;
  created_by?: string | null;
};

export function isJessicaAssignableCatalogItem(
  item: JessicaCatalogItemRef,
  jessicaId: string,
  studioCourseIds: Set<string>,
): boolean {
  if (catalogItemBelongsToJessica(item, jessicaId)) return true;
  if (item.item_type === "module" && item.content_id && studioCourseIds.has(String(item.content_id))) {
    return true;
  }
  return false;
}

/** Tous les catalog_items assignables depuis le CRM Jessica. */
export async function fetchJessicaAssignableCatalogItems(
  supabase: SupabaseClient,
): Promise<JessicaCatalogItemRef[]> {
  const jessicaId = await resolveJessicaProfileId(supabase);
  await syncJessicaStudioCatalog(supabase, jessicaId);

  const studioCourseIds = await getJessicaStudioCourseIds(supabase);
  const byId = new Map<string, JessicaCatalogItemRef>();

  const { data: ownedItems, error: ownedError } = await supabase
    .from("catalog_items")
    .select("id, title, item_type, content_id, creator_id, created_by")
    .or(jessicaCatalogItemsOrFilter(jessicaId))
    .order("title", { ascending: true });

  if (ownedError) {
    console.error("[sync-jessica-catalog] owned items error:", ownedError);
  }

  for (const item of ownedItems ?? []) {
    byId.set(item.id, item as JessicaCatalogItemRef);
  }

  if (studioCourseIds.size > 0) {
    const { data: studioItems, error: studioError } = await supabase
      .from("catalog_items")
      .select("id, title, item_type, content_id, creator_id, created_by")
      .eq("item_type", "module")
      .in("content_id", Array.from(studioCourseIds))
      .order("title", { ascending: true });

    if (studioError) {
      console.error("[sync-jessica-catalog] studio items error:", studioError);
    }

    for (const item of studioItems ?? []) {
      if (isJessicaAssignableCatalogItem(item as JessicaCatalogItemRef, jessicaId, studioCourseIds)) {
        byId.set(item.id, item as JessicaCatalogItemRef);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    String(a.title ?? "").localeCompare(String(b.title ?? ""), "fr"),
  );
}
