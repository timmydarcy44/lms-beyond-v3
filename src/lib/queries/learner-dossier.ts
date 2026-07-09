"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { fetchEcoleLearnerPedagogy } from "@/lib/dashboard/ecole-learner-pedagogy";
import {
  fetchLastSignInForUser,
} from "@/lib/queries/learner-tracking";
import {
  parseProfileAnalysisSections,
  parseStoredProfileAnalysis,
} from "@/lib/learner/profile-analysis";
import type { TestCategoryResult } from "@/types/test-result";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LearnerSkillInsight = {
  category: string;
  averagePercent: number;
  sampleCount: number;
  source: "catalog_test" | "quiz" | "mental_health" | "edge_mission";
};

export type LearnerDossierTestAttempt = {
  id: string;
  testId: string;
  testTitle: string;
  completedAt: string;
  attemptIndex: number;
  totalAttemptsForTest: number;
  percentage: number | null;
  score: number | null;
  maxScore: number | null;
  categoryResults: TestCategoryResult[];
  analysis: string | null;
};

export type LearnerCourseEngagement = {
  courseId: string;
  courseTitle: string | null;
  progressPercent: number | null;
  lastAccessedAt: string | null;
  enrolledAt: string | null;
  totalTimeSeconds: number;
  activeTimeSeconds: number;
  sessionCount: number;
  firstSessionAt: string | null;
  lastSessionAt: string | null;
};

export type LearnerFlashcardSession = {
  id: string;
  courseId: string | null;
  scopeId: string;
  courseTitle: string | null;
  totalCards: number;
  knownCount: number;
  unknownCount: number;
  knownPercent: number;
  durationSeconds: number;
  completedAt: string;
};

export type LearnerInterviewSession = {
  id: string;
  courseId: string | null;
  lessonId: string;
  interviewStyle: "coaching" | "experiential";
  chapterTitle: string | null;
  courseTitle: string | null;
  status: string;
  userTurnCount: number;
  durationSeconds: number;
  completedAt: string;
  feedback: {
    summary?: string;
    bien_dit?: string[];
    a_revoir?: string[];
    axes_amelioration?: string[];
  } | null;
};

export type LearnerCoachingActivity = {
  id: string;
  type:
    | "accompagnement_reservation"
    | "programme_request"
    | "personalized_path"
    | "edge_mission"
    | "path_trigger"
    | "ai_lesson";
  title: string;
  detail: string | null;
  status: string | null;
  occurredAt: string;
  strengths?: string[];
  improvements?: string[];
};

export type LearnerDossier = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
  totalActiveTimeSeconds: number;
  totalTimeSeconds: number;
  totalTestAttempts: number;
  totalQuizAttempts: number;
  courses: LearnerCourseEngagement[];
  catalogTests: LearnerDossierTestAttempt[];
  quizSummaries: Array<{
    testId: string;
    testTitle: string | null;
    attemptCount: number;
    bestScore: number;
    lastScore: number;
    lastAt: string;
  }>;
  strengths: LearnerSkillInsight[];
  weaknesses: LearnerSkillInsight[];
  coachingActivities: LearnerCoachingActivity[];
  flashcardSessions: LearnerFlashcardSession[];
  interviewSessions: LearnerInterviewSession[];
  profileAnalysis: {
    strengths: string[];
    improvements: string[];
    summary: string | null;
  } | null;
  aiTransformations: Array<{ action: string; count: number }>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isIgnorableSchemaMessage(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("schema cache") ||
    m.includes("does not exist") ||
    m.includes("could not find") ||
    (m.includes("column") && m.includes("not exist"))
  );
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

export { formatSeconds as formatLearnerDuration };

