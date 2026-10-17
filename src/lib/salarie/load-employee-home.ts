import type { SupabaseClient } from "@supabase/supabase-js";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import { DISC_QUESTION_COUNT } from "@/lib/disc/disc-questions";
import { parseStoredDiscScores, resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { getEnterpriseShareConsent } from "@/lib/entreprise/enterprise-share-consent";
import { listSkillProofs } from "@/lib/hard-skills/hard-skills-portfolio";
import { AXES_LABELS, normalizeIdmcAxesRecord, type AxisKey } from "@/lib/idmc/idmc-display";
import { IDMC_QUESTION_COUNT } from "@/lib/idmc/idmc-questions";
import {
  collectLearnerProfileCandidates,
  fetchDiscScoresForCandidates,
  fetchIdmcAxesForCandidates,
  fetchLatestSoftSkillsResultForCandidates,
} from "@/lib/learner/resolve-learner-profile-candidates";
import { getLearnerEarnedOpenBadges } from "@/lib/openbadges/learner-visible-badges";
import { listSalarieAssignedFormations } from "@/lib/salarie/assigned-formations";
import { enterpriseVisibilityForEmployee } from "@/lib/salarie/enterprise-visibility";
import { resolveEmployeeNextStep, type EmployeeNextStep } from "@/lib/salarie/employee-next-step";
import { SOFT_SKILLS_QUESTIONS } from "@/lib/soft-skills/questions";
import {
  softSkillPercentsAreFlat,
  sortSoftSkillsDescending,
} from "@/lib/soft-skills/resolve-soft-skills-result";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export type SalarieHomePayload = {
  profile: { firstName: string; lastName: string; initials: string };
  notifications: number | null;
  formation: {
    id: string;
    title: string;
    href: string;
    completed: number;
    total: number;
    percent: number | null;
    nextLeafTitle: string | null;
    complete: boolean;
  } | null;
  bilans: {
    completed: number;
    expected: number;
    disc: { dominant: string; bars: Array<{ key: string; value: number }>; takenAt: string | null } | null;
    idmc: { strong: string; weak: string | null; axes: number[]; takenAt: string | null } | null;
    soft: { top: string[]; flat: boolean; takenAt: string | null } | null;
  };
  skills: { declared: number; withProof: number };
  badges: { count: number; names: string[] };
  analysis: string | null;
  nextStep: EmployeeNextStep;
  history: Array<{
    id: string;
    kind: "coaching" | "intervention" | "bilan" | "demande";
    title: string;
    subtitle: string;
    status: string;
    done: boolean;
    at: string;
  }>;
  visibility: ReturnType<typeof enterpriseVisibilityForEmployee>;
  search: Array<{ label: string; href: string }>;
};

const BILAN_LINKS = {
  disc: "/dashboard/salarie/test-disc",
  idmc: "/dashboard/salarie/test-idmc",
  soft: "/dashboard/salarie/test-soft-skills",
} as const;

function initials(first: string, last: string) {
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase() || "—";
}

async function leafProgress(
  db: SupabaseClient,
  userId: string,
  courseId: string,
): Promise<{ completed: number; total: number; nextTitle: string | null; percent: number | null }> {
  const empty = { completed: 0, total: 0, nextTitle: null, percent: null };
  const { data } = await db.from("courses").select("builder_snapshot").eq("id", courseId).maybeSingle();
  const raw = (data as { builder_snapshot?: unknown } | null)?.builder_snapshot;
  let snapshot: { sections?: unknown } | null = null;
  try {
    snapshot = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) as { sections?: unknown } : null;
  } catch {
    return empty;
  }
  const sections = Array.isArray(snapshot?.sections) ? snapshot.sections : [];
  const leaves: Array<{ id: string; title: string }> = [];
  for (const section of sections) {
    const chapters = Array.isArray((section as { chapters?: unknown }).chapters)
      ? (section as { chapters: unknown[] }).chapters
      : [];
    for (const chapter of chapters) {
      const subs = Array.isArray((chapter as { subchapters?: unknown }).subchapters)
        ? (chapter as { subchapters: Array<{ id?: string; title?: string }> }).subchapters
        : [];
      if (subs.length) {
        for (const sub of subs) {
          const id = String(sub?.id ?? "").trim();
          if (!id) continue;
          leaves.push({ id, title: String(sub?.title ?? "Sous-chapitre") });
        }
      } else {
        const id = String((chapter as { id?: string }).id ?? "").trim();
        if (id) leaves.push({ id, title: String((chapter as { title?: string }).title ?? "Chapitre") });
      }
    }
  }
  if (!leaves.length) return empty;
  const { data: doneRows } = await db
    .from("learner_leaf_completions")
    .select("leaf_id")
    .eq("user_id", userId)
    .eq("course_id", courseId);
  const done = new Set((doneRows ?? []).map((row) => String((row as { leaf_id?: string }).leaf_id ?? "")));
  const completed = leaves.filter((leaf) => done.has(leaf.id)).length;
  const next = leaves.find((leaf) => !done.has(leaf.id)) ?? null;
  return {
    completed,
    total: leaves.length,
    nextTitle: next?.title ?? null,
    percent: Math.round((completed / leaves.length) * 100),
  };
}

