import { JESSICA_STUDIO_ORG_ID } from "@/lib/jessica-contentin/studio-config";
import { JESSICA_CREATOR_ID_FALLBACK } from "@/lib/jessica-contentin/resolve-creator-id";

type CourseRow = {
  creator_id?: string | null;
  org_id?: string | null;
  created_by?: string | null;
};

/** Formation appartenant au studio Jessica (edgebs ou jessicacontentin). */
export function isJessicaStudioCourse(
  course: CourseRow | null | undefined,
  jessicaCreatorId: string,
): boolean {
  if (!course) return false;

  const orgId = String(course.org_id ?? "").trim();
  if (orgId && orgId === JESSICA_STUDIO_ORG_ID) return true;

  const creatorId = String(course.creator_id ?? course.created_by ?? "").trim();
  if (!creatorId) return false;

  return creatorId === jessicaCreatorId || creatorId === JESSICA_CREATOR_ID_FALLBACK;
}

export function firstPlayableLessonId(
  modules: Array<{ lessons?: Array<{ id: string }> }> | undefined,
): string | null {
  for (const module of modules ?? []) {
    const lesson = module.lessons?.find((item) => item.id);
    if (lesson?.id) return lesson.id;
  }
  return null;
}
