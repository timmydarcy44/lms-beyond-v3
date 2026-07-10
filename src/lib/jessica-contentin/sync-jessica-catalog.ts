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

export async function catalogItemsTableExists(supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from("catalog_items").select("id").limit(1);
  return error?.code !== "PGRST205";
}

export async function getJessicaStudioCourseIds(
  supabase: SupabaseClient,
): Promise<Set<string>> {
  const ids = new Set<string>();
  const jessicaId = await resolveJessicaProfileId(supabase);

  const { data: orgCourses } = await supabase
    .from("courses")
    .select("id")
    .eq("org_id", JESSICA_STUDIO_ORG_ID);
  for (const row of orgCourses ?? []) {
    if (row.id) ids.add(String(row.id));
  }

  const { data: ownedCourses } = await supabase
    .from("courses")
    .select("id")
    .or(`creator_id.eq.${jessicaId},owner_id.eq.${jessicaId}`);
  for (const row of ownedCourses ?? []) {
    if (row.id) ids.add(String(row.id));
  }

  return ids;
}

async function fetchJessicaStudioCourses(
  supabase: SupabaseClient,
): Promise<CourseRow[]> {
  const courseIds = await getJessicaStudioCourseIds(supabase);
  if (!courseIds.size) return [];

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, cover_image, status")
    .in("id", Array.from(courseIds))
    .order("title", { ascending: true });

  if (error) {
    console.error("[sync-jessica-catalog] courses fetch error:", error);
    return [];
  }
  return (courses ?? []) as CourseRow[];
}

async function upsertModuleCatalogItem(
  supabase: SupabaseClient,
  jessicaId: string,
  course: CourseRow,
): Promise<string | null> {
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
    return existing.id;
  }

  const { data: inserted, error } = await supabase
    .from("catalog_items")
    .insert({
      content_id: course.id,
      item_type: "module",
      ...payload,
      created_at: now,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[sync-jessica-catalog] catalog insert failed:", course.id, error.message);
    return null;
  }
  return inserted?.id ?? null;
}

/** Synchronise les formations studio Jessica vers catalog_items (si la table existe). */
export async function syncJessicaStudioCatalog(
  supabase: SupabaseClient,
  jessicaId?: string,
): Promise<void> {
  if (!(await catalogItemsTableExists(supabase))) return;

  const profileId = jessicaId ?? (await resolveJessicaProfileId(supabase));
  const courses = await fetchJessicaStudioCourses(supabase);

  for (const course of courses) {
    try {
      await upsertModuleCatalogItem(supabase, profileId, course);
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
  /** Assignation directe via course_enrollments (pas de catalog_item). */
  courseDirect?: boolean;
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
  if (item.courseDirect && item.content_id && studioCourseIds.has(String(item.content_id))) {
    return true;
  }
  return false;
}

function coursesToCatalogRefs(courses: CourseRow[]): JessicaCatalogItemRef[] {
  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    item_type: "module",
    content_id: course.id,
    courseDirect: true,
  }));
}

/** Tous les catalog_items (ou formations studio) assignables depuis le CRM Jessica. */
export async function fetchJessicaAssignableCatalogItems(
  supabase: SupabaseClient,
): Promise<JessicaCatalogItemRef[]> {
  const jessicaId = await resolveJessicaProfileId(supabase);
  const studioCourseIds = await getJessicaStudioCourseIds(supabase);
  const hasCatalogTable = await catalogItemsTableExists(supabase);

  if (!hasCatalogTable) {
    console.warn("[sync-jessica-catalog] catalog_items absent — fallback courses studio");
    return coursesToCatalogRefs(await fetchJessicaStudioCourses(supabase));
  }

  await syncJessicaStudioCatalog(supabase, jessicaId);

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

  if (byId.size === 0) {
    return coursesToCatalogRefs(await fetchJessicaStudioCourses(supabase));
  }

  return Array.from(byId.values()).sort((a, b) =>
    String(a.title ?? "").localeCompare(String(b.title ?? ""), "fr"),
  );
}

/** Assigne une formation studio via course_enrollments (fallback sans catalog_items). */
export async function assignJessicaCourseToUser(
  supabase: SupabaseClient,
  courseId: string,
  userId: string,
  jessicaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const studioCourseIds = await getJessicaStudioCourseIds(supabase);
  if (!studioCourseIds.has(courseId)) {
    return { ok: false, error: "Formation hors studio Jessica" };
  }

  const row = { course_id: courseId, user_id: userId };
  let result = await supabase
    .from("course_enrollments")
    .upsert(row, { onConflict: "user_id,course_id" });

  if (result.error) {
    result = await supabase.from("course_enrollments").insert(row);
  }

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  console.log("[sync-jessica-catalog] course_enrollments OK", { courseId, userId, jessicaId });
  return { ok: true };
}

/** Inscriptions studio Jessica d'un client (fallback sans catalog_access). */
export async function fetchJessicaCourseEnrollmentsForUsers(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<
  Array<{
    id: string;
    user_id: string;
    course_id: string;
    created_at: string | null;
    purchase_amount?: number | null;
    courses: { id: string; title: string; cover_image: string | null } | null;
  }>
> {
  if (!userIds.length) return [];
  const studioCourseIds = await getJessicaStudioCourseIds(supabase);
  if (!studioCourseIds.size) return [];

  const { data, error } = await supabase
    .from("course_enrollments")
    .select("id, user_id, course_id, created_at, purchase_amount, courses(id, title, cover_image)")
    .in("user_id", userIds)
    .in("course_id", Array.from(studioCourseIds));

  if (error) {
    console.warn("[sync-jessica-catalog] course_enrollments fetch:", error.message);
    return [];
  }
  return (data ?? []) as Array<{
    id: string;
    user_id: string;
    course_id: string;
    created_at: string | null;
    purchase_amount?: number | null;
    courses: { id: string; title: string; cover_image: string | null } | null;
  }>;
}
