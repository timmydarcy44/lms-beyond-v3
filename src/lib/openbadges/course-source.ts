export type CourseChapterSource = {
  title: string;
  text: string;
};

export type CourseSectionSource = {
  index: number;
  title: string;
  hours: number | null;
  chapters: CourseChapterSource[];
  text: string;
};

export type CourseInterview = {
  sectionTitle: string;
  context: string;
  objectives: string;
};

export type CourseQuizRef = {
  id: string;
  title: string;
  prompts: string[];
};

export type TruncationNote = {
  section: string;
  originalChars: number;
  keptChars: number;
};

export type CourseSource = {
  title: string;
  presentation: string;
  objectives: string[];
  prerequisites: string[];
  sections: CourseSectionSource[];
  interviews: CourseInterview[];
  quizIds: string[];
  totalHours: number | null;
};

const SECTION_CHAR_CAP = 100000;

export function hoursFromLabel(label: string): number | null {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*h/i);
  if (!match) return null;
  const value = Number(match[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return decodeEntities(value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|li|div)>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToMarkedText(html: string): string {
  let source = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
    .replace(/<div[^>]*data-youtube-video[^>]*>[\s\S]*?<\/div>/gi, " ");
  source = source.replace(
    /<div[^>]*>[\s\S]*?<strong>\s*(Définition|Exemple concret|Exemple|À retenir)\s*:?\s*<\/strong>\s*([\s\S]*?)<\/div>/gi,
    (_all, kind: string, body: string) => {
      const label = /définition/i.test(kind) ? "Définition" : /retenir/i.test(kind) ? "À retenir" : "Exemple";
      return `\n[${label}] ${stripTags(body)}\n`;
    },
  );
  return stripTags(source);
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asText(item)).filter(Boolean);
}

function chapterText(chapter: Record<string, unknown>): string {
  const own = htmlToMarkedText(asText(chapter.content) || asText(chapter.summary));
  const subs = Array.isArray(chapter.subchapters) ? chapter.subchapters : [];
  const blocks = subs.flatMap((sub) => {
    if (!sub || typeof sub !== "object") return [];
    const row = sub as Record<string, unknown>;
    const title = asText(row.title);
    const body = htmlToMarkedText([asText(row.content), asText(row.summary)].filter(Boolean).join("\n"));
    const interviewContext = asText(row.interview_context);
    const interviewObjectives = asText(row.interview_objectives);
    const titledInterview = /entretien expérientiel/i.test(title) ? `[Entretien expérientiel]\n${title}` : "";
    const titledPractice = /atelier|jeu interactif|mise en situation/i.test(title) ? `[Activité] ${title}` : "";
    const interview = interviewContext || interviewObjectives
      ? `[Entretien expérientiel]\n${interviewContext}${interviewObjectives ? `\nObjectifs de l'entretien : ${interviewObjectives}` : ""}`
      : titledInterview;
    const situation = row.situation_public && typeof row.situation_public === "object"
      ? asText((row.situation_public as { learnerBrief?: string }).learnerBrief)
      : "";
    const text = [body, interview, titledPractice, situation ? `[Mise en situation] ${situation}` : ""].filter(Boolean).join("\n");
    if (!title && !text) return [];
    return [`### ${title || "Sous-chapitre"}\n${text}`.trim()];
  });
  return [own, ...blocks].filter(Boolean).join("\n\n").trim();
}

export function buildCourseSource(row: Record<string, unknown>): CourseSource {
  const snapshot = row.builder_snapshot && typeof row.builder_snapshot === "object"
    ? row.builder_snapshot as Record<string, unknown>
    : {};
  const general = snapshot.general && typeof snapshot.general === "object"
    ? snapshot.general as Record<string, unknown>
    : {};
  const title = asText(row.title) || asText(general.title) || "Formation";
  const presentation = htmlToMarkedText([asText(row.presentation), asText(general.presentation), asText(row.description), asText(general.description)].filter(Boolean).join("\n\n"));
  const objectives = [...stringList(general.objectifs), ...stringList(general.objectives), ...stringList(snapshot.objectives)];
  const prerequisites = stringList(general.prerequisites);
  const sectionsRaw = Array.isArray(snapshot.sections) ? snapshot.sections : [];
  const interviews: CourseInterview[] = [];
  const quizIds = new Set<string>();
  const visitIds = (value: unknown, key: string) => {
    if (typeof value === "string") {
      const fromQuery = value.match(/testId=([0-9a-f-]{36})/i)?.[1];
      if (fromQuery) quizIds.add(fromQuery);
      if ((key === "quiz_id" || key === "test_id" || key === "badge_quiz_test_id") && /^[0-9a-f-]{36}$/i.test(value)) quizIds.add(value);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => visitIds(item, key));
    else if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) visitIds(child, childKey);
    }
  };
  visitIds(snapshot, "snapshot");

  const sections: CourseSectionSource[] = sectionsRaw.flatMap((section, index) => {
    if (!section || typeof section !== "object") return [];
    const rowSection = section as Record<string, unknown>;
    if (rowSection.deleted_at) return [];
    const sectionTitle = asText(rowSection.title) || `Section ${index + 1}`;
    const chaptersRaw = Array.isArray(rowSection.chapters) ? rowSection.chapters : [];
    const chapters: CourseChapterSource[] = chaptersRaw.flatMap((chapter) => {
      if (!chapter || typeof chapter !== "object") return [];
      const chapterRow = chapter as Record<string, unknown>;
      if (chapterRow.deleted_at) return [];
      const text = chapterText(chapterRow);
      const subs = Array.isArray(chapterRow.subchapters) ? chapterRow.subchapters : [];
      for (const sub of subs) {
        if (!sub || typeof sub !== "object") continue;
        const subRow = sub as Record<string, unknown>;
        const context = asText(subRow.interview_context);
        if (!context && !asText(subRow.interview_objectives)) continue;
        interviews.push({
          sectionTitle,
          context,
          objectives: asText(subRow.interview_objectives),
        });
      }
      if (!text && !asText(chapterRow.title)) return [];
      return [{ title: asText(chapterRow.title) || "Chapitre", text }];
    });
    const hours = hoursFromLabel(sectionTitle);
    const body = chapters.map((chapter) => `## ${chapter.title}\n${chapter.text}`.trim()).join("\n\n");
    const heading = hours != null && !/\d/.test(sectionTitle)
      ? `# Section ${index + 1} · ${sectionTitle} · ${hours} h`
      : `# Section ${index + 1} · ${sectionTitle}`;
    const text = `${heading}\n${body}`.trim();
    return [{ index: index + 1, title: sectionTitle, hours, chapters, text }];
  });
  const total = sections.reduce((sum, section) => sum + (section.hours ?? 0), 0);
  return {
    title,
    presentation,
    objectives: [...new Set(objectives)],
    prerequisites,
    sections,
    interviews,
    quizIds: [...quizIds],
    totalHours: total > 0 ? total : null,
  };
}

export function sectionPromptText(section: CourseSectionSource, notes: TruncationNote[]): string {
  if (section.text.length <= SECTION_CHAR_CAP) return section.text;
  notes.push({ section: section.title, originalChars: section.text.length, keptChars: SECTION_CHAR_CAP });
  return `${section.text.slice(0, SECTION_CHAR_CAP)}\n\n[Texte coupé : ${section.text.length - SECTION_CHAR_CAP} caractères non envoyés pour cette section.]`;
}

export function quizPromptsFromRow(row: Record<string, unknown>): string[] {
  const prompts: string[] = [];
  const visit = (value: unknown, key: string) => {
    if (typeof value === "string") {
      const text = value.trim();
      if (text.length > 12 && /question|prompt|text|title|label/i.test(key)) prompts.push(text);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => visit(item, key));
    else if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) visit(child, childKey);
    }
  };
  visit(row.questions, "questions");
  return [...new Set(prompts)].slice(0, 80);
}
