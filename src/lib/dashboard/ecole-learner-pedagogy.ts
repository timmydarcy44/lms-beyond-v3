import type { SupabaseClient } from "@supabase/supabase-js";

export type EcoleLearnerCourseProgressRow = {
  courseId: string;
  title: string | null;
  progressPercent: number | null;
  lastAccessedAt: string | null;
  enrolledAt: string | null;
};

export type EcoleLearnerQuizSummary = {
  testId: string;
  testTitle: string | null;
  attemptCount: number;
  bestScore: number;
  lastScore: number;
  lastAt: string;
  lastAnswers: Record<string, unknown> | null;
  lastReview: Record<string, unknown> | null;
};

export type EcoleLearnerTransformationFavorite = {
  action: string;
  count: number;
};

export type EcoleLearnerPedagogySnapshot = {
  courses: EcoleLearnerCourseProgressRow[];
  quizzes: EcoleLearnerQuizSummary[];
  transformations: EcoleLearnerTransformationFavorite[];
};

type EnrollmentRow = {
  course_id: string;
  role?: string | null;
  created_at?: string | null;
  courses?: { id?: string; title?: string | null; status?: string | null } | null;
};

type ProgressRow = {
  course_id: string;
  progress_percent?: number | null;
  last_accessed_at?: string | null;
};

type QuizRow = {
  test_id: string;
  score: number;
  answers: Record<string, unknown> | null;
  created_at: string;
  tests?: { title?: string | null } | null;
};

type TransformRow = {
  action: string;
};

function isIgnorableSchemaMessage(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("column") && m.includes("not exist")
  );
}

export async function fetchEcoleLearnerPedagogy(
  client: SupabaseClient,
  learnerId: string,
): Promise<EcoleLearnerPedagogySnapshot> {
  const courses: EcoleLearnerCourseProgressRow[] = [];
  const quizzes: EcoleLearnerQuizSummary[] = [];
  const transformations: EcoleLearnerTransformationFavorite[] = [];

  const safe = async <T>(fn: () => Promise<{ data: T | null; error: { message: string } | null }>) => {
    try {
      const r = await fn();
      if (r.error) {
        if (process.env.NODE_ENV === "development" && !isIgnorableSchemaMessage(r.error.message)) {
          console.warn("[ecole-learner-pedagogy]", r.error.message);
        }
        return null;
      }
      return r.data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (process.env.NODE_ENV === "development" && !isIgnorableSchemaMessage(msg)) {
        console.warn("[ecole-learner-pedagogy]", e);
      }
      return null;
    }
  };

  const [enrollments, progressRows, quizRowsRaw, transformRows] = await Promise.all([
    safe(() =>
      client
        .from("enrollments")
        .select("course_id, role, created_at, courses(id, title, status)")
        .eq("user_id", learnerId)
        .order("created_at", { ascending: false })
        .limit(80),
    ),
    safe(() =>
      client.from("course_progress").select("course_id, progress_percent, last_accessed_at").eq("user_id", learnerId),
    ),
    (async () => {
      const withTests = await safe(() =>
        client
          .from("quiz_submissions")
          .select("test_id, score, answers, created_at, tests(title)")
          .eq("user_id", learnerId)
          .order("created_at", { ascending: false })
          .limit(400),
      );
      if (withTests != null) return withTests;
      return safe(() =>
        client
          .from("quiz_submissions")
          .select("test_id, score, answers, created_at")
          .eq("user_id", learnerId)
          .order("created_at", { ascending: false })
          .limit(400),
      );
    })(),
    safe(() =>
      client.from("lesson_ai_user_transformations").select("action").eq("user_id", learnerId).limit(2000),
    ),
  ]);

  const progressByCourse = new Map<string, ProgressRow>();
  for (const p of (progressRows ?? ([] as ProgressRow[])) as ProgressRow[]) {
    if (p.course_id) progressByCourse.set(p.course_id, p);
  }

  const seenCourse = new Set<string>();
  for (const row of (enrollments ?? ([] as EnrollmentRow[])) as EnrollmentRow[]) {
    const cid = row.course_id;
    if (!cid || seenCourse.has(cid)) continue;
    if (String(row.role ?? "").trim() === "instructor_assistant") continue;
    seenCourse.add(cid);
    const c = row.courses;
    const pr = progressByCourse.get(cid);
    courses.push({
      courseId: cid,
      title: c?.title ?? null,
      progressPercent: pr?.progress_percent ?? null,
      lastAccessedAt: pr?.last_accessed_at ?? null,
      enrolledAt: row.created_at ?? null,
    });
  }

  const quizRows = (quizRowsRaw ?? []) as QuizRow[];

  const byTest = new Map<string, QuizRow[]>();
  for (const q of quizRows) {
    const tid = q.test_id;
    if (!tid) continue;
    const list = byTest.get(tid) ?? [];
    list.push(q);
    byTest.set(tid, list);
  }

  for (const [testId, list] of byTest) {
    const sorted = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const last = sorted[0];
    const bestScore = Math.max(...sorted.map((s) => s.score ?? 0));
    quizzes.push({
      testId,
      testTitle: last.tests?.title ?? null,
      attemptCount: sorted.length,
      bestScore,
      lastScore: last.score ?? 0,
      lastAt: last.created_at,
      lastAnswers: last.answers ?? null,
      lastReview: null,
    });
  }
  quizzes.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  const actionCount = new Map<string, number>();
  for (const t of (transformRows ?? ([] as TransformRow[])) as TransformRow[]) {
    const a = (t.action || "").trim() || "—";
    actionCount.set(a, (actionCount.get(a) ?? 0) + 1);
  }
  for (const [action, count] of actionCount) {
    transformations.push({ action, count });
  }
  transformations.sort((a, b) => b.count - a.count);

  return { courses, quizzes, transformations };
}
