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

/** Extrait les IDs de chapitres depuis builder_snapshot (fallback si modules vides). */
export function lessonIdsFromBuilderSnapshot(snapshot: unknown): string[] {
  const parsed =
    typeof snapshot === "string"
      ? (() => {
          try {
            return JSON.parse(snapshot);
          } catch {
            return null;
          }
        })()
      : snapshot;

  const ids: string[] = [];
  for (const section of (parsed as { sections?: unknown[] })?.sections ?? []) {
    for (const chapter of (section as { chapters?: unknown[] })?.chapters ?? []) {
      const chapterId = (chapter as { id?: string })?.id;
      if (chapterId) ids.push(String(chapterId));
      for (const sub of (chapter as { subchapters?: unknown[] })?.subchapters ?? []) {
        const subId = (sub as { id?: string })?.id;
        if (subId) ids.push(String(subId));
      }
    }
  }
  return ids;
}

const GRANTED_CATALOG_STATUSES = new Set(["purchased", "free", "manually_granted"]);

/** Accès lecture formation sur jessicacontentin.fr (sans passer par edgebs). */
export function canPlayJessicaFormation(input: {
  isCreator: boolean;
  hasEnrollment: boolean;
  catalogAccessStatus: string | null;
  isFree: boolean;
}): boolean {
  if (input.isCreator || input.hasEnrollment) return true;
  if (input.isFree) return true;
  if (
    input.catalogAccessStatus &&
    GRANTED_CATALOG_STATUSES.has(input.catalogAccessStatus)
  ) {
    return true;
  }
  return false;
}
