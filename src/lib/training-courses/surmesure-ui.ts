import type { TrainingProgramSection } from "@/lib/training-courses/cms-types";

export type SurMesureCourse = {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  duration: string | null;
  level: string | null;
  domain: string | null;
  prerequisites: string | null;
  specific_needs: string | null;
  objectives: string[] | null;
  audience: string[] | null;
  skills: string[] | null;
  formats: string[] | null;
  intra_price: number | null;
  inter_price: number | null;
  program_structure: TrainingProgramSection[] | null;
  updated_at: string | null;
  created_at: string | null;
};

export type SurMesureDraft = {
  title: string;
  short_description: string;
  duration: string;
  level: string;
  domain: string;
  prerequisites: string[];
  specific_needs: string;
  objectives: string[];
  audience: string[];
  skills: string[];
  formats: string[];
  intra_price: string;
  inter_price: string;
  brief: string;
};

export const EMPTY_SURMESURE_DRAFT: SurMesureDraft = {
  title: "",
  short_description: "",
  duration: "2 jours",
  level: "Intermédiaire",
  domain: "",
  prerequisites: [""],
  specific_needs: "",
  objectives: [""],
  audience: [""],
  skills: [""],
  formats: ["Sur mesure"],
  intra_price: "",
  inter_price: "",
  brief: "",
};

export function splitPrerequisites(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [""];
  return raw
    .split(/\n|;|•|·/)
    .map((s) => s.replace(/^[-–—]\s*/, "").trim())
    .filter(Boolean);
}

export function courseToDraft(course: SurMesureCourse): SurMesureDraft {
  const prerequisites = splitPrerequisites(course.prerequisites);
  return {
    title: course.title ?? "",
    short_description: course.short_description ?? "",
    duration: course.duration ?? "",
    level: course.level ?? "",
    domain: course.domain ?? "",
    prerequisites: prerequisites.length ? prerequisites : [""],
    specific_needs: course.specific_needs ?? "",
    objectives: course.objectives?.length ? [...course.objectives] : [""],
    audience: course.audience?.length ? [...course.audience] : [""],
    skills: course.skills?.length ? [...course.skills] : [""],
    formats: course.formats?.length ? [...course.formats] : ["Sur mesure"],
    intra_price: course.intra_price != null ? String(course.intra_price) : "",
    inter_price: course.inter_price != null ? String(course.inter_price) : "",
    brief: "",
  };
}

export function draftToPayload(draft: SurMesureDraft) {
  const clean = (items: string[]) => items.map((s) => s.trim()).filter(Boolean);
  return {
    title: draft.title.trim(),
    short_description: draft.short_description.trim(),
    duration: draft.duration.trim(),
    level: draft.level.trim(),
    domain: draft.domain.trim(),
    prerequisites: clean(draft.prerequisites).join("\n") || null,
    specific_needs: draft.specific_needs.trim() || null,
    objectives: clean(draft.objectives),
    audience: clean(draft.audience),
    skills: clean(draft.skills),
    formats: clean(draft.formats).length ? clean(draft.formats) : ["Sur mesure"],
    intra_price: draft.intra_price,
    inter_price: draft.inter_price,
  };
}

export function surmesureBackHref(orgId: string) {
  return `/super/organisations/${orgId}?tab=surmesure`;
}

export function surmesureNewHref(orgId: string) {
  return `/super/organisations/${orgId}/surmesure/new`;
}

export function surmesureDetailHref(orgId: string, courseId: string) {
  return `/super/organisations/${orgId}/surmesure/${courseId}`;
}

export function surmesureEditHref(orgId: string, courseId: string) {
  return `/super/organisations/${orgId}/surmesure/${courseId}/edit`;
}
