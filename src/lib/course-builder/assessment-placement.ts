import { nanoid } from "nanoid";

import type { CourseBuilderSnapshot, CourseBuilderSubchapter } from "@/types/course-builder";

export type AssessmentPlacementType =
  | "end"
  | "after_section"
  | "after_chapter"
  | "after_subchapter";

export type AssessmentPlacement = {
  type: AssessmentPlacementType;
  id?: string;
};

export type PlacementOption = {
  value: string;
  label: string;
  type: AssessmentPlacementType;
  id?: string;
};

export function buildAssessmentPlacementOptions(
  sections: CourseBuilderSnapshot["sections"],
): PlacementOption[] {
  const options: PlacementOption[] = [
    { value: "end", label: "À la fin de la formation", type: "end" },
  ];
  sections.forEach((section, sectionIndex) => {
    options.push({
      value: `after_section:${section.id}`,
      label: `À la fin de la section ${sectionIndex + 1} · ${section.title || "Sans titre"}`,
      type: "after_section",
      id: section.id,
    });
    section.chapters.forEach((chapter, chapterIndex) => {
      options.push({
        value: `after_chapter:${chapter.id}`,
        label: `À la fin du chapitre ${sectionIndex + 1}.${chapterIndex + 1} · ${chapter.title || "Sans titre"}`,
        type: "after_chapter",
        id: chapter.id,
      });
      chapter.subchapters.forEach((sub, subIndex) => {
        options.push({
          value: `after_subchapter:${sub.id}`,
          label: `Juste après le sous-chapitre ${sectionIndex + 1}.${chapterIndex + 1}.${subIndex + 1} · ${sub.title || "Sans titre"}`,
          type: "after_subchapter",
          id: sub.id,
        });
      });
    });
  });
  return options;
}

export function parsePlacementValue(value: string): AssessmentPlacement {
  if (value === "end") return { type: "end" };
  const [type, id] = value.split(":");
  if (type === "after_section" || type === "after_chapter" || type === "after_subchapter") {
    return { type, id: id || "" };
  }
  return { type: "end" };
}

/** Insère un sous-chapitre (quiz, entretien, …) à l'emplacement choisi. */
export function insertSubchapterAtPlacement(
  snapshot: CourseBuilderSnapshot,
  block: CourseBuilderSubchapter,
  placement: AssessmentPlacement,
): CourseBuilderSnapshot {
  const updated = structuredClone(snapshot) as CourseBuilderSnapshot;
  updated.sections = Array.isArray(updated.sections) ? updated.sections : [];

  const insertAfterSubchapter = (ch: { subchapters?: CourseBuilderSubchapter[] }) => {
    ch.subchapters = Array.isArray(ch.subchapters) ? ch.subchapters : [];
    ch.subchapters.push(block);
  };

  const insertAfterSubchapterIndex = (
    ch: { subchapters?: CourseBuilderSubchapter[] },
    index: number,
  ) => {
    ch.subchapters = Array.isArray(ch.subchapters) ? ch.subchapters : [];
    ch.subchapters.splice(index + 1, 0, block);
  };

  const { type, id } = placement;

  if (type === "after_section" && id) {
    const sectionIndex = updated.sections.findIndex((s) => s.id === id);
    if (sectionIndex >= 0) {
      const s = updated.sections[sectionIndex];
      s.chapters = Array.isArray(s.chapters) ? s.chapters : [];
      if (s.chapters.length === 0) {
        s.chapters.push({
          id: nanoid(),
          title: "Chapitre",
          duration: "",
          type: "text",
          summary: "",
          content: "",
          subchapters: [block],
        });
      } else {
        insertAfterSubchapter(s.chapters[s.chapters.length - 1]);
      }
      return updated;
    }
  }

  if (type === "after_chapter" && id) {
    for (const s of updated.sections) {
      const chapterIndex = (s.chapters || []).findIndex((c) => c.id === id);
      if (chapterIndex >= 0) {
        insertAfterSubchapter(s.chapters[chapterIndex]);
        return updated;
      }
    }
  }

  if (type === "after_subchapter" && id) {
    for (const s of updated.sections) {
      for (const ch of s.chapters || []) {
        const subs = Array.isArray(ch.subchapters) ? ch.subchapters : [];
        const idx = subs.findIndex((sub) => sub.id === id);
        if (idx >= 0) {
          ch.subchapters = subs;
          insertAfterSubchapterIndex(ch, idx);
          return updated;
        }
      }
    }
  }

  // Fin de formation (défaut)
  const lastSection = updated.sections[updated.sections.length - 1];
  if (lastSection) {
    lastSection.chapters = Array.isArray(lastSection.chapters) ? lastSection.chapters : [];
    if (lastSection.chapters.length === 0) {
      lastSection.chapters.push({
        id: nanoid(),
        title: "Chapitre",
        duration: "",
        type: "text",
        summary: "",
        content: "",
        subchapters: [block],
      });
    } else {
      insertAfterSubchapter(lastSection.chapters[lastSection.chapters.length - 1]);
    }
    return updated;
  }

  updated.sections.push({
    id: nanoid(),
    title: "Section",
    description: "",
    chapters: [
      {
        id: nanoid(),
        title: "Chapitre",
        duration: "",
        type: "text",
        summary: "",
        content: "",
        subchapters: [block],
      },
    ],
  });
  return updated;
}
