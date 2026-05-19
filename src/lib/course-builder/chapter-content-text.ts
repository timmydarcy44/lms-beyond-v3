import type { CourseBuilderChapter, CourseBuilderSubchapter } from "@/types/course-builder";

export const CHAPTER_ASSESSMENT_KINDS = ["quiz", "experiential_interview"] as const;

export function isChapterAssessmentKind(kind?: string | null): boolean {
  return CHAPTER_ASSESSMENT_KINDS.includes(kind as (typeof CHAPTER_ASSESSMENT_KINDS)[number]);
}

/** Sépare le contenu pédagogique des blocs de fin de chapitre (quiz, entretien). */
export function partitionChapterSubchapters(subchapters: CourseBuilderSubchapter[] | undefined) {
  const learning: CourseBuilderSubchapter[] = [];
  const assessments: CourseBuilderSubchapter[] = [];
  for (const sub of subchapters ?? []) {
    if (isChapterAssessmentKind((sub as { kind?: string }).kind)) assessments.push(sub);
    else learning.push(sub);
  }
  return { learning, assessments };
}

/** Insère un bloc quiz / entretien toujours après le dernier sous-chapitre « cours ». */
export function appendChapterAssessment(
  subchapters: CourseBuilderSubchapter[],
  block: CourseBuilderSubchapter,
  replaceKind?: string,
): CourseBuilderSubchapter[] {
  const { learning, assessments } = partitionChapterSubchapters(subchapters);
  const kept = replaceKind
    ? assessments.filter((a) => String((a as { kind?: string }).kind ?? "") !== replaceKind)
    : assessments;
  return [...learning, ...kept, block];
}

/** Nouveau sous-chapitre pédagogique inséré avant les blocs de fin de chapitre. */
export function insertLearningSubchapter(
  subchapters: CourseBuilderSubchapter[],
  sub: CourseBuilderSubchapter,
): CourseBuilderSubchapter[] {
  const { learning, assessments } = partitionChapterSubchapters(subchapters);
  return [...learning, sub, ...assessments];
}

function stripHtml(html?: string | null): string {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Texte brut du chapitre (contenu + sous-chapitres) pour quiz / entretien IA. */
export function extractChapterPlainText(chapter: CourseBuilderChapter): string {
  const parts: string[] = [];
  const main = stripHtml(chapter.content) || stripHtml(chapter.summary);
  if (main) parts.push(main);
  for (const sub of chapter.subchapters ?? []) {
    if (isChapterAssessmentKind((sub as { kind?: string }).kind)) {
      continue;
    }
    const t = stripHtml(sub.content) || stripHtml(sub.summary);
    if (t) parts.push(`${sub.title ? `${sub.title}: ` : ""}${t}`);
  }
  return parts.join("\n\n").trim();
}

export function buildChapterQuizPayload(
  sectionTitle: string,
  chapter: CourseBuilderChapter,
): { section: string; chapters: { chapter: string; content: string; subchapters: { title: string; content: string }[] }[] } {
  return {
    section: sectionTitle,
    chapters: [
      {
        chapter: chapter.title || "Chapitre",
        content: extractChapterPlainText(chapter),
        subchapters: (chapter.subchapters ?? [])
          .filter((s) => !isChapterAssessmentKind((s as { kind?: string }).kind))
          .map((sub) => ({
            title: sub.title || "",
            content: stripHtml(sub.content) || stripHtml(sub.summary) || "",
          })),
      },
    ],
  };
}
