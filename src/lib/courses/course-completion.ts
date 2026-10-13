import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import {
  collectProgressLeafIds,
  computeOutlineLearnerProgress,
  mergeChapterProgress,
  progressFromSessionAggregate,
  type OutlineSection,
} from "@/lib/courses/learner-outline-progress";

export type CourseCompletion = {
  complete: boolean;
  percent: number;
  doneChapters: number;
  totalChapters: number;
};

export async function readCourseLearnerProgress(userId: string, courseId: string): Promise<CourseCompletion> {
  const empty = { complete: false, percent: 0, doneChapters: 0, totalChapters: 0 };
  const client = await getServiceRoleClientOrFallback();
  if (!client || !userId || !courseId) return empty;

  const { data, error } = await client.from("courses").select("builder_snapshot").eq("id", courseId).maybeSingle();
  if (error || !data) return empty;

  const raw = (data as { builder_snapshot?: unknown }).builder_snapshot ?? null;
  let snapshot: unknown = null;
  try {
    snapshot = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;
  } catch {
    return empty;
  }
  const sectionsRaw = snapshot && typeof snapshot === "object" ? (snapshot as { sections?: unknown }).sections : null;
  if (!Array.isArray(sectionsRaw)) return empty;

  const sections: OutlineSection[] = sectionsRaw.map((section: { id?: string; title?: string; chapters?: unknown[] }, index: number) => ({
    id: String(section?.id || `section-${index}`),
    title: String(section?.title ?? "Module"),
    chapters: (Array.isArray(section?.chapters) ? section.chapters : []).map((chapter: { id?: string; title?: string; subchapters?: unknown[] }, chapterIndex: number) => ({
      id: String(chapter?.id || `chapter-${chapterIndex}`),
      title: String(chapter?.title ?? "Chapitre"),
      subchapters: (Array.isArray(chapter?.subchapters) ? chapter.subchapters : []).map((sub: { id?: string; title?: string }, subIndex: number) => ({
        id: String(sub?.id || `sub-${subIndex}`),
        title: String(sub?.title ?? "Bloc"),
      })),
    })),
  }));

  const leafIds = collectProgressLeafIds(sections);
  const enrollmentByUser = await client
    .from("enrollments")
    .select("progress")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .maybeSingle();
  const enrollment =
    enrollmentByUser.data ??
    (
      await client
        .from("enrollments")
        .select("progress")
        .eq("course_id", courseId)
        .eq("learner_id", userId)
        .maybeSingle()
    ).data;
  const enrollmentProgress =
    typeof (enrollment as { progress?: unknown } | null)?.progress === "number"
      ? (enrollment as { progress: number }).progress
      : null;

  const ids = [courseId, ...leafIds];
  const stats = new Map<string, { hasSession: boolean; maxActiveSeconds: number }>();
  if (ids.length) {
    const { data: sessions } = await client
      .from("learning_sessions")
      .select("content_id, duration_active_seconds")
      .eq("user_id", userId)
      .in("content_id", ids)
      .limit(5000);
    for (const row of sessions ?? []) {
      const contentId = String((row as { content_id?: unknown }).content_id ?? "").trim();
      if (!contentId) continue;
      const active = Number((row as { duration_active_seconds?: unknown }).duration_active_seconds ?? 0) || 0;
      const prev = stats.get(contentId);
      stats.set(contentId, { hasSession: true, maxActiveSeconds: Math.max(prev?.maxActiveSeconds ?? 0, active) });
    }
  }

  const sessionContentIds = new Set<string>();
  for (const [contentId, agg] of stats) {
    if (agg.hasSession) sessionContentIds.add(contentId);
  }

  const learnerProgress = computeOutlineLearnerProgress({
    enrollmentProgress,
    sessionContentIds,
    courseId,
    leafIds,
  });

  let doneChapters = 0;
  let totalChapters = 0;
  for (const section of sections) {
    for (const chapter of section.chapters) {
      totalChapters += 1;
      const own = progressFromSessionAggregate(stats.get(chapter.id) ?? { hasSession: false, maxActiveSeconds: 0 });
      const subs = chapter.subchapters.map((sub) =>
        progressFromSessionAggregate(stats.get(sub.id) ?? { hasSession: false, maxActiveSeconds: 0 }),
      );
      if (mergeChapterProgress(subs, own).state === "completed") doneChapters += 1;
    }
  }

  const percent = learnerProgress.state === "completed" ? 100 : Math.max(0, Math.min(100, learnerProgress.percent ?? 0));
  return {
    complete: learnerProgress.state === "completed",
    percent,
    doneChapters,
    totalChapters,
  };
}
