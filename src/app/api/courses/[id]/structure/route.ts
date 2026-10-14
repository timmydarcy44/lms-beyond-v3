import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { getCertificationStatus } from "@/lib/courses/course-completion";
import {
  collectProgressLeafIds,
  computeOutlineLearnerProgress,
  isUuidLike,
  mergeChapterProgress,
  progressFromSessionAggregate,
  type ItemLearnerProgress,
  type OutlineSection,
} from "@/lib/courses/learner-outline-progress";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

type SessionAgg = { hasSession: boolean; maxActiveSeconds: number };

function pickCourseCover(general: unknown): string | null {
  if (!general || typeof general !== "object") return null;
  const g = general as Record<string, unknown>;
  for (const key of ["cover_image", "heroImage", "thumbnail"] as const) {
    const v = g[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function itemProgressForContentId(stats: Map<string, SessionAgg>, contentUuid: string): ItemLearnerProgress {
  if (!isUuidLike(contentUuid)) return { state: "none", percent: null };
  const agg = stats.get(contentUuid.trim()) ?? { hasSession: false, maxActiveSeconds: 0 };
  return progressFromSessionAggregate({
    hasSession: agg.hasSession,
    maxActiveSeconds: agg.maxActiveSeconds,
  });
}

async function fetchEnrollmentProgress(
  client: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<number | null> {
  const trySelect = async (column: "user_id" | "learner_id") => {
    const { data, error } = await client
      .from("enrollments")
      .select("progress")
      .eq("course_id", courseId)
      .eq(column, userId)
      .maybeSingle();
    if (error) return null;
    const p = (data as { progress?: unknown } | null)?.progress;
    return typeof p === "number" && Number.isFinite(p) ? p : null;
  };

  let p = await trySelect("user_id");
  if (p == null) p = await trySelect("learner_id");
  return p;
}

async function fetchSessionAggregatesByContentId(
  client: SupabaseClient,
  userId: string,
  contentIds: string[],
): Promise<Map<string, SessionAgg>> {
  const map = new Map<string, SessionAgg>();
  const unique = [...new Set(contentIds.filter(Boolean))];
  if (unique.length === 0) return map;
  const chunk = 120;
  for (let i = 0; i < unique.length; i += chunk) {
    const slice = unique.slice(i, i + chunk);
    if (slice.length === 0) continue;
    const { data, error } = await client
      .from("learning_sessions")
      .select("content_id, duration_active_seconds")
      .eq("user_id", userId)
      .in("content_id", slice)
      .limit(5000);
    if (error) continue;
    for (const row of data ?? []) {
      const cid = String((row as { content_id?: unknown }).content_id ?? "").trim();
      if (!cid) continue;
      const active = Number((row as { duration_active_seconds?: unknown }).duration_active_seconds ?? 0) || 0;
      const prev = map.get(cid);
      const nextActive = Math.max(prev?.maxActiveSeconds ?? 0, active);
      map.set(cid, { hasSession: true, maxActiveSeconds: nextActive });
    }
  }
  return map;
}

function parisKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function addDays(key: string, delta: number): string {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

async function fetchCourseActivity(client: SupabaseClient, userId: string, contentIds: string[]) {
  const empty = {
    available: false,
    totalActiveSeconds: 0,
    weekSeconds: [0, 0, 0, 0, 0, 0, 0],
    previousWeekSeconds: 0,
    streakDays: 0,
  };
  const unique = [...new Set(contentIds.filter((value) => isUuidLike(value)))];
  if (!unique.length) return empty;
  const { data, error } = await client
    .from("learning_sessions")
    .select("started_at, duration_active_seconds")
    .eq("user_id", userId)
    .in("content_id", unique)
    .limit(5000);
  if (error) return empty;
  if (!data?.length) {
    return { ...empty, available: true };
  }

  const today = parisKey(new Date());
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = addDays(today, mondayOffset);
  const weekKeys = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const previousKeys = new Set(Array.from({ length: 7 }, (_, index) => addDays(monday, index - 7)));
  const weekIndex = new Map(weekKeys.map((key, index) => [key, index]));
  const weekSeconds = [0, 0, 0, 0, 0, 0, 0];
  let previousWeekSeconds = 0;
  let totalActiveSeconds = 0;
  const days = new Set<string>();

  for (const row of data) {
    const started = new Date(String((row as { started_at?: string }).started_at ?? ""));
    if (Number.isNaN(started.getTime())) continue;
    const key = parisKey(started);
    const active = Math.max(0, Number((row as { duration_active_seconds?: number }).duration_active_seconds ?? 0) || 0);
    totalActiveSeconds += active;
    days.add(key);
    const index = weekIndex.get(key);
    if (index != null) weekSeconds[index] += active;
    else if (previousKeys.has(key)) previousWeekSeconds += active;
  }

  let cursor = days.has(today) ? today : addDays(today, -1);
  let streakDays = 0;
  while (days.has(cursor)) {
    streakDays += 1;
    cursor = addDays(cursor, -1);
  }

  return { available: true, totalActiveSeconds, weekSeconds, previousWeekSeconds, streakDays };
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await getServerClient();

    if (!supabase || !id) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: canRead, error: canReadErr } = await supabase.from("courses").select("id").eq("id", id).maybeSingle();
    if (canReadErr || !canRead?.id) {
      return NextResponse.json(
        { sections: [], learnerProgress: { state: "none", percent: null }, courseCover: null },
        { status: 200 },
      );
    }

    const admin = await getServiceRoleClientOrFallback();
    const client = admin ?? supabase;

    const { data, error } = await client.from("courses").select("builder_snapshot").eq("id", id).maybeSingle();
    if (error) throw error;

    const snapshotRaw = (data as { builder_snapshot?: unknown } | null)?.builder_snapshot ?? null;
    const snapshot = snapshotRaw
      ? typeof snapshotRaw === "string"
        ? JSON.parse(snapshotRaw)
        : snapshotRaw
      : null;

    if (!snapshot || !Array.isArray((snapshot as any)?.sections)) {
      const res = NextResponse.json({
        sections: [],
        learnerProgress: { state: "none", percent: null },
        courseCover: null,
      });
      res.headers.set("Cache-Control", "private, max-age=60");
      return res;
    }

    const sections: OutlineSection[] = (snapshot as any).sections.map((section: any) => ({
      id: section.id || `section-${section.title}`,
      title: section.title,
      chapters:
        section.chapters?.map((chapter: any) => ({
          id: chapter.id || `chapter-${chapter.title}`,
          title: chapter.title,
          subchapters:
            chapter.subchapters?.map((subchapter: any) => ({
              id: subchapter.id || `subchapter-${subchapter.title}`,
              title: subchapter.title,
            })) || [],
        })) || [],
    }));

    const leafIds = collectProgressLeafIds(sections);
    const enrollmentProgress = await fetchEnrollmentProgress(client, user.id, id);
    const sessionStats = await fetchSessionAggregatesByContentId(client, user.id, [id, ...leafIds]);
    const sessionContentIds = new Set<string>();
    for (const [cid, agg] of sessionStats) {
      if (agg.hasSession) sessionContentIds.add(cid);
    }
    const learnerProgress = computeOutlineLearnerProgress({
      enrollmentProgress,
      sessionContentIds,
      courseId: id,
      leafIds,
    });

    const courseCover = pickCourseCover((snapshot as any)?.general);

    const sectionsOut = sections.map((s) => ({
      id: s.id,
      title: s.title,
      chapters: (s.chapters ?? []).map((ch) => {
        const chId = String(ch.id ?? "").trim();
        const chapterOwn = itemProgressForContentId(sessionStats, chId);
        const subs = (ch.subchapters ?? []).map((sub) => {
          const sid = String(sub.id ?? "").trim();
          return {
            id: sid || String(sub.id),
            title: sub.title,
            learnerProgress: itemProgressForContentId(sessionStats, sid),
          };
        });
        const chapterLearnerProgress = mergeChapterProgress(
          subs.map((x) => x.learnerProgress),
          chapterOwn,
        );
        return {
          id: chId || String(ch.id),
          title: ch.title,
          learnerProgress: chapterLearnerProgress,
          subchapters: subs,
        };
      }),
    }));

    const activity = await fetchCourseActivity(client, user.id, [id, ...leafIds]);
    const certification = await getCertificationStatus(user.id, id);
    const res = NextResponse.json({ sections: sectionsOut, learnerProgress, courseCover, activity, certification });
    res.headers.set("Cache-Control", "private, max-age=60");
    return res;
  } catch (error) {
    console.error("[api/courses/structure] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
