import { nanoid } from "nanoid";
import { createEmptyCourseBuilderSnapshot } from "@/data/course-builder-fallback";
import {
  normalizeProgramStructure,
  type TrainingProgramSection,
} from "@/lib/training-courses/cms-types";
import type { CourseBuilderSnapshot, CourseBuilderSection } from "@/types/course-builder";

export type TrainingCourseForLmsConvert = {
  title: string;
  short_description?: string | null;
  long_description?: string | null;
  domain?: string | null;
  cover_url?: string | null;
  duration?: string | null;
  level?: string | null;
  objectives?: string[] | null;
  skills?: string[] | null;
  prerequisites?: string | null;
  audience?: string[] | null;
  badge_name?: string | null;
  program_structure?: TrainingProgramSection[] | null;
  program?: { title: string; duration?: string }[] | null;
  inter_price?: number | null;
  intra_price?: number | null;
};

function mapSections(structure: TrainingProgramSection[]): CourseBuilderSection[] {
  return structure.map((section, sIdx) => ({
    id: nanoid(),
    title: section.title?.trim() || `Module ${sIdx + 1}`,
    description: section.description?.trim() || "",
    chapters: (section.chapters ?? []).map((chapter, cIdx) => ({
      id: nanoid(),
      title: chapter.title?.trim() || `Chapitre ${cIdx + 1}`,
      duration: "",
      type: "text" as const,
      summary: "",
      content: "",
      access_start_date: null,
      access_end_date: null,
      unlock_condition: "previous_chapter_completed" as const,
      subchapters: (chapter.subchapters ?? []).map((sub, subIdx) => ({
        id: nanoid(),
        title: sub.title?.trim() || `Sous-chapitre ${subIdx + 1}`,
        duration: "",
        type: "text" as const,
        summary: "",
        content: "",
      })),
    })),
  }));
}

/** Convertit une fiche catalogue (`program_structure`) en snapshot LMS brouillon. */
export function trainingCourseToLmsSnapshot(
  course: TrainingCourseForLmsConvert,
): CourseBuilderSnapshot {
  const structure = normalizeProgramStructure(course.program_structure, course.program);
  const empty = createEmptyCourseBuilderSnapshot();
  const objectives = (course.objectives ?? []).map((o) => String(o).trim()).filter(Boolean);
  const skills = (course.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const description =
    (course.long_description || course.short_description || "").trim() || "";
  const cover = (course.cover_url || "").trim();
  const price = Number(course.inter_price ?? course.intra_price ?? 0) || 0;

  return {
    ...empty,
    general: {
      ...empty.general,
      title: course.title.trim() || "Formation",
      subtitle: (course.short_description || "").trim(),
      description,
      presentation: description,
      category: (course.domain || "").trim(),
      level: (course.level || "").trim(),
      duration: (course.duration || "").trim(),
      heroImage: cover,
      cover_image: cover,
      badgeLabel: (course.badge_name || "").trim(),
      objectifs: objectives,
      prerequisites: course.prerequisites?.trim()
        ? [course.prerequisites.trim()]
        : [],
      audiences: (course.audience ?? []).map((a) => String(a).trim()).filter(Boolean),
      price,
      publisher: "byound",
    },
    objectives,
    skills,
    sections: mapSections(structure),
    resources: [],
    tests: [],
  };
}