function normalizeCategoryResults(raw: unknown): TestCategoryResult[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((cat) => {
      if (!cat || typeof cat !== "object") return null;
      const c = cat as Record<string, unknown>;
      const score = Number(c.score ?? 0);
      const maxScore = Number(c.maxScore ?? c.max_score ?? 0);
      const percentage =
        typeof c.percentage === "number"
          ? c.percentage
          : maxScore > 0
            ? (score / maxScore) * 100
            : 0;
      const category = String(c.category ?? c.name ?? "").trim();
      if (!category) return null;
      return {
        category,
        score,
        maxScore,
        percentage,
        rank: typeof c.rank === "number" ? c.rank : undefined,
      };
    })
    .filter(Boolean) as TestCategoryResult[];
}

function aggregateSkillInsights(
  buckets: Array<{ categories: TestCategoryResult[]; source: LearnerSkillInsight["source"] }>,
): { strengths: LearnerSkillInsight[]; weaknesses: LearnerSkillInsight[] } {
  const map = new Map<string, { total: number; count: number; source: LearnerSkillInsight["source"] }>();

  for (const bucket of buckets) {
    for (const cat of bucket.categories) {
      const key = cat.category.trim();
      if (!key) continue;
      const prev = map.get(key) ?? { total: 0, count: 0, source: bucket.source };
      prev.total += cat.percentage ?? 0;
      prev.count += 1;
      map.set(key, prev);
    }
  }

  const all: LearnerSkillInsight[] = [...map.entries()].map(([category, v]) => ({
    category,
    averagePercent: Math.round(v.total / Math.max(1, v.count)),
    sampleCount: v.count,
    source: v.source,
  }));

  all.sort((a, b) => b.averagePercent - a.averagePercent);
  const strengths = all.filter((i) => i.averagePercent >= 55).slice(0, 6);
  const weaknesses = [...all].sort((a, b) => a.averagePercent - b.averagePercent).filter((i) => i.averagePercent < 55).slice(0, 6);

  return { strengths, weaknesses };
}

