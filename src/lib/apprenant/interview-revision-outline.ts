import type { LearnerLesson, LearnerModule } from "@/lib/queries/apprenant";

export type RevisionLessonItem = {
  id: string;
  title: string;
  kind: "chapter" | "subchapter";
  href: string;
};

function isAssessmentLesson(lesson: LearnerLesson): boolean {
  if (lesson.kind === "quiz" || lesson.kind === "experiential_interview" || lesson.kind === "test") {
    return true;
  }
  return /entretien\s+exp[eé]rientiel/i.test(lesson.title ?? "");
}

export function resolveInterviewParentChapterTitle(
  allLessons: LearnerLesson[],
  interviewLesson: LearnerLesson,
): string {
  const parentId = String(interviewLesson.parentChapterId ?? "").trim();
  if (parentId) {
    const parent = allLessons.find((l) => l.id === parentId);
    if (parent?.title?.trim()) return parent.title.trim();
  }
  const title = String(interviewLesson.title ?? "").trim();
  if (title && !/entretien/i.test(title)) return title;
  return "ce chapitre";
}

export function buildInterviewRevisionOutline(
  modules: LearnerModule[],
  interviewLesson: LearnerLesson,
  playBaseHref: string,
): RevisionLessonItem[] {
  const base = playBaseHref.replace(/\/$/, "");
  const hrefFor = (lessonId: string) => `${base}/play/${lessonId}`;
  const allLessons = modules.flatMap((m) => m.lessons ?? []);
  const parentId = String(interviewLesson.parentChapterId ?? "").trim();
  const items: RevisionLessonItem[] = [];
  const seen = new Set<string>();

  const push = (lesson: LearnerLesson, kind: "chapter" | "subchapter") => {
    if (!lesson.id || seen.has(lesson.id)) return;
    if (lesson.id === interviewLesson.id) return;
    if (isAssessmentLesson(lesson)) return;
    seen.add(lesson.id);
    items.push({
      id: lesson.id,
      title: lesson.title?.trim() || "Sans titre",
      kind,
      href: hrefFor(lesson.id),
    });
  };

  if (parentId) {
    const parent = allLessons.find((l) => l.id === parentId);
    if (parent) push(parent, "chapter");
    for (const lesson of allLessons) {
      if (String(lesson.parentChapterId ?? "") !== parentId) continue;
      push(lesson, lesson.kind === "chapter" ? "chapter" : "subchapter");
    }
    return items;
  }

  const module = modules.find((m) => (m.lessons ?? []).some((l) => l.id === interviewLesson.id));
  for (const lesson of module?.lessons ?? []) {
    push(lesson, lesson.kind === "chapter" ? "chapter" : "subchapter");
  }
  return items;
}
