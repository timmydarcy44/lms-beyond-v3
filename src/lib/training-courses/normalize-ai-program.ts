import { createId, type TrainingProgramSection } from "@/lib/training-courses/cms-types";

function normalizeSubchapters(raw: unknown): { id: string; title: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === "string") return { id: createId(), title: item.trim() };
      if (item && typeof item === "object" && "title" in item) {
        return { id: createId(), title: String((item as { title: string }).title).trim() };
      }
      return null;
    })
    .filter((s): s is { id: string; title: string } => Boolean(s?.title));
}

export function normalizeAiProgramStructure(raw: unknown): TrainingProgramSection[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((section) => {
      if (!section || typeof section !== "object") return null;
      const s = section as {
        id?: string;
        title?: string;
        description?: string;
        chapters?: unknown[];
      };
      const title = String(s.title ?? "").trim();
      if (!title) return null;

      const chapters = Array.isArray(s.chapters)
        ? s.chapters
            .map((chapter) => {
              if (!chapter || typeof chapter !== "object") return null;
              const c = chapter as { id?: string; title?: string; subchapters?: unknown[] };
              const chapterTitle = String(c.title ?? "").trim();
              if (!chapterTitle) return null;
              return {
                id: c.id?.trim() || createId(),
                title: chapterTitle,
                subchapters: normalizeSubchapters(c.subchapters),
              };
            })
            .filter(Boolean)
        : [];

      return {
        id: s.id?.trim() || createId(),
        title,
        description: String(s.description ?? "").trim() || undefined,
        chapters: chapters as TrainingProgramSection["chapters"],
      };
    })
    .filter(Boolean) as TrainingProgramSection[];
}
