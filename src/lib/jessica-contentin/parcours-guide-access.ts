import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { getParcoursGuide } from "@/lib/jessica-contentin/parcours-guide-catalog";

export type ParcoursGuideAccess = {
  isAuthenticated: boolean;
  hasAccess: boolean;
  catalogItemId: string | null;
  contentId: string | null;
};

async function hasEnrollmentAccess(
  db: Awaited<ReturnType<typeof getServerClient>>,
  userId: string,
  courseId: string | null | undefined,
): Promise<boolean> {
  if (!db || !courseId) return false;
  const { data } = await db
    .from("enrollments")
    .select("course_id")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return Boolean(data);
}

export async function getParcoursGuideAccess(slug: string): Promise<ParcoursGuideAccess> {
  const parcours = getParcoursGuide(slug);
  const empty: ParcoursGuideAccess = {
    isAuthenticated: false,
    hasAccess: false,
    catalogItemId: parcours?.catalogItemId ?? null,
    contentId: parcours?.contentId ?? parcours?.courseId ?? null,
  };

  const supabase = await getServerClient();
  if (!supabase) return empty;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const service = getServiceRoleClient();
  const db = service ?? supabase;

  const courseId = parcours?.courseId ?? parcours?.contentId ?? null;

  if (await hasEnrollmentAccess(db, user.id, courseId)) {
    return {
      isAuthenticated: true,
      hasAccess: true,
      catalogItemId: parcours?.catalogItemId ?? null,
      contentId: courseId,
    };
  }

  let catalogItemId = parcours?.catalogItemId ?? null;
  let contentId = parcours?.contentId ?? courseId;

  if (!catalogItemId && parcours?.catalogLookupTitle) {
    const { data: item, error } = await db
      .from("catalog_items")
      .select("id, content_id, creator_id")
      .ilike("title", `%${parcours.catalogLookupTitle}%`)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!error && item?.id) {
      catalogItemId = String(item.id);
      contentId = item.content_id ? String(item.content_id) : contentId;
      if (item.creator_id === user.id) {
        return { isAuthenticated: true, hasAccess: true, catalogItemId, contentId };
      }
    }
  }

  if (!catalogItemId) {
    return { isAuthenticated: true, hasAccess: false, catalogItemId: null, contentId };
  }

  const { data: access, error: accessError } = await db
    .from("catalog_access")
    .select("access_status")
    .eq("user_id", user.id)
    .eq("catalog_item_id", catalogItemId)
    .in("access_status", ["purchased", "manually_granted", "free"])
    .maybeSingle();

  if (accessError) {
    return { isAuthenticated: true, hasAccess: false, catalogItemId, contentId };
  }

  return {
    isAuthenticated: true,
    hasAccess: Boolean(access),
    catalogItemId,
    contentId,
  };
}
