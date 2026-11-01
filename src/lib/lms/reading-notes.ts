import { htmlToPlain } from "@/lib/lms/html-plain";

export type NoteKind = "highlight" | "personal" | "schema" | "summary";

export type ReadingAnchor = {
  blockId: string;
  offset: number;
  excerpt: string;
};

export type ReadingNote = {
  id: string;
  kind: NoteKind;
  action: string;
  courseId: string | null;
  lessonId: string | null;
  chapterLocalId: string | null;
  excerpt: string;
  personalNote: string;
  schema: unknown;
  summary: string;
  anchor: ReadingAnchor | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteChapter = {
  id: string;
  number: number;
  title: string;
  lessons: Array<{ id: string; title: string }>;
};

function readable(value: string): string {
  return htmlToPlain(value)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_]{1,3}([^*_\n]+)[*_]{1,3}/g, "$1")
    .replace(/([a-zàâäéèêëïîôùûüç])([A-ZÀÂÄÉÈÊËÏÎÔÙÛÜ])/g, "$1 $2")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function noteKindOf(action: string, personalNote?: string | null): NoteKind {
  if (personalNote?.trim() && action === "personal") return "personal";
  if (action === "schema" || action === "mindmap") return "schema";
  if (action === "highlight") return "highlight";
  if (action === "personal") return "personal";
  return "summary";
}

export function kindLabel(kind: NoteKind): string {
  if (kind === "highlight") return "Surligné";
  if (kind === "schema") return "Schéma";
  if (kind === "personal") return "Note";
  return "Résumé";
}

export function parseAnchor(value: unknown): ReadingAnchor | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const excerpt = htmlToPlain(String(raw.excerpt ?? ""));
  if (!excerpt && !raw.blockId) return null;
  return {
    blockId: String(raw.blockId ?? ""),
    offset: Number(raw.offset) || 0,
    excerpt: excerpt.slice(0, 180),
  };
}

export function schemaBlocks(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const data = value as Record<string, unknown>;
  if (Array.isArray(data.steps)) {
    return data.steps
      .map((step) => {
        if (typeof step === "string") return htmlToPlain(step);
        if (step && typeof step === "object" && "title" in step) return htmlToPlain(String((step as { title?: string }).title ?? ""));
        return "";
      })
      .filter(Boolean);
  }
  if (Array.isArray(data.nodes)) {
    return data.nodes
      .map((node) => (node && typeof node === "object" ? htmlToPlain(String((node as { label?: string; title?: string }).label ?? (node as { title?: string }).title ?? "")) : ""))
      .filter(Boolean);
  }
  if (typeof data.name === "string") {
    const children = Array.isArray(data.children) ? data.children : [];
    return [htmlToPlain(data.name), ...children.map((child) => (child && typeof child === "object" ? htmlToPlain(String((child as { name?: string }).name ?? "")) : ""))].filter(Boolean);
  }
  return [];
}

export function mapReadingNote(item: {
  id?: string;
  action?: string;
  created_at?: string;
  updated_at?: string;
  course_id?: string | null;
  lesson_id?: string | null;
  chapter_local_id?: string | null;
  selection_excerpt?: string | null;
  note_kind?: string | null;
  personal_note?: string | null;
  anchor?: unknown;
  options?: { personal_note?: string | null; anchor?: unknown } | null;
  transformation?: { result_text?: string | null; result_json?: unknown } | Array<{ result_text?: string | null; result_json?: unknown }> | null;
}): ReadingNote {
  const raw = item.transformation;
  const transformation = Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
  const action = String(item.action ?? "");
  const personalNote = readable(String(item.personal_note ?? item.options?.personal_note ?? ""));
  const kind = (item.note_kind as NoteKind | undefined) || noteKindOf(action, personalNote);
  const excerpt = readable(String(item.selection_excerpt ?? ""));
  const summary = readable(String(transformation?.result_text ?? ""));
  return {
    id: String(item.id ?? ""),
    kind: kind === "personal" || kind === "schema" || kind === "summary" || kind === "highlight" ? kind : noteKindOf(action),
    action,
    courseId: item.course_id ?? null,
    lessonId: item.lesson_id ?? null,
    chapterLocalId: item.chapter_local_id ?? null,
    excerpt,
    personalNote,
    schema: transformation?.result_json ?? null,
    summary,
    anchor: parseAnchor(item.anchor) ?? parseAnchor(item.options?.anchor) ?? (excerpt ? { blockId: "", offset: 0, excerpt: excerpt.slice(0, 180) } : null),
    createdAt: String(item.created_at ?? ""),
    updatedAt: String(item.updated_at ?? item.created_at ?? ""),
  };
}

export function revealReadingAnchor(root: ParentNode, anchor: ReadingAnchor | null): boolean {
  if (!anchor) return false;
  const safeId = anchor.blockId.replace(/[^a-zA-Z0-9_-]/g, "");
  let target: Element | null = safeId ? root.querySelector(`[data-note-block="${safeId}"]`) : null;
  const needle = anchor.excerpt.replace(/\s+/g, " ").trim().slice(0, 48);
  if (!target && needle) {
    target = Array.from(root.querySelectorAll("[data-note-block]")).find((node) => (node.textContent ?? "").replace(/\s+/g, " ").includes(needle)) ?? null;
  }
  if (!target) return false;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("lesson-note-flash");
  void (target as HTMLElement).offsetWidth;
  target.classList.add("lesson-note-flash");
  window.setTimeout(() => target?.classList.remove("lesson-note-flash"), 2000);
  return true;
}

export function lessonKey(note: ReadingNote): string {
  return note.chapterLocalId || note.lessonId || "";
}

export function locateNote(note: ReadingNote, chapters: NoteChapter[]) {
  const key = lessonKey(note);
  for (const chapter of chapters) {
    const lessonIndex = chapter.lessons.findIndex((lesson) => lesson.id === key || lesson.id === note.lessonId);
    if (lessonIndex >= 0) {
      return { chapter, lesson: chapter.lessons[lessonIndex], lessonIndex, chapterOrder: chapter.number };
    }
    if (chapter.id === key) return { chapter, lesson: null, lessonIndex: -1, chapterOrder: chapter.number };
  }
  return { chapter: null, lesson: null, lessonIndex: 9999, chapterOrder: 9999 };
}