export async function loadSalarieHome(userId: string, email: string | null): Promise<SalarieHomePayload> {
  const db = await getServiceRoleClientOrFallback();
  const emptyHistory: SalarieHomePayload["history"] = [];
  if (!db) {
    return blankHome();
  }

  const profileIds = await collectLearnerProfileCandidates(db, userId, email);
  const [{ data: profile }, { data: employee }, disc, idmc, softRow] = await Promise.all([
    db
      .from("profiles")
      .select("first_name, last_name, company_id, hard_skills, skills_metadata, ai_analysis")
      .eq("id", userId)
      .maybeSingle(),
    db
      .from("employees")
      .select("id, company_id")
      .or(`profile_id.eq.${userId}${email ? `,email.eq.${email}` : ""}`)
      .limit(1)
      .maybeSingle(),
    fetchDiscScoresForCandidates(db, profileIds),
    fetchIdmcAxesForCandidates(db, profileIds),
    fetchLatestSoftSkillsResultForCandidates(db, profileIds),
  ]);

  const firstName = String(profile?.first_name ?? "").trim();
  const lastName = String(profile?.last_name ?? "").trim();
  const companyId = String(profile?.company_id ?? employee?.company_id ?? "").trim() || null;
  const employeeId = String(employee?.id ?? "").trim() || null;

  const discRow = disc
    ? await db.from("disc_resultats").select("updated_at").eq("profile_id", userId).maybeSingle()
    : { data: null };
  const idmcRow = idmc
    ? await db.from("idmc_resultats").select("updated_at").eq("profile_id", userId).maybeSingle()
    : { data: null };

  const softEntries = sortSoftSkillsDescending(
    softRow?.scores
      ? Object.entries(softRow.scores as Record<string, unknown>)
          .filter(([key]) => key !== "variant")
          .map(([skill, score]) => ({ skill, score: Number(score) || 0 }))
          .filter((row) => row.score > 0)
      : [],
  );
  const softFlat = softSkillPercentsAreFlat(softEntries.map((row) => row.score));

  const parsedDisc = disc ?? parseStoredDiscScores(null);
  const discCard = parsedDisc
    ? {
        dominant: DISC_PROFILE_LABELS[resolveDiscProfile(parsedDisc).dominant],
        bars: (["D", "I", "S", "C"] as const).map((key) => ({ key, value: parsedDisc[key] })),
        takenAt: (discRow.data as { updated_at?: string } | null)?.updated_at ?? null,
      }
    : null;

  const axes = idmc ? normalizeIdmcAxesRecord(idmc) : null;
  const axisEntries = axes
    ? (Object.keys(AXES_LABELS) as AxisKey[])
        .map((key) => ({ key, value: Number(axes[key] ?? 0) }))
        .filter((row) => row.value > 0)
    : [];
  const strongest = [...axisEntries].sort((a, b) => b.value - a.value)[0] ?? null;
  const weakest = [...axisEntries].sort((a, b) => a.value - b.value)[0] ?? null;
  const idmcCard =
    strongest
      ? {
          strong: AXES_LABELS[strongest.key],
          weak: weakest && weakest.key !== strongest.key ? AXES_LABELS[weakest.key] : null,
          axes: (Object.keys(AXES_LABELS) as AxisKey[]).map((key) => Number(axes?.[key] ?? 0)),
          takenAt: (idmcRow.data as { updated_at?: string } | null)?.updated_at ?? null,
        }
      : null;

  const softCard = softEntries.length
    ? {
        top: softEntries.slice(0, 3).map((row) => row.skill),
        flat: softFlat,
        takenAt: softRow?.taken_at ?? null,
      }
    : null;

  const completedBilans = [discCard, idmcCard, softCard].filter(Boolean).length;

  const formations = await listSalarieAssignedFormations(userId);
  let formation: SalarieHomePayload["formation"] = null;
  if (formations[0]) {
    const progress = await leafProgress(db, userId, formations[0].id);
    const percent = progress.total > 0 ? progress.percent : null;
    formation = {
      id: formations[0].id,
      title: formations[0].title,
      href: formations[0].href,
      completed: progress.completed,
      total: progress.total,
      percent,
      nextLeafTitle: progress.nextTitle,
      complete: progress.total > 0 && progress.completed >= progress.total,
    };
  }

  const names = Array.isArray(profile?.hard_skills) ? (profile.hard_skills as string[]) : [];
  const meta = (profile?.skills_metadata ?? {}) as Record<string, unknown>;
  let withProof = 0;
  for (const name of names) {
    const skillMeta = meta[name] as Parameters<typeof listSkillProofs>[0];
    if (listSkillProofs(skillMeta).length > 0) withProof += 1;
  }

  let badgeNames: string[] = [];
  try {
    const earned = await getLearnerEarnedOpenBadges(userId);
    badgeNames = earned.map((badge) => badge.name).filter(Boolean);
  } catch {
    badgeNames = [];
  }

  const history: SalarieHomePayload["history"] = [];
  if (discCard?.takenAt) {
    history.push({
      id: "bilan-disc",
      kind: "bilan",
      title: "Bilan DISC",
      subtitle: "Profil comportemental",
      status: "Terminé",
      done: true,
      at: discCard.takenAt,
    });
  }
  if (idmcCard?.takenAt) {
    history.push({
      id: "bilan-idmc",
      kind: "bilan",
      title: "Bilan IDMC",
      subtitle: "Maîtrise cognitive",
      status: "Terminé",
      done: true,
      at: idmcCard.takenAt,
    });
  }
  if (softCard?.takenAt) {
    history.push({
      id: "bilan-soft",
      kind: "bilan",
      title: "Bilan soft skills",
      subtitle: `${softEntries.length} compétences`,
      status: "Terminé",
      done: true,
      at: softCard.takenAt,
    });
  }

  if (employeeId) {
    const { data: missions } = await db
      .from("employee_missions")
      .select("id, title, description, due_date, status, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false })
      .limit(30);
    for (const mission of missions ?? []) {
      const row = mission as {
        id: string;
        title?: string | null;
        description?: string | null;
        due_date?: string | null;
        status?: string | null;
        created_at?: string | null;
      };
      const done = String(row.status ?? "").toLowerCase() === "done";
      history.push({
        id: row.id,
        kind: /coaching/i.test(String(row.title ?? "")) ? "coaching" : "intervention",
        title: String(row.title ?? "Intervention"),
        subtitle: "Planifié par votre entreprise",
        status: done ? "Terminé" : "Planifié",
        done,
        at: row.due_date || row.created_at || new Date(0).toISOString(),
      });
    }
  }

  const { data: requests, error: requestsError } = await db
    .from("training_requests")
    .select("id, label, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (!requestsError) {
  for (const request of requests ?? []) {
    const row = request as { id: string; label?: string | null; status?: string | null; created_at?: string | null };
    const status = String(row.status ?? "new");
    history.push({
      id: row.id,
      kind: "demande",
      title: String(row.label ?? "Demande"),
      subtitle: "Demande envoyée à votre entreprise",
      status: status === "accepted" ? "Acceptée" : status === "declined" ? "Refusée" : status === "seen" ? "Vue" : "Envoyée",
      done: status === "accepted" || status === "declined",
      at: row.created_at || new Date(0).toISOString(),
    });
  }
  }

  history.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));

  const pendingBilan = !discCard
    ? { name: "DISC", href: BILAN_LINKS.disc, questionCount: DISC_QUESTION_COUNT }
    : !idmcCard
      ? { name: "IDMC", href: BILAN_LINKS.idmc, questionCount: IDMC_QUESTION_COUNT }
      : !softCard
        ? { name: "Soft skills", href: BILAN_LINKS.soft, questionCount: SOFT_SKILLS_QUESTIONS.length }
        : null;

  const upcomingMission = history.find((item) => !item.done && (item.kind === "coaching" || item.kind === "intervention"));
  const nextStep = resolveEmployeeNextStep({
    pendingBilan,
    formation: formation
      ? {
          title: formation.title,
          href: formation.href,
          nextLeafTitle: formation.nextLeafTitle,
          complete: formation.complete,
        }
      : null,
    upcoming: upcomingMission
      ? {
          title: upcomingMission.title,
          dateLabel: new Date(upcomingMission.at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
          }),
          href: null,
        }
      : null,
  });

  const consent = companyId ? await getEnterpriseShareConsent(db, userId, companyId) : null;

  let notifications: number | null = null;
  const { count, error: notifError } = await db
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (!notifError && typeof count === "number") notifications = count;

  const analysisRaw = profile?.ai_analysis;
  let analysis: string | null = null;
  if (typeof analysisRaw === "string" && analysisRaw.trim()) {
    try {
      const parsed = JSON.parse(analysisRaw) as { text?: string };
      analysis = parsed.text?.trim() || analysisRaw;
    } catch {
      analysis = analysisRaw;
    }
  }

  const search = [
    ...(formation ? [{ label: formation.title, href: formation.href }] : []),
    ...(discCard ? [{ label: "Bilan DISC", href: "/dashboard/salarie#bilans" }] : []),
    ...(idmcCard ? [{ label: "Bilan IDMC", href: "/dashboard/salarie#bilans" }] : []),
    ...(softCard ? [{ label: "Bilan soft skills", href: "/soft-skills/resultats?from=salarie" }] : []),
  ];

  return {
    profile: { firstName, lastName, initials: initials(firstName, lastName) },
    notifications,
    formation,
    bilans: { completed: completedBilans, expected: 3, disc: discCard, idmc: idmcCard, soft: softCard },
    skills: { declared: names.length, withProof },
    badges: { count: badgeNames.length, names: badgeNames },
    analysis,
    nextStep,
    history,
    visibility: enterpriseVisibilityForEmployee(consent),
    search,
  };
}

function blankHome(): SalarieHomePayload {
  return {
    profile: { firstName: "", lastName: "", initials: "—" },
    notifications: null,
    formation: null,
    bilans: { completed: 0, expected: 3, disc: null, idmc: null, soft: null },
    skills: { declared: 0, withProof: 0 },
    badges: { count: 0, names: [] },
    analysis: null,
    nextStep: resolveEmployeeNextStep({ pendingBilan: null, formation: null, upcoming: null }),
    history: [],
    visibility: enterpriseVisibilityForEmployee(null),
    search: [],
  };
}
