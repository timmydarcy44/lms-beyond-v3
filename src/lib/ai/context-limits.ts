/**
 * Plafonds de contexte envoyé à OpenAI — limite les coûts par appel.
 */

export const AI_CONTEXT_LIMITS = {
  CHAPTER_TEXT_MAX: 1_200,
  SUBCHAPTER_TEXT_MAX: 800,
  QUIZ_PAYLOAD_MAX_CHARS: 24_000,
  INTERVIEW_CONTEXT_MAX: 6_000,
  INTERVIEW_OBJECTIVES_MAX: 1_500,
  INTERVIEW_MESSAGE_MAX: 2_000,
  INTERVIEW_MAX_MESSAGES: 8,
  NEVO_COURSE_TEXT_MAX: 5_000,
  NEVO_MAX_MESSAGES: 10,
  EDGE_TRANSCRIPT_MAX_CHARS: 8_000,
  EDGE_MAX_HISTORY_MESSAGES: 14,
} as const;

export function truncateText(value: string, max: number): string {
  const text = String(value ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

type QuizChapter = {
  section?: string;
  chapter?: string;
  content?: string;
  subchapters?: Array<{ title?: string; content?: string }>;
};

type QuizSection = {
  section?: string;
  chapters?: QuizChapter[];
};

/** Réduit le payload chapitres pour rester sous un budget total de caractères. */
export function capChapitresForQuiz(
  chapitres: QuizSection[],
  maxTotal = AI_CONTEXT_LIMITS.QUIZ_PAYLOAD_MAX_CHARS,
): QuizSection[] {
  let used = 0;
  const result: QuizSection[] = [];

  for (const section of chapitres) {
    const cappedChapters: QuizChapter[] = [];

    for (const chapter of section.chapters ?? []) {
      const chapterTitle = truncateText(String(chapter.chapter ?? ""), 200);
      let content = truncateText(String(chapter.content ?? ""), AI_CONTEXT_LIMITS.CHAPTER_TEXT_MAX);
      const subchapters: Array<{ title?: string; content?: string }> = [];

      for (const sub of chapter.subchapters ?? []) {
        const subEntry = {
          title: truncateText(String(sub.title ?? ""), 120),
          content: truncateText(String(sub.content ?? ""), AI_CONTEXT_LIMITS.SUBCHAPTER_TEXT_MAX),
        };
        const subSize = JSON.stringify(subEntry).length;
        if (used + subSize > maxTotal) break;
        used += subSize;
        subchapters.push(subEntry);
      }

      const entry: QuizChapter = {
        section: truncateText(String(chapter.section ?? section.section ?? ""), 120),
        chapter: chapterTitle,
        content,
        ...(subchapters.length ? { subchapters } : {}),
      };
      const entrySize = JSON.stringify(entry).length;
      if (used + entrySize > maxTotal) break;
      used += entrySize;
      cappedChapters.push(entry);
    }

    if (!cappedChapters.length) continue;

    const sectionEntry: QuizSection = {
      section: truncateText(String(section.section ?? ""), 120),
      chapters: cappedChapters,
    };
    result.push(sectionEntry);
    if (used >= maxTotal) break;
  }

  return result;
}

export function capChatMessages<T extends { role: string; content: string }>(
  messages: T[],
  maxMessages: number,
  maxContentChars: number,
): T[] {
  return messages
    .slice(-maxMessages)
    .map((m) => ({
      ...m,
      content: truncateText(m.content, maxContentChars),
    }));
}

export function capTranscript(text: string, maxChars = AI_CONTEXT_LIMITS.EDGE_TRANSCRIPT_MAX_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `…(historique tronqué)\n${trimmed.slice(-maxChars)}`;
}
