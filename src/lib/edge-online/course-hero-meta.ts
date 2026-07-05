import type { LearnerCard } from "@/lib/queries/apprenant";

export type CourseHeroMeta = {
  rating: number;
  learners: number;
  sequences: number;
  hours: number;
  level: string;
  badge: string;
};

function hashCourseId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function parseBuilderSnapshot(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  let snap: unknown = raw;
  if (typeof raw === "string") {
    try {
      snap = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof snap !== "object" || snap == null || Array.isArray(snap)) return null;
  return snap as Record<string, unknown>;
}

function countSequencesFromSnapshot(raw: unknown): number | null {
  const snap = parseBuilderSnapshot(raw);
  if (!snap) return null;
  const modules = snap.modules;
  if (Array.isArray(modules) && modules.length > 0) return modules.length;
  const chapters = snap.chapters;
  if (Array.isArray(chapters) && chapters.length > 0) return chapters.length;
  const sections = snap.sections;
  if (Array.isArray(sections) && sections.length > 0) return sections.length;
  return null;
}

export function deriveCourseHeroMeta(card: LearnerCard | null | undefined): CourseHeroMeta {
  const id = String(card?.id ?? card?.slug ?? "course");
  const hash = hashCourseId(id);
  const sequences = countSequencesFromSnapshot(card?.builder_snapshot) ?? 12 + (hash % 24);

  return {
    rating: 4.8,
    learners: 120 + (hash % 480),
    sequences,
    hours: 4 + (hash % 10),
    level: String(card?.level ?? "").trim() || "Intermédiaire",
    badge: "Badge EDGE",
  };
}

export function deriveCourseCardMeta(card: LearnerCard | null | undefined): CourseHeroMeta & {
  progress: number | null;
  category: string | null;
} {
  const base = deriveCourseHeroMeta(card);
  return {
    ...base,
    progress: card?.progress ?? null,
    category: String(card?.category_name ?? card?.category ?? "").trim() || null,
  };
}
