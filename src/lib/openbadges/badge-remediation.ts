import { getServiceRoleClient } from "@/lib/supabase/server";

export type BadgeRemediationCourse = {
  courseId: string;
  courseName: string;
  courseHref: string;
};

export async function resolveBadgeRemediationCourse(
  courseIdInput: string | null | undefined,
): Promise<BadgeRemediationCourse | null> {
  const courseId = String(courseIdInput ?? "").trim();
  if (!courseId) return null;

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return {
      courseId,
      courseName: "Formation associée",
      courseHref: `/dashboard/apprenant/formations/${courseId}`,
    };
  }

  const { data } = await supabase
    .from("courses")
    .select("id, title, slug")
    .eq("id", courseId)
    .maybeSingle();

  if (!data) {
    return {
      courseId,
      courseName: "Formation associée",
      courseHref: `/dashboard/apprenant/formations/${courseId}`,
    };
  }

  const slug = String((data as { slug?: string }).slug ?? "").trim();
  const title = String((data as { title?: string }).title ?? "Formation associée").trim();

  return {
    courseId,
    courseName: title || "Formation associée",
    courseHref: slug
      ? `/dashboard/apprenant/formations/${courseId}`
      : `/dashboard/apprenant/formations/${courseId}`,
  };
}
