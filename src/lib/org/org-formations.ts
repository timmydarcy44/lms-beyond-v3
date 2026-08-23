import type { SupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { formatDurationFr, loadSchoolPedagogyInsights } from "@/lib/dashboard/ecole-pedagogy-data";
import { getEdgeOnlinePublishedCourses, type EdgeOnlineCourse } from "@/lib/queries/edge-online";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LEARNER_ROLES = ["learner", "student", "apprenant", "salarie", "employee", "member"];
const STAFF_ROLES = [
  "admin",
  "instructor",
  "formateur",
  "tutor",
  "entreprise",
  "admin_hr",
  "rh",
  "manager",
  "ecole",
  "school",
];

export type OrgFormationListItem = {
  id: string;
  title: string;
  status: string;
  slug: string | null;
  updatedAt: string | null;
  enrollmentsCount: number;
};

export type OrgLearnerOption = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type OrgFormationStats = {
  orgId: string;
  coursesCount: number;
  publishedCount: number;
  enrollmentsCount: number;
  completedCount: number;
  avgCompletionPercent: number;
  testsPassedCount: number;
  totalConnectionSeconds: number;
  totalConnectionLabel: string;
  activeLearnersCount: number;
  quizRecent: Array<{
    id: string;
    userId: string;
    userName: string;
    score: number;
    testTitle: string | null;
    createdAt: string;
  }>;
  topFormations: Array<{
    courseId: string;
    title: string;
    seconds: number;
    label: string;
  }>;
};

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Vérifie qu’un user peut piloter les formations d’une org (staff membership ou school_id/company_id). */
export async function userCanManageOrgFormations(
  client: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<boolean> {
  if (!isUuid(orgId) || !isUuid(userId)) return false;

  const { data: profile } = await client
    .from("profiles")
    .select("school_id, company_id, role, role_type")
    .eq("id", userId)
    .maybeSingle();

  const p = profile as {
    school_id?: string | null;
    company_id?: string | null;
    role?: string | null;
    role_type?: string | null;
  } | null;

  if (p?.school_id === orgId || p?.company_id === orgId) return true;

  const { data: memberships } = await client
    .from("org_memberships")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .limit(10);

  for (const row of memberships ?? []) {
    const role = String((row as { role?: string }).role ?? "")
      .trim()
      .toLowerCase();
    if (STAFF_ROLES.includes(role) || role.includes("admin")) return true;
  }

  return false;
}

export async function listOrgCourses(
  orgId: string,
  preferredClient?: SupabaseClient,
): Promise<OrgFormationListItem[]> {
  if (!isUuid(orgId)) return [];
  const service = await getServiceRoleClientOrFallback();
  const client = preferredClient ?? service;
  if (!client) return [];

  const { data: courses, error } = await client
    .from("courses")
    .select("id, title, status, slug, updated_at")
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error || !courses?.length) {
    if (error) console.error("[org-formations] list courses:", error.message);
    return [];
  }

  const ids = courses.map((c) => String((c as { id: string }).id));
  const countByCourse = new Map<string, number>();

  const { data: enrollments } = await client.from("enrollments").select("course_id").in("course_id", ids);
  for (const row of enrollments ?? []) {
    const cid = String((row as { course_id?: string }).course_id ?? "");
    if (!cid) continue;
    countByCourse.set(cid, (countByCourse.get(cid) ?? 0) + 1);
  }

  if (countByCourse.size === 0) {
    const { data: fallback } = await client.from("course_enrollments").select("course_id").in("course_id", ids);
    for (const row of fallback ?? []) {
      const cid = String((row as { course_id?: string }).course_id ?? "");
      if (!cid) continue;
      countByCourse.set(cid, (countByCourse.get(cid) ?? 0) + 1);
    }
  }

  return courses.map((c) => {
    const row = c as {
      id: string;
      title?: string | null;
      status?: string | null;
      slug?: string | null;
      updated_at?: string | null;
    };
    return {
      id: row.id,
      title: String(row.title ?? "Formation").trim() || "Formation",
      status: String(row.status ?? "draft").toLowerCase(),
      slug: row.slug ?? null,
      updatedAt: row.updated_at ?? null,
      enrollmentsCount: countByCourse.get(row.id) ?? 0,
    };
  });
}

export async function listOrgLearners(orgId: string): Promise<OrgLearnerOption[]> {
  if (!isUuid(orgId)) return [];
  const client = await getServiceRoleClientOrFallback();
  if (!client) return [];

  const { data: memberships, error } = await client
    .from("org_memberships")
    .select("user_id, role")
    .eq("org_id", orgId)
    .limit(2000);

  if (error) {
    console.error("[org-formations] learners memberships:", error.message);
    return [];
  }

  const userIds = Array.from(
    new Set(
      (memberships ?? [])
        .filter((m) => {
          const role = String((m as { role?: string }).role ?? "")
            .trim()
            .toLowerCase();
          return LEARNER_ROLES.includes(role) || role === "" || !STAFF_ROLES.includes(role);
        })
        .map((m) => String((m as { user_id?: string }).user_id ?? ""))
        .filter(Boolean),
    ),
  );

  // Complément : profils rattachés via school_id / company_id
  const { data: linkedProfiles } = await client
    .from("profiles")
    .select("id")
    .or(`school_id.eq.${orgId},company_id.eq.${orgId}`)
    .limit(2000);

  for (const p of linkedProfiles ?? []) {
    const id = String((p as { id?: string }).id ?? "");
    if (id) userIds.push(id);
  }

  const uniqueIds = Array.from(new Set(userIds));
  if (!uniqueIds.length) return [];

  const { data: profiles } = await client
    .from("profiles")
    .select("id, full_name, email, first_name, last_name")
    .in("id", uniqueIds)
    .order("full_name", { ascending: true })
    .limit(2000);

  return (profiles ?? []).map((p) => {
    const row = p as {
      id: string;
      full_name?: string | null;
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
    };
    const composed = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    return {
      id: row.id,
      full_name: (row.full_name ?? composed) || null,
      email: row.email ?? null,
    };
  });
}

export async function loadOrgFormationStats(orgId: string): Promise<OrgFormationStats> {
  const empty: OrgFormationStats = {
    orgId,
    coursesCount: 0,
    publishedCount: 0,
    enrollmentsCount: 0,
    completedCount: 0,
    avgCompletionPercent: 0,
    testsPassedCount: 0,
    totalConnectionSeconds: 0,
    totalConnectionLabel: formatDurationFr(0),
    activeLearnersCount: 0,
    quizRecent: [],
    topFormations: [],
  };

  if (!isUuid(orgId)) return empty;
  const client = await getServiceRoleClientOrFallback();
  if (!client) return empty;

  const courses = await listOrgCourses(orgId, client);
  const learners = await listOrgLearners(orgId);
  const learnerIds = learners.map((l) => l.id);
  const courseIds = courses.map((c) => c.id);

  const nameById = new Map(learners.map((l) => [l.id, l.full_name || l.email || l.id.slice(0, 8)]));

  let enrollmentsCount = 0;
  if (courseIds.length) {
    const { count } = await client
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .in("course_id", courseIds);
    enrollmentsCount = count ?? 0;
    if (!enrollmentsCount) {
      const { count: c2 } = await client
        .from("course_enrollments")
        .select("id", { count: "exact", head: true })
        .in("course_id", courseIds);
      enrollmentsCount = c2 ?? 0;
    }
  }

  let completedCount = 0;
  let avgCompletionPercent = 0;
  if (courseIds.length && learnerIds.length) {
    const { data: progress } = await client
      .from("course_progress")
      .select("progress_percent, user_id, course_id")
      .in("course_id", courseIds)
      .in("user_id", learnerIds)
      .limit(5000);

    const rows = progress ?? [];
    let sum = 0;
    for (const row of rows) {
      const pct = Number((row as { progress_percent?: number }).progress_percent) || 0;
      sum += pct;
      if (pct >= 100) completedCount += 1;
    }
    avgCompletionPercent = rows.length ? Math.round(sum / rows.length) : 0;
  }

  const insights = await loadSchoolPedagogyInsights(client, learnerIds);
  const totalConnectionSeconds = insights.formationTime.reduce((acc, r) => acc + (r.active_seconds || r.total_seconds || 0), 0);
  const testsPassedCount = insights.quizRows.filter((q) => q.score >= 50).length;

  const byCourse = new Map<string, { title: string; seconds: number }>();
  for (const row of insights.formationTime) {
    const prev = byCourse.get(row.course_id) ?? { title: row.course_title || "Formation", seconds: 0 };
    prev.seconds += row.active_seconds || row.total_seconds || 0;
    byCourse.set(row.course_id, prev);
  }

  const topFormations = Array.from(byCourse.entries())
    .map(([courseId, v]) => ({
      courseId,
      title: v.title,
      seconds: v.seconds,
      label: formatDurationFr(v.seconds),
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 8);

  const quizRecent = insights.quizRows.slice(0, 12).map((q) => ({
    id: q.id,
    userId: q.user_id,
    userName: nameById.get(q.user_id) || q.user_id.slice(0, 8),
    score: q.score,
    testTitle: q.test_title,
    createdAt: q.created_at,
  }));

  const activeLearners = new Set(insights.formationTime.map((r) => r.user_id));

  return {
    orgId,
    coursesCount: courses.length,
    publishedCount: courses.filter((c) => c.status === "published").length,
    enrollmentsCount,
    completedCount,
    avgCompletionPercent,
    testsPassedCount,
    totalConnectionSeconds,
    totalConnectionLabel: formatDurationFr(totalConnectionSeconds),
    activeLearnersCount: activeLearners.size || learnerIds.length,
    quizRecent,
    topFormations,
  };
}

export async function listEdgeCatalogueForOrgHub(): Promise<EdgeOnlineCourse[]> {
  return getEdgeOnlinePublishedCourses();
}

export { formatDurationFr };
