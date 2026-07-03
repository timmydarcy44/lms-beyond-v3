import type { FormationFilterChip } from "@/lib/edge-site/training-formation-card";
import { FORMATION_FILTER_CHIPS } from "@/lib/edge-site/training-formation-card";
import { getTrainingDomain } from "@/lib/edge-site/training-catalog";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import { TRAINING_FORMATION_BASE_PATH } from "@/lib/training-courses/types";

export function formationDetailPath(slug: string): string {
  return `${TRAINING_FORMATION_BASE_PATH}/${slug}`;
}

function courseMatchesChip(course: TrainingCoursePublic, chip: FormationFilterChip): boolean {
  if (chip.id === "all") return true;

  const domainTitles =
    chip.domainIds?.map((id) => getTrainingDomain(id)?.title.toLowerCase() ?? "") ?? [];
  if (domainTitles.some((t) => t && course.domain?.toLowerCase().includes(t))) return true;

  const haystack = [
    course.title,
    course.domain ?? "",
    course.short_description ?? "",
    ...(course.objectives ?? []),
    ...(course.skills ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return (chip.keywords ?? []).some((kw) => haystack.includes(kw.toLowerCase()));
}

export function filterTrainingCourses(
  courses: TrainingCoursePublic[],
  query: string,
  chipId: string,
): TrainingCoursePublic[] {
  const chip = FORMATION_FILTER_CHIPS.find((c) => c.id === chipId) ?? FORMATION_FILTER_CHIPS[0];
  let list = courses;

  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter((course) =>
      [course.title, course.domain, course.short_description, ...(course.objectives ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  if (chip.id !== "all") {
    list = list.filter((course) => courseMatchesChip(course, chip));
  }

  return list;
}

export { FORMATION_FILTER_CHIPS };
