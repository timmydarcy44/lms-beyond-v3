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

export type SuiviQuizRow = {
  id: string;
  title: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  completedAt: string | null;
  /** Durée estimée (delta entre leaves) ou session quiz si connue. */
  durationSeconds: number | null;
  source: "quiz_submissions" | "leaf_completion";
  correctHint: string | null;
};

export type SuiviInterviewRow = {
  id: string;
  style: "coaching" | "experiential" | "mise_en_situation";
  chapterTitle: string | null;
  courseTitle: string | null;
  score: number | null;
  passed: boolean | null;
  durationSeconds: number;
  completedAt: string;
  summary: string | null;
  bienDit: string[];
  aRevoir: string[];
  axes: string[];
  compris: string[];
  pasCompris: string[];
};

export type SuiviFlashcardCard = {
  cardId: string;
  front: string;
  result: "known" | "unknown" | "other";
};

export type SuiviFlashcardRow = {
  id: string;
  scopeLabel: string;
  courseTitle: string | null;
  knownCount: number;
  unknownCount: number;
  totalCards: number;
  knownPercent: number;
  durationSeconds: number;
  completedAt: string;
  cards: SuiviFlashcardCard[];
};

export type SuiviLeafTimeRow = {
  leafId: string;
  title: string;
  kind: "lecture" | "quiz" | "jeu" | "entretien" | "autre";
  completedAt: string;
  /** Temps passé estimé avant cette feuille (delta). */
  durationSeconds: number | null;
};

