import { getServiceRoleClient } from "@/lib/supabase/server";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import {
  formatDurationCompact,
  metricsFromLegacySessionRows,
} from "@/lib/lms/lms-metrics";
import { isCourseNodeVisible } from "@/lib/courses/visible-structure";

export type SuiviPeriod = "7d" | "30d" | "90d" | "all";

export type SuiviLearnerRow = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  nameMissing: boolean;
  email: string;
  role: string;
  roleLabel: string;
  companyName: string | null;
  isHiddenByDefault: boolean;
  isTest: boolean;
  lastActivityAt: string | null;
  firstSeenAt: string | null;
  connectedSeconds: number;
  activeSeconds: number;
  sessionCount: number;
  activeWeekBuckets: number[];
  chaptersValidated: number;
  chaptersTotal: number;
  currentChapterTitle: string | null;
  courseId: string | null;
  courseTitle: string | null;
  otherCourses: Array<{ id: string; title: string }>;
  notes: number;
  transformations: number;
  needsRelance: boolean;
  enrolledAt: string | null;
};

export type SuiviKpis = {
  total: number;
  actifs7j: number;
  inactifs14j: number;
  tempsActifMoyen: number;
  chapitresValides: number;
  aRelancer: number;
  hiddenCount: number;
};

const LEARNER_ROLES = new Set([
  "learner",
  "student",
  "apprenant",
  "alternant",
  "alternante",
  "salarie",
  "salarié",
  "employee",
  "collaborateur",
]);

const HIDDEN_ROLES = new Set([
  "expert",
  "formateur",
  "trainer",
  "instructor",
  "admin",
  "super_admin",
  "entreprise",
  "rh",
  "admin_hr",
  "manager",
  "demo",
  "tutor",
  "tuteur",
]);

function titleCaseName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatLearnerDisplayName(first: string | null | undefined, last: string | null | undefined): {
  displayName: string;
  nameMissing: boolean;
} {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return { displayName: "Nom à compléter", nameMissing: true };
  return { displayName: titleCaseName([f, l].filter(Boolean).join(" ")), nameMissing: false };
}

export function roleStatusLabel(role: string | null | undefined): string {
  const key = String(role ?? "").toLowerCase();
  if (key === "alternant" || key === "alternante") return key === "alternante" ? "Alternante" : "Alternant";
  if (key === "salarie" || key === "salarié" || key === "employee" || key === "collaborateur") return "Salarié";
  if (key === "learner" || key === "student" || key === "apprenant") return "Apprenant";
  if (key === "demo") return "Démo";
  if (key === "expert") return "Expert";
  if (key === "formateur" || key === "trainer" || key === "instructor") return "Formateur";
  if (key === "entreprise" || key === "rh" || key === "admin_hr") return "Entreprise";
  return role ? titleCaseName(role) : "Apprenant";
}

export function isLearnerRole(role: string | null | undefined): boolean {
  return LEARNER_ROLES.has(String(role ?? "").toLowerCase());
}

export function isHiddenAccount(input: {
  role?: string | null;
  email?: string | null;
  is_test?: boolean | null;
}): boolean {
  if (input.is_test === true) return true;
  const role = String(input.role ?? "").toLowerCase();
  if (HIDDEN_ROLES.has(role)) return true;
  if (looksLikeTestAccount({ email: input.email, role })) return true;
  return false;
}

function periodStart(period: SuiviPeriod, now = new Date()): Date | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function countCourseLeaves(snapshot: unknown): { total: number; titles: Map<string, string> } {
  const titles = new Map<string, string>();
  let total = 0;
  const sectionsRaw =
    snapshot && typeof snapshot === "object" ? (snapshot as { sections?: unknown }).sections : null;
  if (!Array.isArray(sectionsRaw)) return { total: 0, titles };

  for (const section of sectionsRaw) {
    if (!isCourseNodeVisible(section as { deleted_at?: string | null })) continue;
    const chapters = Array.isArray((section as { chapters?: unknown[] }).chapters)
      ? (section as { chapters: unknown[] }).chapters
      : [];
    for (const chapter of chapters) {
      if (!isCourseNodeVisible(chapter as { deleted_at?: string | null })) continue;
      const ch = chapter as { id?: string; title?: string; subchapters?: unknown[] };
      const subs = Array.isArray(ch.subchapters) ? ch.subchapters : [];
      const visibleSubs = subs.filter((s) => isCourseNodeVisible(s as { deleted_at?: string | null }));
      if (visibleSubs.length === 0) {
        const id = String(ch.id ?? "");
        if (id) {
          total += 1;
          titles.set(id, String(ch.title ?? "Chapitre"));
        }
      } else {
        for (const sub of visibleSubs) {
          const s = sub as { id?: string; title?: string };
          const id = String(s.id ?? "");
          if (!id) continue;
          total += 1;
          titles.set(id, String(s.title ?? "Chapitre"));
        }
      }
    }
  }
  return { total, titles };
}