async function safeQuery<T>(
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
): Promise<T | null> {
  try {
    const r = await fn();
    if (r.error) {
      if (process.env.NODE_ENV === "development" && !isIgnorableSchemaMessage(r.error.message)) {
        console.warn("[learner-dossier]", r.error.message);
      }
      return null;
    }
    return r.data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (process.env.NODE_ENV === "development" && !isIgnorableSchemaMessage(msg)) {
      console.warn("[learner-dossier]", e);
    }
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main query
// ---------------------------------------------------------------------------

export async function getLearnerDossier(userId: string): Promise<LearnerDossier | null> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) return null;

  const supabase = getServiceRoleClient();
  if (!supabase) return null;

  try {
    const [
      profile,
      lastSignInAt,
      pedagogy,
      sessionsRaw,
      testAttemptsRaw,
      testAnalysesRaw,
      mentalHealthRaw,
      accompagnementReservations,
      programmeRequests,
      pathRequests,
      edgeMissions,
      pathTriggers,
      aiTransformationsRaw,
      flashcardSessionsRaw,
      interviewSessionsRaw,
    ] = await Promise.all([
      safeQuery(() =>
        supabase
          .from("profiles")
          .select("id, email, full_name, phone, created_at, ai_analysis")
          .eq("id", userId)
          .maybeSingle(),
      ),
      fetchLastSignInForUser(supabase, userId),
      fetchEcoleLearnerPedagogy(supabase, userId),
      safeQuery(() =>
        supabase
          .from("learning_sessions")
          .select(
            "content_type, content_id, duration_seconds, duration_active_seconds, started_at, ended_at",
          )
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(2000),
      ),
      safeQuery(() =>
        supabase
          .from("test_attempts")
          .select(
            `
            id, test_id, completed_at, created_at,
            total_score, max_score, percentage, score,
            category_results, answers,
            tests ( id, title )
          `,
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(500),
      ),
      safeQuery(() =>
        supabase
          .from("test_result_analyses")
          .select("attempt_id, analysis")
          .eq("user_id", userId)
          .limit(200),
      ),
      safeQuery(() =>
        supabase
          .from("mental_health_assessments")
          .select("id, completed_at, results, dimension_scores")
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("edge_accompagnement_reservations")
          .select("id, offer_name, offer_slug, status, payment_status, selected_slot, created_at, paid_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("edge_accompagnement_programme_requests")
          .select("id, objectif, besoin, disponibilite, message, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("edge_personalized_path_requests")
          .select("id, objective, support_preference, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("edge_challenge_runs")
          .select(
            "id, skill_name, summary, status, strengths, improvements, created_at, completed_at",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("path_trigger_submissions")
          .select("id, type, status, score, feedback, created_at, step_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
      ),
      safeQuery(() =>
        supabase
          .from("lesson_ai_user_transformations")
          .select("action, created_at, lesson_id, course_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(500),
      ),
      safeQuery(() =>
        supabase
          .from("flashcard_study_sessions")
          .select(
            "id, course_id, scope_id, total_cards, known_count, unknown_count, duration_seconds, completed_at",
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(100),
      ),
      safeQuery(() =>
        supabase
          .from("experiential_interview_sessions")
          .select(
            "id, course_id, lesson_id, interview_style, chapter_title, course_title, status, user_turn_count, duration_seconds, completed_at, feedback",
          )
          .eq("user_id", userId)
          .order("completed_at", { ascending: false })
          .limit(100),
      ),
    ]);

    if (!profile) return null;

    const analysisByAttempt = new Map<string, string>();
    for (const row of testAnalysesRaw ?? []) {
      const attemptId = (row as { attempt_id?: string }).attempt_id;
      const analysis = (row as { analysis?: string }).analysis;
      if (attemptId && analysis) analysisByAttempt.set(attemptId, analysis);
    }

    // --- Catalog test attempts ---
    type AttemptRow = {
      id: string;
      test_id: string;
      completed_at?: string | null;
      created_at?: string | null;
      total_score?: number | null;
      max_score?: number | null;
      percentage?: number | null;
      score?: number | null;
      category_results?: unknown;
      tests?: { title?: string | null } | { title?: string | null }[] | null;
    };

    const attemptsByTest = new Map<string, AttemptRow[]>();
    for (const row of (testAttemptsRaw ?? []) as AttemptRow[]) {
      const tid = row.test_id;
      if (!tid) continue;
      const list = attemptsByTest.get(tid) ?? [];
      list.push(row);
      attemptsByTest.set(tid, list);
    }

    const catalogTests: LearnerDossierTestAttempt[] = [];
    const categoryBuckets: Array<{ categories: TestCategoryResult[]; source: LearnerSkillInsight["source"] }> = [];

    for (const rows of attemptsByTest.values()) {
      const sorted = [...rows].sort(
        (a, b) =>
          new Date(b.completed_at ?? b.created_at ?? 0).getTime() -
          new Date(a.completed_at ?? a.created_at ?? 0).getTime(),
      );
      const total = sorted.length;
      sorted.forEach((row, idx) => {
        const testObj = Array.isArray(row.tests) ? row.tests[0] : row.tests;
        const cats = normalizeCategoryResults(row.category_results);
        if (cats.length > 0) {
          categoryBuckets.push({ categories: cats, source: "catalog_test" });
        }
        const score = row.total_score ?? row.score ?? null;
        const maxScore = row.max_score ?? null;
        let percentage = row.percentage ?? null;
        if (percentage == null && score != null && maxScore != null && maxScore > 0) {
          percentage = (Number(score) / Number(maxScore)) * 100;
        }
        catalogTests.push({
          id: row.id,
          testId: row.test_id,
          testTitle: testObj?.title ?? "Test",
          completedAt: row.completed_at ?? row.created_at ?? new Date().toISOString(),
          attemptIndex: total - idx,
          totalAttemptsForTest: total,
          percentage: percentage != null ? Math.round(percentage) : null,
          score: score != null ? Number(score) : null,
          maxScore: maxScore != null ? Number(maxScore) : null,
          categoryResults: cats,
          analysis: analysisByAttempt.get(row.id) ?? null,
        });
      });
    }
    catalogTests.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

    // Mental health → category buckets
    for (const row of mentalHealthRaw ?? []) {
      const r = row as { results?: Record<string, { percentage?: number }>; dimension_scores?: Record<string, number> };
      const results = r.results ?? r.dimension_scores ?? {};
      const cats: TestCategoryResult[] = Object.entries(results).map(([category, val]) => {
        const pct = typeof val === "number" ? val : (val as { percentage?: number })?.percentage ?? 0;
        return { category, score: pct, maxScore: 100, percentage: pct };
      });
      if (cats.length > 0) {
        categoryBuckets.push({ categories: cats, source: "mental_health" });
      }
    }

    // --- Course engagement + session time ---
    const courseIds = new Set(pedagogy.courses.map((c) => c.courseId));
    const courseTitleById = new Map(pedagogy.courses.map((c) => [c.courseId, c.title]));

    // Fetch titles for session content_ids not in enrollments
    const sessionContentIds = new Set(
      (sessionsRaw ?? []).map((s: { content_id?: string }) => s.content_id).filter(Boolean) as string[],
    );
    const unknownIds = [...sessionContentIds].filter((id) => !courseTitleById.has(id));
    if (unknownIds.length > 0) {
      const extraCourses = await safeQuery(() =>
        supabase.from("courses").select("id, title").in("id", unknownIds.slice(0, 100)),
      );
      for (const c of extraCourses ?? []) {
        courseTitleById.set(c.id, c.title ?? null);
        courseIds.add(c.id);
      }
    }

    type SessionAgg = {
      totalTimeSeconds: number;
      activeTimeSeconds: number;
      sessionCount: number;
      firstSessionAt: string | null;
      lastSessionAt: string | null;
    };
    const sessionByCourse = new Map<string, SessionAgg>();

    for (const s of sessionsRaw ?? []) {
      const row = s as {
        content_type?: string;
        content_id?: string;
        duration_seconds?: number;
        duration_active_seconds?: number;
        started_at?: string;
        ended_at?: string;
      };
      const cid = row.content_id;
      if (!cid) continue;
      // Sessions course-level or lesson-level mapped to course if known
      const courseKey =
        row.content_type === "course" || courseTitleById.has(cid) ? cid : cid;
      const prev = sessionByCourse.get(courseKey) ?? {
        totalTimeSeconds: 0,
        activeTimeSeconds: 0,
        sessionCount: 0,
        firstSessionAt: null,
        lastSessionAt: null,
      };
      prev.totalTimeSeconds += row.duration_seconds ?? 0;
      prev.activeTimeSeconds += row.duration_active_seconds ?? 0;
      prev.sessionCount += 1;
      const at = row.started_at ?? row.ended_at ?? null;
      if (at) {
        if (!prev.firstSessionAt || at < prev.firstSessionAt) prev.firstSessionAt = at;
        if (!prev.lastSessionAt || at > prev.lastSessionAt) prev.lastSessionAt = at;
      }
      sessionByCourse.set(courseKey, prev);
    }

    const courses: LearnerCourseEngagement[] = pedagogy.courses.map((c) => {
      const sess = sessionByCourse.get(c.courseId);
      return {
        courseId: c.courseId,
        courseTitle: c.title,
        progressPercent: c.progressPercent,
        lastAccessedAt: c.lastAccessedAt,
        enrolledAt: c.enrolledAt,
        totalTimeSeconds: sess?.totalTimeSeconds ?? 0,
        activeTimeSeconds: sess?.activeTimeSeconds ?? 0,
        sessionCount: sess?.sessionCount ?? 0,
        firstSessionAt: sess?.firstSessionAt ?? null,
        lastSessionAt: sess?.lastSessionAt ?? null,
      };
    });

    // Sessions on course ids not in enrollments
    for (const [courseId, sess] of sessionByCourse) {
      if (courses.some((c) => c.courseId === courseId)) continue;
      courses.push({
        courseId,
        courseTitle: courseTitleById.get(courseId) ?? "Formation",
        progressPercent: null,
        lastAccessedAt: sess.lastSessionAt,
        enrolledAt: null,
        totalTimeSeconds: sess.totalTimeSeconds,
        activeTimeSeconds: sess.activeTimeSeconds,
        sessionCount: sess.sessionCount,
        firstSessionAt: sess.firstSessionAt,
        lastSessionAt: sess.lastSessionAt,
      });
    }
    courses.sort((a, b) => (b.lastSessionAt ?? "").localeCompare(a.lastSessionAt ?? ""));

    const totalTimeSeconds = (sessionsRaw ?? []).reduce(
      (acc: number, s: { duration_seconds?: number }) => acc + (s.duration_seconds ?? 0),
      0,
    );
    const totalActiveTimeSeconds = (sessionsRaw ?? []).reduce(
      (acc: number, s: { duration_active_seconds?: number }) => acc + (s.duration_active_seconds ?? 0),
      0,
    );

    // --- Coaching activities ---
    const coachingActivities: LearnerCoachingActivity[] = [];

    for (const r of accompagnementReservations ?? []) {
      const row = r as {
        id: string;
        offer_name?: string;
        status?: string;
        payment_status?: string;
        selected_slot?: string;
        created_at?: string;
        paid_at?: string;
      };
      coachingActivities.push({
        id: row.id,
        type: "accompagnement_reservation",
        title: row.offer_name ?? "Accompagnement",
        detail: row.selected_slot ? `Créneau : ${row.selected_slot}` : null,
        status: row.payment_status ?? row.status ?? null,
        occurredAt: row.paid_at ?? row.created_at ?? new Date().toISOString(),
      });
    }

    for (const r of programmeRequests ?? []) {
      const row = r as {
        id: string;
        objectif?: string;
        besoin?: string;
        message?: string;
        status?: string;
        created_at?: string;
      };
      coachingActivities.push({
        id: row.id,
        type: "programme_request",
        title: "Demande programme accompagnement",
        detail: [row.objectif, row.besoin, row.message].filter(Boolean).join(" · ") || null,
        status: row.status ?? null,
        occurredAt: row.created_at ?? new Date().toISOString(),
      });
    }

    for (const r of pathRequests ?? []) {
      const row = r as {
        id: string;
        objective?: string;
        support_preference?: string;
        status?: string;
        created_at?: string;
      };
      coachingActivities.push({
        id: row.id,
        type: "personalized_path",
        title: "Demande parcours personnalisé",
        detail: [row.objective, row.support_preference].filter(Boolean).join(" · ") || null,
        status: row.status ?? null,
        occurredAt: row.created_at ?? new Date().toISOString(),
      });
    }

    for (const r of edgeMissions ?? []) {
      const row = r as {
        id: string;
        skill_name?: string;
        summary?: string;
        status?: string;
        strengths?: string[];
        improvements?: string[];
        created_at?: string;
        completed_at?: string;
      };
      coachingActivities.push({
        id: row.id,
        type: "edge_mission",
        title: `Mission EDGE — ${row.skill_name ?? "Compétence"}`,
        detail: row.summary ?? null,
        status: row.status ?? null,
        occurredAt: row.completed_at ?? row.created_at ?? new Date().toISOString(),
        strengths: row.strengths ?? [],
        improvements: row.improvements ?? [],
      });
      if (row.strengths?.length || row.improvements?.length) {
        const cats: TestCategoryResult[] = [
          ...(row.strengths ?? []).map((s) => ({
            category: s,
            score: 80,
            maxScore: 100,
            percentage: 80,
          })),
          ...(row.improvements ?? []).map((s) => ({
            category: s,
            score: 35,
            maxScore: 100,
            percentage: 35,
          })),
        ];
        if (cats.length > 0) {
          categoryBuckets.push({ categories: cats, source: "edge_mission" });
        }
      }
    }

    for (const r of pathTriggers ?? []) {
      const row = r as {
        id: string;
        type?: string;
        status?: string;
        score?: number;
        feedback?: string;
        created_at?: string;
      };
      coachingActivities.push({
        id: row.id,
        type: "path_trigger",
        title: `Entretien / preuve parcours (${row.type ?? "—"})`,
        detail: row.feedback ?? (row.score != null ? `Score : ${row.score}` : null),
        status: row.status ?? null,
        occurredAt: row.created_at ?? new Date().toISOString(),
      });
    }

    for (const r of aiTransformationsRaw ?? []) {
      const row = r as { action?: string; created_at?: string; id?: string };
      const action = (row.action ?? "").trim();
      if (!action) continue;
      if (
        action.toLowerCase().includes("coach") ||
        action.toLowerCase().includes("entretien") ||
        action.toLowerCase().includes("coaching")
      ) {
        coachingActivities.push({
          id: `ai-${row.created_at}-${action.slice(0, 20)}`,
          type: "ai_lesson",
          title: action,
          detail: "Interaction IA sur une leçon",
          status: "completed",
          occurredAt: row.created_at ?? new Date().toISOString(),
        });
      }
    }

    const flashcardCourseIds = [
      ...new Set(
        (flashcardSessionsRaw ?? [])
          .map((r: { course_id?: string }) => r.course_id)
          .filter(Boolean) as string[],
      ),
    ];
    const flashcardCourseTitles = new Map<string, string>();
    if (flashcardCourseIds.length > 0) {
      const rows = await safeQuery(() =>
        supabase.from("courses").select("id, title").in("id", flashcardCourseIds),
      );
      for (const c of rows ?? []) {
        flashcardCourseTitles.set(c.id, c.title ?? "Formation");
      }
    }

    const flashcardSessions: LearnerFlashcardSession[] = (flashcardSessionsRaw ?? []).map((row) => {
      const r = row as {
        id: string;
        course_id?: string | null;
        scope_id?: string;
        total_cards?: number;
        known_count?: number;
        unknown_count?: number;
        duration_seconds?: number;
        completed_at?: string;
      };
      const known = r.known_count ?? 0;
      const unknown = r.unknown_count ?? 0;
      const reviewed = known + unknown;
      return {
        id: r.id,
        courseId: r.course_id ?? null,
        scopeId: r.scope_id ?? "",
        courseTitle: r.course_id ? flashcardCourseTitles.get(r.course_id) ?? null : null,
        totalCards: r.total_cards ?? 0,
        knownCount: known,
        unknownCount: unknown,
        knownPercent: reviewed > 0 ? Math.round((known / reviewed) * 100) : 0,
        durationSeconds: r.duration_seconds ?? 0,
        completedAt: r.completed_at ?? new Date().toISOString(),
      };
    });

    const interviewSessions: LearnerInterviewSession[] = (interviewSessionsRaw ?? []).map((row) => {
      const r = row as {
        id: string;
        course_id?: string | null;
        lesson_id?: string;
        interview_style?: string;
        chapter_title?: string | null;
        course_title?: string | null;
        status?: string;
        user_turn_count?: number;
        duration_seconds?: number;
        completed_at?: string;
        feedback?: Record<string, unknown> | null;
      };
      const fb = r.feedback as LearnerInterviewSession["feedback"];
      return {
        id: r.id,
        courseId: r.course_id ?? null,
        lessonId: r.lesson_id ?? "",
        interviewStyle: r.interview_style === "coaching" ? "coaching" : "experiential",
        chapterTitle: r.chapter_title ?? null,
        courseTitle: r.course_title ?? null,
        status: r.status ?? "completed",
        userTurnCount: r.user_turn_count ?? 0,
        durationSeconds: r.duration_seconds ?? 0,
        completedAt: r.completed_at ?? new Date().toISOString(),
        feedback: fb ?? null,
      };
    });

    for (const fc of flashcardSessions) {
      if (fc.knownCount + fc.unknownCount === 0) continue;
      categoryBuckets.push({
        categories: [
          {
            category: `Flashcards — ${fc.courseTitle ?? "Formation"}`,
            score: fc.knownPercent,
            maxScore: 100,
            percentage: fc.knownPercent,
          },
        ],
        source: "catalog_test",
      });
    }

    for (const session of interviewSessions) {
      const isCoaching = session.interviewStyle === "coaching";
      coachingActivities.unshift({
        id: session.id,
        type: "ai_lesson",
        title: isCoaching
          ? `Se faire coacher — ${session.chapterTitle ?? "Leçon"}`
          : `Entretien expérientiel — ${session.chapterTitle ?? "Leçon"}`,
        detail: session.feedback?.summary ?? `${session.userTurnCount} échanges · ${formatSeconds(session.durationSeconds)}`,
        status: session.status,
        occurredAt: session.completedAt,
        strengths: session.feedback?.bien_dit ?? [],
        improvements: [
          ...(session.feedback?.a_revoir ?? []),
          ...(session.feedback?.axes_amelioration ?? []),
        ],
      });

      if (session.feedback?.bien_dit?.length || session.feedback?.axes_amelioration?.length) {
        const cats: TestCategoryResult[] = [
          ...(session.feedback?.bien_dit ?? []).map((s) => ({
            category: s,
            score: 80,
            maxScore: 100,
            percentage: 80,
          })),
          ...(session.feedback?.axes_amelioration ?? []).map((s) => ({
            category: s,
            score: 35,
            maxScore: 100,
            percentage: 35,
          })),
        ];
        if (cats.length > 0) {
          categoryBuckets.push({ categories: cats, source: "catalog_test" });
        }
      }
    }

    coachingActivities.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    const { strengths, weaknesses } = aggregateSkillInsights(categoryBuckets);

    const storedAnalysis = parseStoredProfileAnalysis(
      (profile as { ai_analysis?: unknown }).ai_analysis,
    );
    const profileAnalysis = storedAnalysis?.text
      ? parseProfileAnalysisSections(storedAnalysis.text)
      : null;

    const totalQuizAttempts = pedagogy.quizzes.reduce((s, q) => s + q.attemptCount, 0);

    // Inscriptions Jessica / CRM (course_enrollments)
    const extraEnrollments = await safeQuery(() =>
      supabase
        .from("course_enrollments")
        .select("course_id, created_at, courses(id, title)")
        .eq("user_id", userId)
        .limit(50),
    );
    for (const row of extraEnrollments ?? []) {
      const r = row as {
        course_id?: string;
        created_at?: string;
        courses?: { title?: string | null } | { title?: string | null }[] | null;
      };
      const cid = r.course_id;
      if (!cid || courses.some((c) => c.courseId === cid)) continue;
      const courseObj = Array.isArray(r.courses) ? r.courses[0] : r.courses;
      courses.push({
        courseId: cid,
        courseTitle: courseObj?.title ?? "Formation",
        progressPercent: null,
        lastAccessedAt: null,
        enrolledAt: r.created_at ?? null,
        totalTimeSeconds: sessionByCourse.get(cid)?.totalTimeSeconds ?? 0,
        activeTimeSeconds: sessionByCourse.get(cid)?.activeTimeSeconds ?? 0,
        sessionCount: sessionByCourse.get(cid)?.sessionCount ?? 0,
        firstSessionAt: sessionByCourse.get(cid)?.firstSessionAt ?? null,
        lastSessionAt: sessionByCourse.get(cid)?.lastSessionAt ?? null,
      });
    }

    return {
      userId: profile.id,
      email: profile.email ?? "",
      fullName: profile.full_name ?? null,
      phone: profile.phone ?? null,
      createdAt: profile.created_at ?? null,
      lastSignInAt,
      totalActiveTimeSeconds,
      totalTimeSeconds,
      totalTestAttempts: catalogTests.length,
      totalQuizAttempts,
      courses,
      catalogTests,
      quizSummaries: pedagogy.quizzes,
      strengths,
      weaknesses,
      coachingActivities,
      flashcardSessions,
      interviewSessions,
      profileAnalysis,
      aiTransformations: pedagogy.transformations,
    };
  } catch (error) {
    console.error("[learner-dossier] Error:", error);
    return null;
  }
}
