import type { LearnerLesson } from "@/lib/queries/apprenant";

export type OutlineChapterGroup = {
  key: string;
  chapter: LearnerLesson | null;
  items: LearnerLesson[];
};

/** Regroupe chapitres et sous-chapitres pour le sommaire (accordéon). */
export function groupLessonsForOutline(lessons: LearnerLesson[]): OutlineChapterGroup[] {
  if (!lessons.length) return [];

  const groups: OutlineChapterGroup[] = [];
  const byChapterId = new Map<string, OutlineChapterGroup>();

  const ensureGroup = (chapterId: string, chapter: LearnerLesson | null) => {
    let g = byChapterId.get(chapterId);
    if (!g) {
      g = { key: chapterId, chapter, items: [] };
      byChapterId.set(chapterId, g);
      groups.push(g);
    } else if (chapter && !g.chapter) {
      g.chapter = chapter;
    }
    return g;
  };

  for (const lesson of lessons) {
    const pid = String(lesson.parentChapterId ?? "").trim();

    if (lesson.kind === "chapter" && !pid) {
      ensureGroup(lesson.id, lesson);
      continue;
    }

    if (pid) {
      const parent = lessons.find((l) => l.id === pid) ?? null;
      const g = ensureGroup(pid, parent?.kind === "chapter" ? parent : null);
      g.items.push(lesson);
      continue;
    }

    groups.push({ key: lesson.id, chapter: lesson, items: [] });
  }

  return groups;
}

export function outlineKeysContainingLesson(
  groups: OutlineChapterGroup[],
  lessonId: string,
): string[] {
  const keys: string[] = [];
  for (const g of groups) {
    if (g.chapter?.id === lessonId || g.items.some((i) => i.id === lessonId)) {
      keys.push(g.key);
    }
  }
  return keys;
}
