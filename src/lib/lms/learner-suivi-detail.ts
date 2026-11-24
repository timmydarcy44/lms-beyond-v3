import { getServiceRoleClient } from "@/lib/supabase/server";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import { isBtocRole } from "@/lib/control/btoc-client-file";
import {
  formatDurationCompact,
  metricsFromLegacySessionRows,
  type LogicalSession,
} from "@/lib/lms/lms-metrics";
import {
  formatLearnerDisplayName,
  roleStatusLabel,
} from "@/lib/lms/learner-suivi-data";
import { isCourseNodeVisible } from "@/lib/courses/visible-structure";

export type SuiviActivityBadge = "onglet_ouvert" | null;

export type SuiviDetailSession = {
  startedAt: string;
  endedAt: string | null;
  connectedSeconds: number;
  activeSeconds: number;
  label: string;
  badge: SuiviActivityBadge;
  suspicious: boolean;
};

export type SuiviWeekBar = {
  weekStartIso: string;
  label: string;
  seconds: number;
  display: string;
};

export type SuiviModuleRow = {
  id: string;
  title: string;
  progressPct: number;
  status: "done" | "current" | "todo";
  timeLabel: string;
  quizScore: number | null;
};

export type SuiviRelanceRow = {
  id: string;
  sentAt: string | null;
  scheduledFor: string | null;
  subject: string;
  kind: string;
  status: string;
  channel: string | null;
};

