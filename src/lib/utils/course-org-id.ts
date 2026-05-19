import type { CourseBuilderSnapshot } from "@/types/course-builder";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** UUID organisation valide pour la colonne `courses.org_id`, ou null (catalogue global / No School). */
export function resolveOrgIdFromCourseSnapshot(snapshot: CourseBuilderSnapshot | null | undefined): string | null {
  if (!snapshot?.general) return null;
  const assignmentType = snapshot.general.assignment_type;
  if (assignmentType === "no_school") return null;
  const raw = String(snapshot.general.assigned_organization_id ?? "").trim();
  if (!raw || !UUID_RE.test(raw)) return null;
  return raw;
}