function weekBuckets(activeByDay: Map<string, number>, weeks = 4): number[] {
  const buckets = Array.from({ length: weeks }, () => 0);
  const now = new Date();
  for (let w = 0; w < weeks; w++) {
    const end = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    let sum = 0;
    for (const [day, sec] of activeByDay) {
      const t = Date.parse(day);
      if (t >= start.getTime() && t < end.getTime()) sum += sec;
    }
    buckets[weeks - 1 - w] = sum;
  }
  return buckets;
}

export async function loadLearnerSuivi(options: {
  period?: SuiviPeriod;
  includeHidden?: boolean;
}): Promise<{ rows: SuiviLearnerRow[]; kpis: SuiviKpis; courses: Array<{ id: string; title: string }>; companies: string[] }> {
  const db = getServiceRoleClient();
  const period = options.period ?? "30d";
  const includeHidden = options.includeHidden === true;
  const empty = {
    rows: [] as SuiviLearnerRow[],
    kpis: { total: 0, actifs7j: 0, inactifs14j: 0, tempsActifMoyen: 0, chapitresValides: 0, aRelancer: 0, hiddenCount: 0 },
    courses: [] as Array<{ id: string; title: string }>,
    companies: [] as string[],
  };
  if (!db) return empty;

  const since = periodStart(period);
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  // Sessions (cap pour perf)
  let sessionsQuery = db
    .from("learning_sessions")
    .select("user_id, started_at, ended_at, duration_seconds, duration_active_seconds, content_id, content_type")
    .order("started_at", { ascending: false })
    .limit(20000);
  if (since) sessionsQuery = sessionsQuery.gte("started_at", since.toISOString());

  const [sessionsRes, leavesRes, notesRes, transformsRes, enrollmentsRes] = await Promise.all([
    sessionsQuery,
    db
      .from("learner_leaf_completions")
      .select("user_id, course_id, leaf_id, leaf_title, completed_at")
      .order("completed_at", { ascending: false })
      .limit(10000),
    db.from("beyond_note_documents").select("user_id, created_at").order("created_at", { ascending: false }).limit(8000),
    db
      .from("lesson_ai_user_transformations")
      .select("user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(8000),
    db.from("enrollments").select("user_id, course_id, created_at").limit(8000),
  ]);

  const sessionRows = (sessionsRes.data ?? []) as Array<{
    user_id: string;
    started_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    duration_active_seconds: number | null;
    content_id: string | null;
    content_type: string | null;
  }>;

  // Aussi charger l’historique hors période pour last activity / relance (séparé)
  const allUserIdsFromSessions = [...new Set(sessionRows.map((s) => s.user_id))];
  const enrollmentRows = (enrollmentsRes.error ? [] : enrollmentsRes.data ?? []) as Array<{
    user_id: string;
    course_id: string;
    created_at: string | null;
  }>;
  const enrolledUserIds = [...new Set(enrollmentRows.map((e) => e.user_id))];
  const candidateIds = [...new Set([...allUserIdsFromSessions, ...enrolledUserIds])];

  // Profiles par lots
  const profiles: Array<{
    id: string;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
    role: string | null;
    company_id: string | null;
    entreprise_id: string | null;
    is_test?: boolean | null;
    created_at?: string | null;
  }> = [];
  for (let i = 0; i < candidateIds.length; i += 200) {
    const chunk = candidateIds.slice(i, i + 200);
    if (!chunk.length) continue;
    const res = await db
      .from("profiles")
      .select("id, email, first_name, last_name, role, company_id, entreprise_id, created_at")
      .in("id", chunk);
    if (!res.error && res.data) profiles.push(...(res.data as typeof profiles));
  }

  // Companies
  const companyIds = [
    ...new Set(
      profiles
        .flatMap((p) => [p.company_id, p.entreprise_id])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const companyNameById = new Map<string, string>();
  if (companyIds.length) {
    for (const table of ["companies", "cfa_companies", "organizations"] as const) {
      const col = table === "organizations" ? "name" : "company_name";
      const res = await db.from(table).select(`id, ${col}`).in("id", companyIds.slice(0, 300));
      if (res.error) continue;
      for (const row of (res.data ?? []) as Array<Record<string, unknown>>) {
        const id = String(row.id);
        const name = String(row[col] ?? "").trim();
        if (id && name) companyNameById.set(id, name);
      }
    }
  }

  // Courses + leaf totals
  const courseIds = [
    ...new Set(
      [
        ...enrollmentRows.map((e) => e.course_id),
        ...((leavesRes.data ?? []) as Array<{ course_id: string }>).map((l) => l.course_id),
        ...sessionRows.filter((s) => s.content_type === "course" && s.content_id).map((s) => String(s.content_id)),
      ].filter(Boolean),
    ),
  ];
  const courseMeta = new Map<string, { title: string; totalLeaves: number; leafTitles: Map<string, string> }>();
  for (let i = 0; i < courseIds.length; i += 50) {
    const chunk = courseIds.slice(i, i + 50);
    if (!chunk.length) continue;
    const res = await db.from("courses").select("id, title, builder_snapshot").in("id", chunk);
    for (const row of (res.data ?? []) as Array<{ id: string; title: string | null; builder_snapshot: unknown }>) {
      const { total, titles } = countCourseLeaves(row.builder_snapshot);
      courseMeta.set(row.id, { title: row.title ?? "Parcours", totalLeaves: total, leafTitles: titles });
    }
  }

  // Last activity all-time (for relance) — light query
  const lastActivityByUser = new Map<string, string>();
  const firstSeenByUser = new Map<string, string>();
  {
    const { data: recentAll } = await db
      .from("learning_sessions")
      .select("user_id, started_at, ended_at")
      .order("started_at", { ascending: false })
      .limit(15000);
    for (const row of (recentAll ?? []) as Array<{ user_id: string; started_at: string | null; ended_at: string | null }>) {
      const stamp = row.ended_at || row.started_at;
      if (!stamp) continue;
      if (!lastActivityByUser.has(row.user_id) || stamp > (lastActivityByUser.get(row.user_id) ?? "")) {
        lastActivityByUser.set(row.user_id, stamp);
      }
      if (!firstSeenByUser.has(row.user_id) || (row.started_at && row.started_at < (firstSeenByUser.get(row.user_id) ?? ""))) {
        if (row.started_at) firstSeenByUser.set(row.user_id, row.started_at);
      }
    }
  }

  const sessionsByUser = new Map<string, typeof sessionRows>();
  for (const row of sessionRows) {
    const list = sessionsByUser.get(row.user_id) ?? [];
    list.push(row);
    sessionsByUser.set(row.user_id, list);
  }

  const leavesByUser = new Map<
    string,
    Array<{ course_id: string; leaf_id: string; leaf_title: string | null; completed_at: string | null }>
  >();
  for (const row of (leavesRes.error ? [] : leavesRes.data ?? []) as Array<{
    user_id: string;
    course_id: string;
    leaf_id: string;
    leaf_title: string | null;
    completed_at: string | null;
  }>) {
    const list = leavesByUser.get(row.user_id) ?? [];
    list.push(row);
    leavesByUser.set(row.user_id, list);
  }

  const notesByUser = new Map<string, number>();
  if (!notesRes.error) {
    for (const row of (notesRes.data ?? []) as Array<{ user_id?: string | null; created_at?: string | null }>) {
      const id = String(row.user_id ?? "");
      if (!id) continue;
      if (since && row.created_at && row.created_at < since.toISOString()) continue;
      notesByUser.set(id, (notesByUser.get(id) ?? 0) + 1);
    }
  }
  const aiByUser = new Map<string, number>();
  if (!transformsRes.error) {
    for (const row of (transformsRes.data ?? []) as Array<{ user_id?: string | null; created_at?: string | null }>) {
      const id = String(row.user_id ?? "");
      if (!id) continue;
      if (since && row.created_at && row.created_at < since.toISOString()) continue;
      aiByUser.set(id, (aiByUser.get(id) ?? 0) + 1);
    }
  }

  const enrollmentsByUser = new Map<string, Array<{ course_id: string; created_at: string | null }>>();
  for (const row of enrollmentRows) {
    const list = enrollmentsByUser.get(row.user_id) ?? [];
    list.push(row);
    enrollmentsByUser.set(row.user_id, list);
  }

  const now = Date.now();
  const day7 = now - 7 * 24 * 60 * 60 * 1000;
  const day14 = now - 14 * 24 * 60 * 60 * 1000;
  const day3 = now - 3 * 24 * 60 * 60 * 1000;

  const allRows: SuiviLearnerRow[] = [];

  for (const profile of profiles) {
    const hidden = isHiddenAccount({
      role: profile.role,
      email: profile.email,
      is_test: profile.is_test,
    });
    const isLearner = isLearnerRole(profile.role) || enrollmentsByUser.has(profile.id);
    // Inclure apprenants inscrits ; hors périmètre défaut = hidden
    if (!isLearner && !hidden) continue;

    const sessions = sessionsByUser.get(profile.id) ?? [];
    const metrics = metricsFromLegacySessionRows(sessions);

    // Buckets semaine : répartir activeSeconds des séances legacy sur started_at
    const byDay = new Map<string, number>();
    for (const s of sessions) {
      if (!s.started_at) continue;
      const day = s.started_at.slice(0, 10);
      const t = Date.parse(s.started_at);
      if (t < fourWeeksAgo.getTime()) continue;
      const sec = Math.max(0, Number(s.duration_active_seconds) || 0);
      byDay.set(day, (byDay.get(day) ?? 0) + sec);
    }
    // Recaler les buckets pour respecter le total recalculé (proportionnel)
    const rawWeek = weekBuckets(byDay, 4);
    const rawSum = rawWeek.reduce((a, b) => a + b, 0);
    const activeWeekBuckets =
      rawSum > 0 && metrics.activeSeconds > 0
        ? rawWeek.map((v) => Math.round((v / rawSum) * metrics.activeSeconds))
        : rawWeek.map(() => 0);

    const leaves = leavesByUser.get(profile.id) ?? [];
    const periodLeaves = since
      ? leaves.filter((l) => l.completed_at && l.completed_at >= since.toISOString())
      : leaves;

    // Parcours principal = dernière activité (session course) ou dernière completion
    let courseId: string | null = null;
    for (const s of sessions) {
      if (s.content_type === "course" && s.content_id) {
        courseId = s.content_id;
        break;
      }
    }
    if (!courseId && leaves[0]?.course_id) courseId = leaves[0].course_id;
    if (!courseId) {
      const enr = enrollmentsByUser.get(profile.id)?.[0];
      if (enr) courseId = enr.course_id;
    }

    const course = courseId ? courseMeta.get(courseId) : null;
    const validatedInCourse = courseId
      ? new Set(leaves.filter((l) => l.course_id === courseId).map((l) => l.leaf_id)).size
      : 0;

    const otherCourseIds = [
      ...new Set(
        (enrollmentsByUser.get(profile.id) ?? [])
          .map((e) => e.course_id)
          .filter((id) => id && id !== courseId),
      ),
    ];

    const lastActivityAt = lastActivityByUser.get(profile.id) ?? null;
    const enrolledAt =
      enrollmentsByUser.get(profile.id)?.reduce<string | null>((best, e) => {
        if (!e.created_at) return best;
        if (!best || e.created_at < best) return e.created_at;
        return best;
      }, null) ??
      profile.created_at ??
      null;

    const neverConnected = !lastActivityAt;
    const lastTs = lastActivityAt ? Date.parse(lastActivityAt) : NaN;
    const inactive14 = neverConnected || (!Number.isNaN(lastTs) && lastTs < day14);
    const enrolledLongEnough = enrolledAt ? Date.parse(enrolledAt) < day3 : false;
    const needsRelance = inactive14 || (neverConnected && enrolledLongEnough);

    const { displayName, nameMissing } = formatLearnerDisplayName(profile.first_name, profile.last_name);
    const companyName =
      (profile.company_id && companyNameById.get(profile.company_id)) ||
      (profile.entreprise_id && companyNameById.get(profile.entreprise_id)) ||
      null;

    allRows.push({
      userId: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      displayName,
      nameMissing,
      email: profile.email ?? "",
      role: profile.role ?? "learner",
      roleLabel: roleStatusLabel(profile.role),
      companyName,
      isHiddenByDefault: hidden || !isLearnerRole(profile.role),
      isTest: looksLikeTestAccount({ email: profile.email, role: profile.role }) || profile.is_test === true,
      lastActivityAt,
      firstSeenAt: firstSeenByUser.get(profile.id) ?? null,
      connectedSeconds: metrics.connectedSeconds,
      activeSeconds: metrics.activeSeconds,
      sessionCount: metrics.sessionCount,
      activeWeekBuckets,
      chaptersValidated: validatedInCourse,
      chaptersTotal: course?.totalLeaves ?? Math.max(validatedInCourse, 0),
      currentChapterTitle: leaves[0]?.leaf_title ?? null,
      courseId,
      courseTitle: course?.title ?? null,
      otherCourses: otherCourseIds.map((id) => ({
        id,
        title: courseMeta.get(id)?.title ?? "Parcours",
      })),
      notes: notesByUser.get(profile.id) ?? 0,
      transformations: aiByUser.get(profile.id) ?? 0,
      needsRelance,
      enrolledAt,
    });
  }

  const hiddenCount = allRows.filter((r) => r.isHiddenByDefault).length;
  const visible = includeHidden ? allRows : allRows.filter((r) => !r.isHiddenByDefault);

  // KPIs hors comptes masqués (toujours)
  const kpiBase = allRows.filter((r) => !r.isHiddenByDefault);
  const actifs7j = kpiBase.filter((r) => r.lastActivityAt && Date.parse(r.lastActivityAt) >= day7).length;
  const inactifs14j = kpiBase.filter((r) => {
    if (!r.lastActivityAt) return true;
    return Date.parse(r.lastActivityAt) < day14;
  }).length;
  const actifsForAvg = kpiBase.filter((r) => r.activeSeconds > 0);
  const tempsActifMoyen =
    actifsForAvg.length > 0
      ? Math.round(actifsForAvg.reduce((s, r) => s + r.activeSeconds, 0) / actifsForAvg.length)
      : 0;
  const chapitresValides = kpiBase.reduce((s, r) => {
    const leaves = leavesByUser.get(r.userId) ?? [];
    const periodLeaves = since
      ? leaves.filter((l) => l.completed_at && l.completed_at >= since.toISOString())
      : leaves;
    return s + new Set(periodLeaves.map((l) => l.leaf_id)).size;
  }, 0);
  const aRelancer = kpiBase.filter((r) => r.needsRelance).length;

  // Tri défaut : à relancer d’abord, puis dernière activité récente
  visible.sort((a, b) => {
    if (a.needsRelance !== b.needsRelance) return a.needsRelance ? -1 : 1;
    return (b.lastActivityAt ?? "").localeCompare(a.lastActivityAt ?? "");
  });

  // Upsert stats (best effort — table peut être absente)
  try {
    const upserts = allRows.slice(0, 500).map((r) => ({
      user_id: r.userId,
      session_count: r.sessionCount,
      connected_seconds: r.connectedSeconds,
      active_seconds: r.activeSeconds,
      first_seen_at: r.firstSeenAt,
      last_seen_at: r.lastActivityAt,
      chapters_validated: r.chaptersValidated,
      notes_count: r.notes,
      transformations_count: r.transformations,
      refreshed_at: new Date().toISOString(),
    }));
    if (upserts.length) {
      await db.from("lms_learner_stats").upsert(upserts, { onConflict: "user_id" });
    }
  } catch {
    // table absente tant que la migration n’est pas appliquée
  }

  const courses = [...courseMeta.entries()]
    .map(([id, meta]) => ({ id, title: meta.title }))
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  const companies = [...new Set(allRows.map((r) => r.companyName).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );

  return {
    rows: visible,
    kpis: {
      total: kpiBase.length,
      actifs7j,
      inactifs14j,
      tempsActifMoyen,
      chapitresValides,
      aRelancer,
      hiddenCount,
    },
    courses,
    companies,
  };
}

export { formatDurationCompact };