export type SuiviGameRow = {
  id: string;
  title: string;
  courseTitle: string | null;
  score: number | null;
  passed: boolean | null;
  tone: "good" | "mid" | "bad" | null;
  durationSeconds: number | null;
  completedAt: string | null;
  source: "serious_game_attempts" | "leaf_completion";
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
  chaptersDone: number;
  chaptersTotal: number;
  subchaptersDone: number;
  subchaptersTotal: number;
  /** Durée estimée de lecture / contenu (deltas entre leaves). */
  contentSeconds: number;
  readingSeconds: number;
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
  quizzes: SuiviQuizRow[];
  interviews: SuiviInterviewRow[];
  flashcards: SuiviFlashcardRow[];
  games: SuiviGameRow[];
  leafTimes: SuiviLeafTimeRow[];
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

function leafKind(title: string): SuiviLeafTimeRow["kind"] {
  const t = title.toLowerCase();
  if (t.includes("quiz") || t.includes("évaluation") || t.includes("evaluation")) return "quiz";
  if (t.includes("jeu") || t.includes("game") || t.includes("interactif")) return "jeu";
  if (t.includes("entretien") || t.includes("interview") || t.includes("mise en situation")) {
    return "entretien";
  }
  if (t.startsWith("chapter-") || t.includes("chapitre")) return "lecture";
  return "lecture";
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

const MAX_LEAF_DELTA_SEC = 45 * 60;

type OutlineSection = {
  id: string;
  title: string;
  chapters: Array<{
    id: string;
    title: string;
    subchapters: Array<{ id: string; title: string }>;
  }>;
};

function parseBuilderSnapshot(raw: unknown): unknown {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

function parseOutlineFromSnapshot(snapshot: unknown): OutlineSection[] {
  const sectionsRaw =
    snapshot && typeof snapshot === "object"
      ? (snapshot as { sections?: unknown }).sections
      : null;
  if (!Array.isArray(sectionsRaw)) {
    // Legacy structure.modules / structure.chapters
    const root = snapshot as { modules?: unknown[]; chapters?: unknown[] } | null;
    const modules = Array.isArray(root?.modules)
      ? root!.modules!
      : Array.isArray(root?.chapters)
        ? root!.chapters!
        : [];
    return modules
      .filter((mod) => isCourseNodeVisible(mod as { deleted_at?: string | null }))
      .map((mod, index) => {
        const m = mod as { id?: string; title?: string; lessons?: unknown[] };
        const lessons = Array.isArray(m.lessons) ? m.lessons : [];
        return {
          id: String(m.id ?? `module-${index}`),
          title: String(m.title ?? `Module ${index + 1}`),
          chapters: lessons
            .filter((lesson) => isCourseNodeVisible(lesson as { deleted_at?: string | null }))
            .map((lesson, lessonIndex) => {
              const l = lesson as { id?: string; title?: string };
              return {
                id: String(l.id ?? `lesson-${lessonIndex}`),
                title: String(l.title ?? `Chapitre ${lessonIndex + 1}`),
                subchapters: [] as Array<{ id: string; title: string }>,
              };
            }),
        };
      })
      .filter((section) => section.chapters.length > 0 || Boolean(section.title));
  }

  return (sectionsRaw as Array<Record<string, unknown>>)
    .filter((section) => isCourseNodeVisible(section as { deleted_at?: string | null }))
    .map((section, index) => {
      const chaptersRaw = Array.isArray(section.chapters) ? section.chapters : [];
      return {
        id: String(section.id || `section-${index}`),
        title: String(section.title ?? `Module ${index + 1}`),
        chapters: (chaptersRaw as Array<Record<string, unknown>>)
          .filter((chapter) => isCourseNodeVisible(chapter as { deleted_at?: string | null }))
          .map((chapter, chapterIndex) => {
            const subsRaw = Array.isArray(chapter.subchapters) ? chapter.subchapters : [];
            return {
              id: String(chapter.id || `chapter-${chapterIndex}`),
              title: String(chapter.title ?? `Chapitre ${chapterIndex + 1}`),
              subchapters: (subsRaw as Array<Record<string, unknown>>)
                .filter((sub) => isCourseNodeVisible(sub as { deleted_at?: string | null }))
                .map((sub, subIndex) => ({
                  id: String(sub.id || `sub-${subIndex}`),
                  title: String(sub.title ?? `Sous-chapitre ${subIndex + 1}`),
                })),
            };
          }),
      };
    })
    .filter((section) => section.chapters.length > 0);
}

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function outlineProgress(
  sections: OutlineSection[],
  completedLeafIds: Set<string>,
  completedTitles: Set<string>,
): {
  modules: { total: number; titles: string[]; ids: string[] };
  modulesDone: number;
  chaptersDone: number;
  chaptersTotal: number;
  subchaptersDone: number;
  subchaptersTotal: number;
  chapterDoneIds: Set<string>;
} {
  const titles: string[] = [];
  const ids: string[] = [];
  let modulesDone = 0;
  let chaptersDone = 0;
  let chaptersTotal = 0;
  let subchaptersDone = 0;
  let subchaptersTotal = 0;
  const chapterDoneIds = new Set<string>();
  const usedTitles = new Set<string>();

  const markTitle = (title: string): boolean => {
    const key = normalizeTitle(title);
    if (!key || usedTitles.has(key) || !completedTitles.has(key)) return false;
    usedTitles.add(key);
    return true;
  };

  for (const section of sections) {
    titles.push(section.title);
    ids.push(section.id);
    let sectionChaptersDone = 0;
    for (const chapter of section.chapters) {
      chaptersTotal += 1;
      const subs = chapter.subchapters;
      let doneSubs = 0;
      for (const sub of subs) {
        subchaptersTotal += 1;
        const byId = completedLeafIds.has(sub.id);
        const byTitle = !byId && markTitle(sub.title);
        if (byId || byTitle) {
          doneSubs += 1;
          subchaptersDone += 1;
        }
      }
      const chapterLeafDone =
        completedLeafIds.has(chapter.id) || markTitle(chapter.title);
      const allSubsDone = subs.length > 0 && doneSubs >= subs.length;
      if (chapterLeafDone || allSubsDone) {
        chaptersDone += 1;
        sectionChaptersDone += 1;
        chapterDoneIds.add(chapter.id);
      }
    }
    if (section.chapters.length > 0 && sectionChaptersDone >= section.chapters.length) {
      modulesDone += 1;
    }
  }

  return {
    modules: { total: titles.length, titles, ids },
    modulesDone,
    chaptersDone,
    chaptersTotal,
    subchaptersDone,
    subchaptersTotal,
    chapterDoneIds,
  };
}

export async function loadLearnerSuiviDetail(
  userId: string,
  preferredCourseId?: string | null,
): Promise<SuiviLearnerDetail | null> {
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
          "course_id, created_at, courses ( id, title, builder_snapshot, estimated_duration_minutes, access_days )",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (rich.error && /estimated_duration|access_days|column|schema cache/i.test(rich.error.message)) {
        const mid = await db
          .from("enrollments")
          .select("course_id, created_at, courses ( id, title, builder_snapshot )")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
        if (!mid.error) return mid;
        return db
          .from("enrollments")
          .select("course_id, created_at, courses ( id, title )")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);
      }
      if (rich.error && /builder_snapshot|structure|column|schema cache/i.test(rich.error.message)) {
        return db
          .from("enrollments")
          .select("course_id, created_at, courses ( id, title )")
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

  const courses: Array<{
    id: string;
    title: string;
    snapshot?: unknown;
    estMin?: number | null;
    accessDays?: number | null;
  }> = [];
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
      snapshot: parseBuilderSnapshot(course?.builder_snapshot),
      estMin:
        course?.estimated_duration_minutes != null
          ? Number(course.estimated_duration_minutes)
          : null,
      accessDays: course?.access_days != null ? Number(course.access_days) : null,
    });
  }

  // Leaves toutes formations → choisir le cours primaire par activité réelle
  const allLeavesRes = await db
    .from("learner_leaf_completions")
    .select("leaf_id, leaf_title, completed_at, course_id")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(400);
  const allLeaves = (!allLeavesRes.error ? allLeavesRes.data : null) ?? [];

  const preferred =
    preferredCourseId && courses.some((c) => c.id === preferredCourseId)
      ? preferredCourseId
      : null;
  let primary =
    (preferred ? courses.find((c) => c.id === preferred) : null) ??
    null;
  if (!primary && allLeaves.length) {
    const enrolledIds = new Set(courses.map((c) => c.id));
    for (const leaf of allLeaves) {
      const cid = String((leaf as { course_id?: string }).course_id ?? "");
      if (cid && enrolledIds.has(cid)) {
        primary = courses.find((c) => c.id === cid) ?? null;
        break;
      }
    }
    // Activité hors enrollments listés : rattacher le cours quand même
    if (!primary) {
      const cid = String((allLeaves[0] as { course_id?: string }).course_id ?? "");
      if (cid) {
        const { data: orphanCourse } = await db
          .from("courses")
          .select("id, title, builder_snapshot")
          .eq("id", cid)
          .maybeSingle();
        if (orphanCourse) {
          primary = {
            id: String((orphanCourse as { id: string }).id),
            title: String((orphanCourse as { title?: string }).title ?? "Formation"),
            snapshot: parseBuilderSnapshot(
              (orphanCourse as { builder_snapshot?: unknown }).builder_snapshot,
            ),
          };
          if (!courses.some((c) => c.id === primary!.id)) {
            courses.unshift(primary);
          }
        }
      }
    }
  }
  if (!primary) primary = courses[0] ?? null;

  // Si builder_snapshot manquant sur l’enrollment join, recharger
  if (primary && primary.snapshot == null) {
    const { data: courseRow } = await db
      .from("courses")
      .select("id, title, builder_snapshot")
      .eq("id", primary.id)
      .maybeSingle();
    if (courseRow) {
      primary = {
        ...primary,
        title: String((courseRow as { title?: string }).title ?? primary.title),
        snapshot: parseBuilderSnapshot(
          (courseRow as { builder_snapshot?: unknown }).builder_snapshot,
        ),
      };
    }
  }

  const outline = primary ? parseOutlineFromSnapshot(primary.snapshot) : [];
  const leaves = primary
    ? allLeaves.filter((l) => String((l as { course_id?: string }).course_id ?? "") === primary!.id)
    : [];

  const completedLeaves = new Set(
    leaves.map((l) => String((l as { leaf_id?: string }).leaf_id ?? "")).filter(Boolean),
  );
  const completedTitles = new Set(
    leaves
      .map((l) => normalizeTitle(String((l as { leaf_title?: string }).leaf_title ?? "")))
      .filter(Boolean),
  );
  const outlineStats = outlineProgress(outline, completedLeaves, completedTitles);
  const modMeta = outlineStats.modules;

  // Feuilles chronologiques → temps de lecture / quiz estimés (delta borné)
  const leavesChrono = (leaves as Array<Record<string, unknown>>)
    .map((l) => ({
      leafId: String(l.leaf_id ?? ""),
      title: String(l.leaf_title ?? "Contenu").trim() || "Contenu",
      completedAt: String(l.completed_at ?? ""),
    }))
    .filter((l) => l.leafId && l.completedAt)
    .sort((a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt));

  const leafTimes: SuiviLeafTimeRow[] = leavesChrono.map((leaf, index) => {
    let durationSeconds: number | null = null;
    if (index > 0) {
      const prev = leavesChrono[index - 1];
      const delta = Math.round((Date.parse(leaf.completedAt) - Date.parse(prev.completedAt)) / 1000);
      if (Number.isFinite(delta) && delta > 0 && delta <= MAX_LEAF_DELTA_SEC) {
        durationSeconds = delta;
      }
    }
    return {
      leafId: leaf.leafId,
      title: leaf.title,
      kind: leafKind(leaf.title),
      completedAt: leaf.completedAt,
      durationSeconds,
    };
  });

  // Quiz : submissions (score réel) + leaves quiz (durée estimée)
  const quizzes: SuiviQuizRow[] = [];
  const quizByModule = new Map<string, number>();
  const quizzesRes = await db
    .from("quiz_submissions")
    .select("id, test_id, score, answers, created_at, tests(id, title)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);
  if (!quizzesRes.error) {
    for (const q of quizzesRes.data ?? []) {
      const row = q as Record<string, unknown>;
      const testsRaw = row.tests as
        | { id?: string; title?: string }
        | Array<{ id?: string; title?: string }>
        | null;
      const test = Array.isArray(testsRaw) ? testsRaw[0] : testsRaw;
      const score = Number(row.score);
      const answers = row.answers;
      let correctHint: string | null = null;
      if (answers && typeof answers === "object" && !Array.isArray(answers)) {
        const vals = Object.values(answers as Record<string, unknown>);
        correctHint = `${vals.length} réponse${vals.length > 1 ? "s" : ""} enregistrée${vals.length > 1 ? "s" : ""}`;
      }
      quizzes.push({
        id: String(row.id ?? row.test_id ?? ""),
        title: String(test?.title ?? "Quiz").trim() || "Quiz",
        score: Number.isFinite(score) ? score : null,
        maxScore: 100,
        percentage: Number.isFinite(score) ? score : null,
        completedAt: row.created_at ? String(row.created_at) : null,
        durationSeconds: null,
        source: "quiz_submissions",
        correctHint,
      });
      if (Number.isFinite(score) && test?.id) quizByModule.set(String(test.id), score);
    }
  }

  for (const leaf of leafTimes) {
    if (leaf.kind !== "quiz") continue;
    const already = quizzes.some(
      (q) =>
        q.title.toLowerCase() === leaf.title.toLowerCase() ||
        (q.completedAt &&
          Math.abs(Date.parse(q.completedAt) - Date.parse(leaf.completedAt)) < 120_000),
    );
    if (already) {
      const match = quizzes.find(
        (q) =>
          q.title.toLowerCase() === leaf.title.toLowerCase() ||
          (q.completedAt &&
            Math.abs(Date.parse(q.completedAt) - Date.parse(leaf.completedAt)) < 120_000),
      );
      if (match && match.durationSeconds == null && leaf.durationSeconds != null) {
        match.durationSeconds = leaf.durationSeconds;
      }
      continue;
    }
    quizzes.push({
      id: `leaf-${leaf.leafId}`,
      title: leaf.title,
      score: null,
      maxScore: null,
      percentage: null,
      completedAt: leaf.completedAt,
      durationSeconds: leaf.durationSeconds,
      source: "leaf_completion",
      correctHint: "Score non persisté (quiz LMS hors table tests)",
    });
  }

  // Entretiens expérientiels
  const interviews: SuiviInterviewRow[] = [];
  const interviewRes = await db
    .from("experiential_interview_sessions")
    .select(
      "id, course_id, lesson_id, interview_style, chapter_title, course_title, score, ending, passed, duration_seconds, completed_at, feedback, feedback_md",
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(40);
  if (!interviewRes.error) {
    for (const row of interviewRes.data ?? []) {
      const r = row as Record<string, unknown>;
      const fb = (r.feedback ?? null) as Record<string, unknown> | null;
      const styleRaw = String(r.interview_style ?? "experiential");
      const style: SuiviInterviewRow["style"] =
        styleRaw === "coaching"
          ? "coaching"
          : styleRaw === "mise_en_situation"
            ? "mise_en_situation"
            : "experiential";
      interviews.push({
        id: String(r.id),
        style,
        chapterTitle: r.chapter_title ? String(r.chapter_title) : null,
        courseTitle: r.course_title ? String(r.course_title) : null,
        score: r.score != null && Number.isFinite(Number(r.score)) ? Number(r.score) : null,
        passed: typeof r.passed === "boolean" ? r.passed : null,
        durationSeconds: Math.max(0, Number(r.duration_seconds) || 0),
        completedAt: String(r.completed_at ?? new Date().toISOString()),
        summary:
          (fb?.summary ? String(fb.summary) : null) ||
          (r.feedback_md ? String(r.feedback_md).slice(0, 400) : null),
        bienDit: asStringList(fb?.bien_dit),
        aRevoir: asStringList(fb?.a_revoir),
        axes: asStringList(fb?.axes_amelioration),
        compris: asStringList(fb?.compris),
        pasCompris: asStringList(fb?.pas_compris),
      });
    }
  }

  // Jeux interactifs
  const games: SuiviGameRow[] = [];
  const gamesRes = await db
    .from("serious_game_attempts")
    .select(
      "id, game_id, course_id, lesson_id, score, passed, tone, duration_sec, ending_title, completed_at, status",
    )
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(40);
  if (!gamesRes.error) {
    const gameCourseIds = [
      ...new Set(
        (gamesRes.data ?? [])
          .map((r) => String((r as { course_id?: string | null }).course_id ?? ""))
          .filter(Boolean),
      ),
    ];
    const gameCourseTitles = new Map<string, string>();
    if (gameCourseIds.length) {
      const { data: courseRows } = await db.from("courses").select("id, title").in("id", gameCourseIds);
      for (const c of courseRows ?? []) {
        gameCourseTitles.set(
          String((c as { id: string }).id),
          String((c as { title?: string }).title ?? "Formation"),
        );
      }
    }
    for (const row of gamesRes.data ?? []) {
      const r = row as Record<string, unknown>;
      const toneRaw = String(r.tone ?? "");
      const tone: SuiviGameRow["tone"] =
        toneRaw === "good" || toneRaw === "mid" || toneRaw === "bad" ? toneRaw : null;
      const lessonLeaf = leafTimes.find((l) => l.leafId === String(r.lesson_id ?? ""));
      const title =
        (r.ending_title ? String(r.ending_title).trim() : "") ||
        lessonLeaf?.title ||
        (r.game_id ? `Jeu ${String(r.game_id).slice(0, 12)}` : "Jeu interactif");
      games.push({
        id: String(r.id),
        title,
        courseTitle: r.course_id ? gameCourseTitles.get(String(r.course_id)) ?? null : null,
        score: r.score != null && Number.isFinite(Number(r.score)) ? Number(r.score) : null,
        passed: typeof r.passed === "boolean" ? r.passed : null,
        tone,
        durationSeconds:
          r.duration_sec != null && Number.isFinite(Number(r.duration_sec))
            ? Math.max(0, Number(r.duration_sec))
            : null,
        completedAt: r.completed_at ? String(r.completed_at) : null,
        source: "serious_game_attempts",
      });
    }
  }
  for (const leaf of leafTimes) {
    if (leaf.kind !== "jeu") continue;
    const already = games.some(
      (g) =>
        g.title.toLowerCase() === leaf.title.toLowerCase() ||
        (g.completedAt &&
          Math.abs(Date.parse(g.completedAt) - Date.parse(leaf.completedAt)) < 120_000),
    );
    if (already) {
      const match = games.find(
        (g) =>
          g.title.toLowerCase() === leaf.title.toLowerCase() ||
          (g.completedAt &&
            Math.abs(Date.parse(g.completedAt) - Date.parse(leaf.completedAt)) < 120_000),
      );
      if (match && match.durationSeconds == null && leaf.durationSeconds != null) {
        match.durationSeconds = leaf.durationSeconds;
      }
      continue;
    }
    games.push({
      id: `leaf-game-${leaf.leafId}`,
      title: leaf.title,
      courseTitle: primary?.title ?? null,
      score: null,
      passed: null,
      tone: null,
      durationSeconds: leaf.durationSeconds,
      completedAt: leaf.completedAt,
      source: "leaf_completion",
    });
  }

  // Flashcards + annotation carte par carte
  const flashcards: SuiviFlashcardRow[] = [];
  const flashRes = await db
    .from("flashcard_study_sessions")
    .select(
      "id, course_id, scope_id, total_cards, known_count, unknown_count, card_results, duration_seconds, completed_at",
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(40);
  if (!flashRes.error) {
    const cardIds = new Set<string>();
    for (const row of flashRes.data ?? []) {
      const results = (row as { card_results?: Array<{ cardId?: string }> }).card_results ?? [];
      for (const item of results) {
        if (item?.cardId) cardIds.add(String(item.cardId));
      }
    }
    const frontById = new Map<string, string>();
    const ids = [...cardIds].slice(0, 200);
    if (ids.length) {
      const cardsRes = await db.from("flashcards").select("id, front").in("id", ids);
      if (!cardsRes.error) {
        for (const c of cardsRes.data ?? []) {
          frontById.set(String((c as { id: string }).id), String((c as { front?: string }).front ?? "").trim());
        }
      }
    }
    const courseIds = [
      ...new Set(
        (flashRes.data ?? [])
          .map((r) => String((r as { course_id?: string | null }).course_id ?? ""))
          .filter(Boolean),
      ),
    ];
    const courseTitleById = new Map<string, string>();
    if (courseIds.length) {
      const { data: courseRows } = await db.from("courses").select("id, title").in("id", courseIds);
      for (const c of courseRows ?? []) {
        courseTitleById.set(String((c as { id: string }).id), String((c as { title?: string }).title ?? "Formation"));
      }
    }
    for (const row of flashRes.data ?? []) {
      const r = row as Record<string, unknown>;
      const known = Number(r.known_count) || 0;
      const unknown = Number(r.unknown_count) || 0;
      const reviewed = known + unknown;
      const results = (Array.isArray(r.card_results) ? r.card_results : []) as Array<{
        cardId?: string;
        result?: string;
      }>;
      const scopeId = String(r.scope_id ?? "");
      const matchingLeaf = leafTimes.find((l) => l.leafId === scopeId);
      flashcards.push({
        id: String(r.id),
        scopeLabel: matchingLeaf?.title || scopeId || "Révision flashcards",
        courseTitle: r.course_id ? courseTitleById.get(String(r.course_id)) ?? null : null,
        knownCount: known,
        unknownCount: unknown,
        totalCards: Number(r.total_cards) || reviewed,
        knownPercent: reviewed > 0 ? Math.round((known / reviewed) * 100) : 0,
        durationSeconds: Math.max(0, Number(r.duration_seconds) || 0),
        completedAt: String(r.completed_at ?? new Date().toISOString()),
        cards: results.slice(0, 24).map((item) => {
          const cardId = String(item.cardId ?? "");
          const resultRaw = String(item.result ?? "");
          const result: SuiviFlashcardCard["result"] =
            resultRaw === "known" ? "known" : resultRaw === "unknown" ? "unknown" : "other";
          return {
            cardId,
            front: frontById.get(cardId) || `Carte ${cardId.slice(0, 8)}`,
            result,
          };
        }),
      });
    }
  }

  const modules: SuiviModuleRow[] = outline.map((section, i) => {
    const id = section.id || modMeta.ids[i] || `m-${i}`;
    const title = section.title || modMeta.titles[i] || `Module ${i + 1}`;
    const chapterIds = section.chapters.map((ch) => ch.id);
    const doneChapters = chapterIds.filter((cid) => outlineStats.chapterDoneIds.has(cid)).length;
    const totalChapters = Math.max(1, chapterIds.length);
    const pct =
      chapterIds.length === 0
        ? 0
        : Math.round((doneChapters / totalChapters) * 100);
    let status: SuiviModuleRow["status"] = "todo";
    if (pct >= 100) status = "done";
    else if (pct > 0 || doneChapters > 0) status = "current";
    const relatedSeconds = leafTimes
      .filter(
        (l) =>
          l.title.toLowerCase().includes(title.toLowerCase().slice(0, 18)) ||
          l.leafId.includes(id) ||
          chapterIds.some((cid) => l.leafId === cid || l.leafId.startsWith(cid)),
      )
      .reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);
    const quizScore =
      quizzes.find((q) => q.title.toLowerCase().includes(title.toLowerCase().slice(0, 12)))?.percentage ??
      quizByModule.get(id) ??
      null;
    return {
      id,
      title,
      progressPct: status === "done" ? 100 : pct,
      status,
      timeLabel: relatedSeconds > 0 ? formatDurationCompact(relatedSeconds) : "—",
      quizScore,
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

  const modulesDone =
    outlineStats.modulesDone || modules.filter((m) => m.status === "done").length;
  const modulesTotal = modules.length || outlineStats.modules.total;
  const chaptersDone = outlineStats.chaptersDone;
  const chaptersTotal = outlineStats.chaptersTotal;
  const subchaptersDone = outlineStats.subchaptersDone;
  const subchaptersTotal = outlineStats.subchaptersTotal;
  const progressPct =
    chaptersTotal > 0
      ? Math.round((chaptersDone / chaptersTotal) * 100)
      : modulesTotal > 0
        ? Math.round((modulesDone / modulesTotal) * 100)
        : completedLeaves.size > 0
          ? 10
          : 0;
  const readingSeconds = leafTimes
    .filter((l) => l.kind === "lecture" || l.kind === "autre")
    .reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);
  const contentSeconds = leafTimes.reduce((sum, l) => sum + (l.durationSeconds ?? 0), 0);

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

  // Dernière activité = max(fin de séance recalculée, complétion de feuille).
  // On ignore le wall-clock brut (ended_at) : un onglet laissé ouvert la nuit
  // ne doit pas compter comme activité à 5 h du matin.
  let lastIso: string | null = null;
  const consider = (value: string | null | undefined) => {
    const stamp = String(value ?? "").trim();
    if (!stamp) return;
    if (!lastIso || stamp > lastIso) lastIso = stamp;
  };
  for (const s of metrics.sessions) {
    consider(s.startedAt.toISOString());
    consider(s.endedAt.toISOString());
  }
  for (const leaf of leafTimes) {
    consider(leaf.completedAt);
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
    chaptersDone,
    chaptersTotal,
    subchaptersDone,
    subchaptersTotal,
    contentSeconds,
    readingSeconds,
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
    quizzes,
    interviews,
    flashcards,
    games,
    leafTimes: [...leafTimes].reverse(),
  };
}
