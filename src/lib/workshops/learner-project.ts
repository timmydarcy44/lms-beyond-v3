import { isCourseNodeVisible } from "@/lib/courses/visible-structure";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { readWorkshopConfig, workshopMode } from "@/lib/workshops/workshop-block";

export type ExpertProjectFeedback = {
  criteres: { critere: string; statut: "reussi" | "a_ameliorer"; commentaire: string; suggestion: string }[];
  commentaire_global: string;
};

export type ExpertProjectAnswer = { label: string; value: string };

export type ExpertProjectWorkshop = {
  id: string;
  title: string;
  chapterTitle: string;
  href: string;
  validated: boolean;
  validatedAt: string | null;
  answers: ExpertProjectAnswer[];
  feedback: ExpertProjectFeedback | null;
};

export type ExpertProjectCourse = {
  id: string;
  title: string;
  workshops: ExpertProjectWorkshop[];
};

export type ExpertProject = {
  courses: ExpertProjectCourse[];
  validated: number;
  total: number;
};

type OutputRow = {
  course_id: string;
  block_id: string;
  version: number;
  answers: Record<string, unknown> | null;
  ai_feedback: unknown;
  is_final: boolean;
  updated_at: string | null;
};

function readFeedback(raw: unknown): ExpertProjectFeedback | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const criteres = Array.isArray(value.criteres)
    ? value.criteres.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        const statut = row.statut === "reussi" ? "reussi" : row.statut === "a_ameliorer" ? "a_ameliorer" : null;
        if (!statut) return [];
        return [
          {
            critere: typeof row.critere === "string" ? row.critere : "Critère",
            statut,
            commentaire: typeof row.commentaire === "string" ? row.commentaire : "",
            suggestion: typeof row.suggestion === "string" ? row.suggestion : "",
          },
        ];
      })
    : [];
  const commentaire = typeof value.commentaire_global === "string" ? value.commentaire_global : "";
  if (!criteres.length && !commentaire.trim()) return null;
  return { criteres, commentaire_global: commentaire };
}

function readAnswers(raw: Record<string, unknown> | null | undefined) {
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (typeof value === "string" && value.trim()) answers[key] = value.trim();
  }
  return answers;
}

function visibleCourse(status: unknown) {
  return status === "published" || status === "active" || status == null || status === "";
}

type AtelierBlock = {
  id: string;
  title: string;
  chapterTitle: string;
  href: string;
  fields: { id: string; label: string }[];
};

function ateliersFromSnapshot(snapshotRaw: unknown, slug: string): AtelierBlock[] {
  const snapshot =
    typeof snapshotRaw === "string"
      ? (() => {
          try {
            return JSON.parse(snapshotRaw) as { sections?: unknown; general?: { parcours_only?: unknown } };
          } catch {
            return null;
          }
        })()
      : (snapshotRaw as { sections?: unknown; general?: { parcours_only?: unknown } } | null);
  if (snapshot?.general?.parcours_only) return [];
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : [];
  const blocks: AtelierBlock[] = [];
  for (const section of sections) {
    if (!section || typeof section !== "object" || !isCourseNodeVisible(section as { deleted_at?: string | null })) continue;
    const chapters = Array.isArray((section as { chapters?: unknown }).chapters)
      ? (section as { chapters: unknown[] }).chapters
      : [];
    for (const chapter of chapters) {
      if (!chapter || typeof chapter !== "object" || !isCourseNodeVisible(chapter as { deleted_at?: string | null })) continue;
      const chapterTitle = String((chapter as { title?: unknown }).title ?? "").trim() || "Chapitre";
      const subs = Array.isArray((chapter as { subchapters?: unknown }).subchapters)
        ? (chapter as { subchapters: unknown[] }).subchapters
        : [];
      for (const sub of subs) {
        if (!sub || typeof sub !== "object" || !isCourseNodeVisible(sub as { deleted_at?: string | null })) continue;
        const row = sub as { id?: unknown; title?: unknown; kind?: unknown; workshop?: unknown };
        if (row.kind !== "case_study") continue;
        const workshop = readWorkshopConfig(row.workshop);
        if (workshopMode(workshop) !== "atelier") continue;
        const id = String(row.id ?? "").trim();
        if (!id) continue;
        blocks.push({
          id,
          title: String(row.title ?? "").trim() || "Atelier",
          chapterTitle,
          href: `/catalog/formations/${encodeURIComponent(slug)}/play/${encodeURIComponent(id)}`,
          fields: (workshop?.fields ?? []).map((field) => ({ id: field.id, label: field.label })),
        });
      }
    }
  }
  return blocks;
}

export async function loadExpertProject(): Promise<ExpertProject | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const db = getServiceRoleClient() ?? supabase;
  const { data: enrollments, error: enrollError } = await db
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id);
  if (enrollError) return { courses: [], validated: 0, total: 0 };

  const courseIds = [...new Set((enrollments ?? []).map((row) => String(row.course_id ?? "")).filter(Boolean))];
  if (!courseIds.length) return { courses: [], validated: 0, total: 0 };

  const { data: courses, error: courseError } = await db
    .from("courses")
    .select("id, title, slug, status, builder_snapshot")
    .in("id", courseIds);
  if (courseError) return { courses: [], validated: 0, total: 0 };

  const { data: outputs } = await db
    .from("learner_workshop_outputs")
    .select("course_id, block_id, version, answers, ai_feedback, is_final, updated_at")
    .eq("user_id", user.id)
    .in("course_id", courseIds);

  const byBlock = new Map<string, OutputRow[]>();
  for (const row of (outputs ?? []) as OutputRow[]) {
    const key = `${row.course_id}:${row.block_id}`;
    const list = byBlock.get(key) ?? [];
    list.push(row);
    byBlock.set(key, list);
  }

  const projectCourses: ExpertProjectCourse[] = [];
  let validated = 0;
  let total = 0;

  for (const course of courses ?? []) {
    if (!visibleCourse(course.status)) continue;
    const slug = String(course.slug || course.id);
    const blocks = ateliersFromSnapshot(course.builder_snapshot, slug);
    if (!blocks.length) continue;
    const workshops: ExpertProjectWorkshop[] = blocks.map((block) => {
      const rows = (byBlock.get(`${course.id}:${block.id}`) ?? []).sort((a, b) => b.version - a.version);
      const finalRow = rows.find((row) => row.is_final) ?? null;
      const stored = readAnswers(finalRow?.answers);
      const answers = block.fields
        .map((field) => ({ label: field.label.trim() || "Réponse", value: stored[field.id] ?? "" }))
        .filter((item) => item.value);
      total += 1;
      if (finalRow) validated += 1;
      return {
        id: block.id,
        title: block.title,
        chapterTitle: block.chapterTitle,
        href: block.href,
        validated: Boolean(finalRow),
        validatedAt: finalRow?.updated_at ?? null,
        answers,
        feedback: finalRow ? readFeedback(rows.find((row) => readFeedback(row.ai_feedback))?.ai_feedback) : null,
      };
    });
    projectCourses.push({
      id: String(course.id),
      title: String(course.title || "Formation"),
      workshops,
    });
  }

  projectCourses.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  return { courses: projectCourses, validated, total };
}