export type SuiviLearnerDetail = {
  userId: string;
  displayName: string;
  nameMissing: boolean;
  firstName: string;
  lastName: string;
  email: string;
  initials: string;
  originLabel: string;
  originKind: "btoc" | "entreprise" | "apprenti" | "autre";
  clientHref: string | null;
  isTest: boolean;
  autoRelanceEnabled: boolean;
  courses: Array<{ id: string; title: string }>;
  courseId: string | null;
  courseTitle: string | null;
  accessWeeks: number | null;
  plannedTotalSeconds: number | null;
  weeklyGoalSeconds: number | null;
  progressPct: number;
  modulesDone: number;
  modulesTotal: number;
  sessionCount: number;
  firstSessionAt: string | null;
  connectedSeconds: number;
  activeSeconds: number;
  avgConnectedPerSession: number;
  activeRatioPct: number;
  lastActivityAt: string | null;
  inactiveDays: number | null;
  activityTone: "green" | "amber" | "red" | "gray";
  activityLabel: string;
  weekBars: SuiviWeekBar[];
  sessions: SuiviDetailSession[];
  anomalies: SuiviDetailSession[];
  modules: SuiviModuleRow[];
  relances: SuiviRelanceRow[];
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function suspiciousSession(connected: number, active: number): { badge: SuiviActivityBadge; suspicious: boolean } {
  const long = connected > 4 * 3600;
  const lowActive = connected > 30 * 60 && connected > 0 && active / connected < 0.4;
  if (long || lowActive) return { badge: "onglet_ouvert", suspicious: true };
  return { badge: null, suspicious: false };
}

function activityState(lastActivityAt: string | null): {
  tone: SuiviLearnerDetail["activityTone"];
  label: string;
  inactiveDays: number | null;
} {
  if (!lastActivityAt) return { tone: "gray", label: "Jamais connecté", inactiveDays: null };
  const days = Math.floor((Date.now() - Date.parse(lastActivityAt)) / 86400000);
  if (days < 7) return { tone: "green", label: "Actif", inactiveDays: days };
  if (days < 14) return { tone: "amber", label: `Inactif depuis ${days} jours`, inactiveDays: days };
  return { tone: "red", label: `Inactive depuis ${days} jours`, inactiveDays: days };
}

function countModules(structure: unknown): { total: number; titles: string[]; ids: string[] } {
  const titles: string[] = [];
  const ids: string[] = [];
  const root = structure as { modules?: unknown[]; chapters?: unknown[] } | null;
  const modules = Array.isArray(root?.modules)
    ? root!.modules!
    : Array.isArray(root?.chapters)
      ? root!.chapters!
      : [];
  for (const mod of modules) {
    const m = mod as { id?: string; title?: string; visible?: boolean; lessons?: unknown[] };
    if (!isCourseNodeVisible(m as { deleted_at?: string | null })) continue;
    const id = String(m.id ?? titles.length);
    titles.push(String(m.title ?? `Module ${titles.length + 1}`));
    ids.push(id);
  }
  return { total: titles.length, titles, ids };
}

export async function loadLearnerSuiviDetail(userId: string): Promise<SuiviLearnerDetail | null> {
  const db = getServiceRoleClient();
  if (!db) return null;

  let profileRes = await db
    .from("profiles")
    .select(
      "id, email, first_name, last_name, role, role_type, company_id, entreprise_id, is_test, lms_auto_relance_enabled, created_at",
    )
    .eq("id", userId)
    .maybeSingle();
  if (profileRes.error && /lms_auto_relance|column|schema cache/i.test(profileRes.error.message)) {
    profileRes = await db
      .from("profiles")
      .select(
        "id, email, first_name, last_name, role, role_type, company_id, entreprise_id, is_test, created_at",
      )
      .eq("id", userId)
      .maybeSingle();
  }
  if (!profileRes.data) return null;

  const [{ data: sessionRows }, relanceRes, { data: enrollments }] = await Promise.all([
    db
      .from("learning_sessions")
      .select(
        "started_at, ended_at, duration_seconds, duration_active_seconds, content_type, content_id",
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(500),
    db
      .from("learner_relances")
      .select("id, sent_at, subject, leaf_title, channel, kind, status, scheduled_for")
      .eq("learner_id", userId)
      .order("sent_at", { ascending: false })
      .limit(40),
    (async () => {
      const rich = await db
        .from("enrollments")
        .select(
          "course_id, created_at, courses ( id, title, structure, estimated_duration_minutes, access_days )",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (rich.error && /estimated_duration|access_days|column|schema cache/i.test(rich.error.message)) {
        return db
          .from("enrollments")
          .select("course_id, created_at, courses ( id, title, structure )")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
      }
      return rich;
    })(),
  ]);

  let relancesRaw: Array<Record<string, unknown>> = (relanceRes.data ?? []) as Array<
    Record<string, unknown>
  >;
  if (relanceRes.error && /kind|status|scheduled_for|column|schema cache/i.test(relanceRes.error.message)) {
    const fb = await db
      .from("learner_relances")
      .select("id, sent_at, subject, leaf_title, channel")
      .eq("learner_id", userId)
      .order("sent_at", { ascending: false })
      .limit(40);
    relancesRaw = (fb.data ?? []) as Array<Record<string, unknown>>;
  }

  const profileRow = profileRes.data as Record<string, unknown>;

  const { displayName, nameMissing } = formatLearnerDisplayName(
    profileRow.first_name as string | null,
    profileRow.last_name as string | null,
  );
  const firstName = String(profileRow.first_name ?? "").trim();
  const lastName = String(profileRow.last_name ?? "").trim();
  const email = String(profileRow.email ?? "");
  const initials = nameMissing
    ? "?"
    : [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || displayName.slice(0, 2).toUpperCase();

  const role = String(profileRow.role ?? "");
  const roleType = String(profileRow.role_type ?? "");
  const isTest =
    profileRow.is_test === true || looksLikeTestAccount({ email, role, name: displayName });
  const btoc = isBtocRole(role, roleType);
  const companyId = (profileRow.company_id || profileRow.entreprise_id) as string | null;
  let companyName: string | null = null;
  if (companyId) {
    const { data: org } = await db.from("organizations").select("name").eq("id", companyId).maybeSingle();
    companyName = org?.name ? String(org.name) : null;
  }

  let originKind: SuiviLearnerDetail["originKind"] = "autre";
  let originLabel = roleStatusLabel(role);
  let clientHref: string | null = null;
  if (btoc) {
    originKind = "btoc";
    originLabel = "Particulier";
    clientHref = `/super/utilisateurs/${userId}`;
  } else if (String(roleType).toLowerCase().includes("apprenti") || role === "alternant") {
    originKind = "apprenti";
    originLabel = "Apprenti";
  } else if (companyName) {
    originKind = "entreprise";
    originLabel = companyName;
    clientHref = `/super/entreprises/${companyId}`;
  }

  const metrics = metricsFromLegacySessionRows(
    (sessionRows ?? []).map((s) => ({
      started_at: (s as { started_at?: string }).started_at ?? null,
      ended_at: (s as { ended_at?: string }).ended_at ?? null,
      duration_seconds: (s as { duration_seconds?: number }).duration_seconds ?? null,
      duration_active_seconds:
        (s as { duration_active_seconds?: number }).duration_active_seconds ?? null,
    })),
  );

  // Cap + log invariant côté serveur (actif ≤ connecté déjà dans metrics)
  for (const s of metrics.sessions) {
    if (s.activeSeconds > s.connectedSeconds) {
      console.warn("[suivi-detail] invariant cap", { userId, startedAt: s.startedAt.toISOString() });
      s.activeSeconds = s.connectedSeconds;
    }
  }

  const byStart = new Map<string, { content_type?: string | null }>();
  for (const row of sessionRows ?? []) {
    const started = String((row as { started_at?: string }).started_at ?? "");
    if (started) byStart.set(started.slice(0, 19), row as { content_type?: string | null });
  }

  const sessions: SuiviDetailSession[] = metrics.sessions
    .slice()
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
    .map((s: LogicalSession) => {
      const { badge, suspicious } = suspiciousSession(s.connectedSeconds, s.activeSeconds);
      const raw = byStart.get(s.startedAt.toISOString().slice(0, 19));
      const ct = String(raw?.content_type ?? "");
      let label = "Connexion LMS";
      if (ct === "course") label = "Parcours / module";
      else if (ct === "quiz") label = "Quiz";
      else if (ct === "game" || ct === "serious_game") label = "Jeu";
      else if (ct === "flashcards") label = "Flashcards";
      else if (ct === "lesson" || ct === "chapter") label = "Lecture";
      return {
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt.toISOString(),
        connectedSeconds: s.connectedSeconds,
        activeSeconds: s.activeSeconds,
        label,
        badge,
        suspicious,
      };
    });

  const anomalies = sessions.filter((s) => s.suspicious);

  const courses: Array<{ id: string; title: string; structure?: unknown; estMin?: number | null; accessDays?: number | null }> =
    [];
  for (const enr of enrollments ?? []) {
    const row = enr as unknown as {
      course_id?: string;
      courses?: Record<string, unknown> | Record<string, unknown>[] | null;
    };
    const courseRaw = row.courses;
    const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw;
    const id = String(row.course_id ?? course?.id ?? "");
    if (!id) continue;
    courses.push({
      id,
      title: String(course?.title ?? "Formation"),
      structure: course?.structure,
      estMin:
        course?.estimated_duration_minutes != null
          ? Number(course.estimated_duration_minutes)
          : null,
      accessDays: course?.access_days != null ? Number(course.access_days) : null,
    });
  }

  const primary = courses[0] ?? null;
  const modMeta = primary ? countModules(primary.structure) : { total: 0, titles: [], ids: [] };

  let leaves: unknown[] = [];
  if (primary) {
    const leavesRes = await db
      .from("learner_leaf_completions")
      .select("leaf_id, leaf_title, completed_at, course_id")
      .eq("user_id", userId)
      .eq("course_id", primary.id)
      .order("completed_at", { ascending: false })
      .limit(200);
    if (!leavesRes.error) leaves = leavesRes.data ?? [];
  }

  const completedLeaves = new Set(
    leaves.map((l) => String((l as { leaf_id?: string }).leaf_id ?? "")).filter(Boolean),
  );

  // Quiz scores (best effort — quiz_submissions)
  const quizByModule = new Map<string, number>();
  if (primary) {
    const quizzesRes = await db
      .from("quiz_submissions")
      .select("score, percent, module_id, course_id, created_at, lesson_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!quizzesRes.error) {
      for (const q of quizzesRes.data ?? []) {
        const row = q as Record<string, unknown>;
        const mid = String(row.module_id ?? row.lesson_id ?? "");
        const score = Number(row.percent ?? row.score);
        if (!mid || !Number.isFinite(score) || quizByModule.has(mid)) continue;
        quizByModule.set(mid, score);
      }
    }
  }

  const modules: SuiviModuleRow[] = modMeta.titles.map((title, i) => {
    const id = modMeta.ids[i] ?? `m-${i}`;
    // Heuristique : module done si ≥1 leaf completed matching title/id — sinon ratio global
    const doneHint = [...completedLeaves].some((lid) => lid.startsWith(id) || lid.includes(id));
    const pct =
      modMeta.total > 0
        ? doneHint
          ? 100
          : Math.min(99, Math.round((completedLeaves.size / Math.max(1, modMeta.total * 3)) * 100))
        : 0;
    let status: SuiviModuleRow["status"] = "todo";
    if (pct >= 100) status = "done";
    else if (pct > 0 || (i === 0 && completedLeaves.size > 0)) status = "current";
    return {
      id,
      title,
      progressPct: status === "done" ? 100 : pct,
      status,
      timeLabel: "—",
      quizScore: quizByModule.get(id) ?? null,
    };
  });

  // Marquer un seul « current »
  let currentSet = false;
  for (const m of modules) {
    if (m.status === "done") continue;
    if (!currentSet) {
      m.status = "current";
      if (m.progressPct === 0) m.progressPct = Math.min(40, Math.max(5, completedLeaves.size * 5));
      currentSet = true;
    } else if (m.status === "current") {
      m.status = "todo";
      m.progressPct = 0;
    }
  }

  const modulesDone = modules.filter((m) => m.status === "done").length;
  const modulesTotal = modules.length || Math.max(1, Math.ceil(completedLeaves.size / 3) || 0);
  const progressPct =
    modulesTotal > 0 ? Math.round((modulesDone / modulesTotal) * 100) : completedLeaves.size > 0 ? 10 : 0;

  const accessWeeks =
    primary?.accessDays && primary.accessDays > 0 ? Math.max(1, Math.round(primary.accessDays / 7)) : null;
  const plannedTotalSeconds =
    primary?.estMin && primary.estMin > 0 ? primary.estMin * 60 : null;
  const weeklyGoalSeconds =
    plannedTotalSeconds && accessWeeks ? Math.round(plannedTotalSeconds / accessWeeks) : null;

  // 8 dernières semaines
  const byDay = new Map<string, number>();
  for (const s of metrics.sessions) {
    const day = s.startedAt.toISOString().slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + s.activeSeconds);
  }
  const weekBars: SuiviWeekBar[] = [];
  const thisWeek = startOfWeek(new Date());
  const enrolledAt = (enrollments as Array<{ created_at?: string }> | null)?.[0]?.created_at;
  const firstSessionAt =
    metrics.sessions.length > 0
      ? metrics.sessions.reduce((min, s) => (s.startedAt < min ? s.startedAt : min), metrics.sessions[0].startedAt).toISOString()
      : null;
  const startBound = enrolledAt || firstSessionAt || profileRow.created_at;
  const startBoundMs = startBound ? Date.parse(String(startBound)) : Date.now() - 8 * 7 * 86400000;
  for (let w = 7; w >= 0; w--) {
    const ws = new Date(thisWeek);
    ws.setDate(ws.getDate() - w * 7);
    if (ws.getTime() + 7 * 86400000 < startBoundMs && w < 7) continue;
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);
    let seconds = 0;
    for (const [day, sec] of byDay) {
      const t = Date.parse(day);
      if (t >= ws.getTime() && t < we.getTime()) seconds += sec;
    }
    weekBars.push({
      weekStartIso: ws.toISOString(),
      label: `sem. du ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }).format(ws)}`,
      seconds,
      display: seconds > 0 ? formatDurationCompact(seconds) : "—",
    });
  }

  const lastActivityAt =
    metrics.sessions[0]?.startedAt?.toISOString() ??
    (sessionRows?.[0] as { started_at?: string } | undefined)?.started_at ??
    null;
  // Prefer latest from raw
  let lastIso = lastActivityAt;
  for (const row of sessionRows ?? []) {
    const s = String((row as { started_at?: string }).started_at ?? "");
    if (s && (!lastIso || s > lastIso)) lastIso = s;
  }
  const act = activityState(lastIso);

  const avgConnected =
    metrics.sessionCount > 0 ? Math.round(metrics.connectedSeconds / metrics.sessionCount) : 0;
  const activeRatio =
    metrics.connectedSeconds > 0
      ? Math.round((metrics.activeSeconds / metrics.connectedSeconds) * 100)
      : 0;

  const relances: SuiviRelanceRow[] = (relancesRaw ?? []).map((r) => {
    const row = r as Record<string, unknown>;
    return {
      id: String(row.id ?? ""),
      sentAt: row.sent_at ? String(row.sent_at) : null,
      scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
      subject: String(row.subject ?? row.leaf_title ?? "Relance"),
      kind: String(row.kind ?? (row.channel === "call" ? "appel" : "email_manuel")),
      status: String(row.status ?? "envoye"),
      channel: row.channel ? String(row.channel) : null,
    };
  });

  return {
    userId,
    displayName,
    nameMissing,
    firstName,
    lastName,
    email,
    initials,
    originLabel,
    originKind,
    clientHref,
    isTest,
    autoRelanceEnabled: profileRow.lms_auto_relance_enabled === true,
    courses: courses.map((c) => ({ id: c.id, title: c.title })),
    courseId: primary?.id ?? null,
    courseTitle: primary?.title ?? null,
    accessWeeks,
    plannedTotalSeconds,
    weeklyGoalSeconds,
    progressPct,
    modulesDone,
    modulesTotal: modules.length || modulesTotal,
    sessionCount: metrics.sessionCount,
    firstSessionAt,
    connectedSeconds: metrics.connectedSeconds,
    activeSeconds: metrics.activeSeconds,
    avgConnectedPerSession: avgConnected,
    activeRatioPct: activeRatio,
    lastActivityAt: lastIso,
    inactiveDays: act.inactiveDays,
    activityTone: act.tone,
    activityLabel: act.label,
    weekBars,
    sessions,
    anomalies,
    modules,
    relances,
  };
}
