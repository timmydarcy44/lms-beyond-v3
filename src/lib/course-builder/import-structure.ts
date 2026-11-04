import { nanoid } from "nanoid";

import type { CourseBuilderSection, CourseBuilderSubchapter, WorkshopFieldType } from "@/types/course-builder";

export type ImportWarning = {
  chapter: string;
  title: string;
  message: string;
};

const CONTENT_TYPES = new Set(["video", "audio", "document", "text", "interactive_game"]);

function textOf(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lessonFrom(raw: unknown, index: number): CourseBuilderSubchapter {
  if (typeof raw === "string") {
    return {
      id: nanoid(),
      title: raw.trim() || `Sous-chapitre ${index + 1}`,
      duration: "",
      type: "text",
      summary: "",
      content: "",
    };
  }
  const row = (raw ?? {}) as Record<string, unknown>;
  const type = textOf(row.type);
  return {
    id: textOf(row.id) || nanoid(),
    title: textOf(row.title) || `Sous-chapitre ${index + 1}`,
    duration: textOf(row.duration),
    type: CONTENT_TYPES.has(type) ? (type as CourseBuilderSubchapter["type"]) : "text",
    summary: textOf(row.summary),
    content: textOf(row.content),
  };
}

function atelierError(chapter: string, title: string, message: string): ImportWarning {
  return {
    chapter,
    title,
    message: `Chapitre « ${chapter} », atelier « ${title} » : ${message}`,
  };
}

function readAtelier(
  raw: Record<string, unknown>,
  chapterTitle: string,
): { block: CourseBuilderSubchapter } | { warning: ImportWarning } {
  const title = textOf(raw.title) || "Atelier";
  const instructions = textOf(raw.instructions) || textOf(raw.brief);
  const fieldsRaw = Array.isArray(raw.fields) ? raw.fields : [];
  const criteriaRaw = Array.isArray(raw.criteria) ? raw.criteria : [];
  const fields = fieldsRaw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const field = item as Record<string, unknown>;
    const label = textOf(field.label);
    if (!label) return [];
    const type: WorkshopFieldType = field.type === "short" ? "short" : "long";
    return [{ id: nanoid(), label, placeholder: textOf(field.placeholder), type }];
  });
  const criteria = criteriaRaw.flatMap((item) => {
    const label = typeof item === "string" ? item.trim() : textOf((item as { label?: unknown })?.label);
    return label ? [{ id: nanoid(), label }] : [];
  });
  const maxRaw = raw.max_improvements ?? raw.maxImprovements;
  const max = maxRaw == null || maxRaw === "" ? 2 : Number(maxRaw);

  if (!instructions) return { warning: atelierError(chapterTitle, title, "la consigne est obligatoire.") };
  if (fields.length < 1 || fields.length > 6) {
    return { warning: atelierError(chapterTitle, title, "il faut entre 1 et 6 champs.") };
  }
  if (criteria.length < 2 || criteria.length > 6) {
    return { warning: atelierError(chapterTitle, title, "il faut entre 2 et 6 critères.") };
  }
  if (!Number.isInteger(max) || max < 0 || max > 6) {
    return { warning: atelierError(chapterTitle, title, "le nombre d'améliorations doit être un entier entre 0 et 6.") };
  }

  return {
    block: {
      id: textOf(raw.id) || nanoid(),
      title,
      duration: textOf(raw.duration),
      type: "text",
      summary: "",
      content: "",
      kind: "case_study",
      workshop: {
        mode: "atelier",
        brief: instructions,
        situation: textOf(raw.scenario) || textOf(raw.situation),
        example: textOf(raw.example),
        fields,
        criteria,
        maxImprovements: max,
      },
    },
  };
}

function isAtelier(raw: unknown) {
  if (!raw || typeof raw !== "object") return false;
  const type = textOf((raw as { type?: unknown }).type).toLowerCase();
  return type === "atelier";
}

function isReadyAtelier(raw: unknown): raw is CourseBuilderSubchapter {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as CourseBuilderSubchapter;
  return row.kind === "case_study" && row.workshop?.mode === "atelier" && textOf(row.workshop.brief).length > 0;
}

/** Leçons dans l'ordre d'origine, ateliers valides ajoutés à la fin du chapitre. */
export function orderImportedSubchapters(
  subs: unknown[],
  chapterTitle: string,
  toLesson: (raw: unknown, index: number) => CourseBuilderSubchapter,
) {
  const learning: CourseBuilderSubchapter[] = [];
  const ateliers: CourseBuilderSubchapter[] = [];
  const warnings: ImportWarning[] = [];
  subs.forEach((sub, index) => {
    if (isAtelier(sub)) {
      const parsed = readAtelier(sub as Record<string, unknown>, chapterTitle);
      if ("warning" in parsed) warnings.push(parsed.warning);
      else ateliers.push(parsed.block);
      return;
    }
    if (isReadyAtelier(sub)) {
      ateliers.push(sub);
      return;
    }
    const lesson = toLesson(sub, index);
    if (lesson.title.trim()) learning.push(lesson);
  });
  return { subchapters: [...learning, ...ateliers], warnings };
}

export function importFormationStructure(raw: unknown): {
  sections: CourseBuilderSection[];
  objectifs: string[];
  warnings: ImportWarning[];
} {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const source = root.structure && typeof root.structure === "object" ? (root.structure as Record<string, unknown>) : root;
  const sectionsRaw = Array.isArray(source.sections) ? source.sections : [];
  const warnings: ImportWarning[] = [];
  const objectifsRaw = source.objectifs ?? source.objectives ?? source.goals;
  const objectifs = Array.isArray(objectifsRaw)
    ? objectifsRaw.map((item) => textOf(item)).filter(Boolean).slice(0, 12)
    : [];

  const sections: CourseBuilderSection[] = sectionsRaw.flatMap((section, sectionIndex) => {
    if (!section || typeof section !== "object") return [];
    const row = section as Record<string, unknown>;
    const title = textOf(row.title) || `Section ${sectionIndex + 1}`;
    const chaptersRaw = Array.isArray(row.chapters) ? row.chapters : [];
    return [
      {
        id: textOf(row.id) || nanoid(),
        title,
        description: textOf(row.description),
        chapters: chaptersRaw.flatMap((chapter, chapterIndex) => {
          if (!chapter || typeof chapter !== "object") return [];
          const chapterRow = chapter as Record<string, unknown>;
          const chapterTitle = textOf(chapterRow.title) || `Chapitre ${chapterIndex + 1}`;
          const subs = Array.isArray(chapterRow.subchapters)
            ? chapterRow.subchapters
            : Array.isArray(chapterRow.subChapters)
              ? chapterRow.subChapters
              : [];
          const ordered = orderImportedSubchapters(subs, chapterTitle, lessonFrom);
          warnings.push(...ordered.warnings);
          return [
            {
              id: textOf(chapterRow.id) || nanoid(),
              title: chapterTitle,
              duration: textOf(chapterRow.duration),
              type: "text" as const,
              summary: textOf(chapterRow.summary),
              content: textOf(chapterRow.content),
              subchapters: ordered.subchapters,
            },
          ];
        }),
      },
    ];
  });

  return { sections, objectifs, warnings };
}

export function parseFormationImportText(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sections?: unknown }).sections)) return null;
    return importFormationStructure(parsed);
  } catch {
    return null;
  }
}
