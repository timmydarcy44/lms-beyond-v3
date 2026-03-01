import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const ACCESS_STATUSES = ["purchased", "manually_granted", "free"] as const;
const COURSE_ITEM_TYPES = ["module", "course", "formation"] as const;

export const getEnrolledCourseIds = async (
  userId: string,
  orgId: string,
  courseIds: string[],
): Promise<Set<string>> => {
  if (!courseIds.length) return new Set();

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    throw new Error("SUPABASE_UNAVAILABLE");
  }

  const { data: courses } = await supabase
    .from("courses")
    .select("id")
    .eq("org_id", orgId)
    .in("id", courseIds);

  const scopedCourseIds = (courses ?? []).map((course) => course.id);
  if (!scopedCourseIds.length) return new Set();

  const { data: catalogItems } = await supabase
    .from("catalog_items")
    .select("id, content_id")
    .in("content_id", scopedCourseIds)
    .in("item_type", COURSE_ITEM_TYPES as unknown as string[]);

  const itemIds = (catalogItems ?? []).map((item) => item.id);
  if (!itemIds.length) return new Set();

  const { data: accesses } = await supabase
    .from("catalog_access")
    .select("catalog_item_id")
    .eq("user_id", userId)
    .in("catalog_item_id", itemIds)
    .in("access_status", ACCESS_STATUSES as unknown as string[]);

  const accessItemIds = new Set((accesses ?? []).map((row) => row.catalog_item_id));
  const enrolledCourseIds = new Set<string>();
  (catalogItems ?? []).forEach((item) => {
    if (accessItemIds.has(item.id)) {
      enrolledCourseIds.add(item.content_id);
    }
  });

  return enrolledCourseIds;
};

export const isLearnerEnrolled = async (
  userId: string,
  orgId: string,
  courseId: string,
): Promise<boolean> => {
  const enrolled = await getEnrolledCourseIds(userId, orgId, [courseId]);
  return enrolled.has(courseId);
};
