import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import {
  analyzeCareerMatching,
  type CareerMatchingResult,
  type CareerSkillRow,
} from "@/lib/career-profiles/career-profile-matching";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import {
  buildPublicSkillCards,
  resolvePublicSkillStatus,
} from "@/lib/hard-skills/skill-validation-analysis";
import type { StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import type { PersonalizedActionPlan } from "@/lib/learner/personalized-action-plan";
import type { LearnerVisibleOpenBadge } from "@/lib/openbadges/learner-visible-badges";
import { buildProfilEdgeExplorations, isProfilEdgeComplete } from "@/lib/particulier/profil-edge-progress";
import {
  extractCareerTitleFromProject,
} from "@/lib/particulier/professional-project-fields";
import type { Diplome, ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";

export type SkillGapStatus =
  | "validated"
  | "in_progress"
  | "priority"
  | "to_develop"
  | "badge_available";

export type SkillResourceType =
  | "why"
  | "micro_content"
  | "exercise"
  | "mission"
  | "quiz"
  | "validation"
  | "badge";

export type SkillResource = {
  type: SkillResourceType;
  title: string;
  description?: string;
  href: string;
};

export type EdgeSkillGapRow = {
  name: string;
  estimatedLevel: string;
  gapLabel: string;
  status: SkillGapStatus;
  actionLabel: string;
  actionHref: string;
  whyImportant: string;
  currentResult: string;
  resources: SkillResource[];
};

export type TimelineStep = {
  id: string;
  label: string;
  status: "done" | "current" | "upcoming";
};

export type EdgeNextStep = {
  skill: string;
  subPriority?: string;
  why: string;
  actionLabel: string;
  actionHref: string;
  estimatedMinutes: number;
  expectedOutcome: string;
};

export type EdgeProgressionGps = {
  objectiveTitle: string;
  hasObjective: boolean;
  compatibilityPercent: number;
  prioritySkillsRemaining: number;
  summarySentence: string;
  parcoursHref: string;
  nextStep: EdgeNextStep;
  timeline: TimelineStep[];
  skills: EdgeSkillGapRow[];
};

function gapLabelFromRow(row: CareerSkillRow): string {
  if (row.tone === "green") return "Aligné";
  if (row.tone === "orange") return "À consolider";
  if (row.tone === "red") return "Écart majeur";
  return "Non évalué";
}

function resolveSkillStatus(
  skillName: string,
  matching: CareerMatchingResult | null,
  metadata: Record<string, StoredHardSkillMeta>,
  badgeNames: Set<string>,
): SkillGapStatus {
  const publicStatus = resolvePublicSkillStatus(metadata[skillName]);
  if (publicStatus === "validated" || publicStatus === "expert_validated") return "validated";
  if (publicStatus === "ia_analyzed") return "in_progress";
  if (badgeNames.has(skillName.toLowerCase())) return "badge_available";

  if (matching) {
    if (matching.develop.some((s) => s.toLowerCase() === skillName.toLowerCase())) return "priority";
    if (matching.consolidate.some((s) => s.toLowerCase() === skillName.toLowerCase())) return "to_develop";
    if (matching.nextPriority?.skill.toLowerCase() === skillName.toLowerCase()) return "priority";
  }
  return "to_develop";
}

function statusLabel(status: SkillGapStatus): string {
  switch (status) {
    case "validated":
      return "Validée";
    case "in_progress":
      return "En cours";
    case "priority":
      return "Prioritaire";
    case "badge_available":
      return "Badge disponible";
    default:
      return "À développer";
  }
}

function buildResources(
  skillName: string,
  plan: PersonalizedActionPlan | null,
  badges: LearnerVisibleOpenBadge[],
): SkillResource[] {
  const resources: SkillResource[] = [];
  const skillLower = skillName.toLowerCase();

  const planItems = [
    ...(plan?.items ?? []),
    ...(plan?.parcoursSteps ?? []).map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      description: s.description,
      href: s.href,
      reason: "",
      priority: 0,
    })),
  ];

  for (const item of planItems) {
    if (
      item.title.toLowerCase().includes(skillLower) ||
      item.reason.toLowerCase().includes(skillLower) ||
      item.description.toLowerCase().includes(skillLower)
    ) {
      const type: SkillResourceType =
        item.kind === "badge"
          ? "badge"
          : item.kind === "coaching"
            ? "exercise"
            : item.kind === "formation"
              ? "micro_content"
              : "micro_content";
      resources.push({
        type,
        title: item.title,
        description: item.description,
        href: item.href,
      });
    }
  }

  const matchingBadge = badges.find(
    (b) =>
      b.name.toLowerCase().includes(skillLower) ||
      skillLower.includes(b.name.toLowerCase().slice(0, 6)),
  );
  if (matchingBadge) {
    resources.push({
      type: "badge",
      title: matchingBadge.name,
      description: "Épreuve de validation disponible",
      href: matchingBadge.epreuveHref || matchingBadge.presentationHref,
    });
  }

  resources.push({
    type: "validation",
    title: "Épreuve de validation EDGE",
    description: "Entretien expérientiel ou import de preuve",
    href: "/dashboard/apprenant/profil-comportemental/hard-skills",
  });

  resources.push({
    type: "mission",
    title: "Missions associées",
    href: "/dashboard/apprenant/missions",
  });

  resources.push({
    type: "quiz",
    title: "Tests & évaluations",
    href: "/dashboard/apprenant/results",
  });

  return resources;
}

function buildNextStep(
  matching: CareerMatchingResult | null,
  plan: PersonalizedActionPlan | null,
  objectiveTitle: string,
): EdgeNextStep {
  if (matching?.nextPriority) {
    const p = matching.nextPriority;
    return {
      skill: p.skill,
      subPriority: p.actionType === "micro_formation" ? "Micro-formation recommandée" : undefined,
      why: `Cette compétence est actuellement le principal écart entre votre profil et votre objectif « ${objectiveTitle} ».`,
      actionLabel: p.actionLabel,
      actionHref:
        plan?.items.find((i) => i.title.toLowerCase().includes(p.skill.toLowerCase()))?.href ??
        "/dashboard/apprenant/parcours",
      estimatedMinutes: p.actionType === "micro_formation" ? 25 : 45,
      expectedOutcome: "Progression mesurable sur cette compétence et mise à jour de votre profil EDGE.",
    };
  }

  if (plan?.nextStep) {
    const skill = plan.nextStep.skills[0] ?? "votre prochaine compétence";
    return {
      skill,
      why: plan.nextStep.title,
      actionLabel: plan.nextStep.primaryLabel,
      actionHref: plan.nextStep.primaryHref,
      estimatedMinutes: 30,
      expectedOutcome: `Renforcement de ${skill} pour rapprocher votre profil de votre objectif.`,
    };
  }

  if (matching?.develop[0]) {
    const skill = matching.develop[0];
    return {
      skill,
      why: `Compétence prioritaire pour votre objectif « ${objectiveTitle} ».`,
      actionLabel: "Commencer cette étape",
      actionHref: "/dashboard/apprenant/profil-comportemental/hard-skills",
      estimatedMinutes: 40,
      expectedOutcome: "Première validation ou analyse de cette compétence.",
    };
  }

  return {
    skill: "Compléter votre profil EDGE",
    why: "Vos tests et votre objectif professionnel permettent de calculer les écarts précis.",
    actionLabel: "Définir mon objectif",
    actionHref: "/dashboard/apprenant/profil-comportemental/projet",
    estimatedMinutes: 15,
    expectedOutcome: "Parcours personnalisé et prochaines étapes identifiées.",
  };
}

function buildTimeline(params: {
  hasDisc: boolean;
  hasSoftSkills: boolean;
  hasIdmc: boolean;
  hasObjective: boolean;
  validatedSkills: string[];
  inProgressSkills: string[];
  prioritySkills: string[];
  hasCrossProfileBadge: boolean;
  compatibilityPercent: number;
}): TimelineStep[] {
  const testsDone = params.hasDisc && params.hasSoftSkills && params.hasIdmc;
  const profileGenerated = testsDone;
  const objectiveDefined = params.hasObjective;

  const steps: Array<{ id: string; label: string; done: boolean; current?: boolean }> = [
    { id: "tests", label: "Tests terminés", done: testsDone },
    { id: "profile", label: "Profil EDGE généré", done: profileGenerated },
    { id: "objective", label: "Objectif défini", done: objectiveDefined },
  ];

  const skillSteps = [
    ...params.validatedSkills.slice(0, 2).map((s, i) => ({
      id: `validated-${i}`,
      label: `${s} validée`,
      done: true,
    })),
    ...params.inProgressSkills.slice(0, 1).map((s, i) => ({
      id: `progress-${i}`,
      label: `${s} en cours`,
      done: false,
      current: true,
    })),
    ...params.prioritySkills
      .filter((s) => !params.validatedSkills.includes(s) && !params.inProgressSkills.includes(s))
      .slice(0, 2)
      .map((s, i) => ({
        id: `todo-${i}`,
        label: `${s} à développer`,
        done: false,
      })),
  ];

  steps.push(
    ...skillSteps.map((s) => ({ ...s, current: s.current ?? false })),
    {
      id: "badge",
      label: params.hasCrossProfileBadge ? "Badge profil obtenu" : "Badge final à obtenir",
      done: params.hasCrossProfileBadge,
    },
    {
      id: "goal",
      label: "Objectif atteint",
      done: params.compatibilityPercent >= 85,
    },
  );

  let foundCurrent = false;
  return steps.map((step) => {
    if (step.done) return { id: step.id, label: step.label, status: "done" as const };
    if (!foundCurrent && !step.done) {
      foundCurrent = true;
      return { id: step.id, label: step.label, status: "current" as const };
    }
    return { id: step.id, label: step.label, status: "upcoming" as const };
  });
}

export function buildEdgeProgressionGps(params: {
  profile: Record<string, unknown> | null;
  discScores: DiscScores | null;
  idmcAxes: Record<AxisKey, number> | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  hardSkills: string[];
  skillsMetadata: Record<string, StoredHardSkillMeta>;
  experiences: ExperiencePro[];
  diplomas: Diplome[];
  personalizedPlan: PersonalizedActionPlan | null;
  visibleBadges: LearnerVisibleOpenBadge[];
  earnedBadgeCount: number;
  matching: CareerMatchingResult | null;
  careerTitle?: string | null;
  profileCompletionPercent?: number;
  hasCrossProfileBadge?: boolean;
}): EdgeProgressionGps {
  const project = parseProfessionalProject(params.profile?.professional_project);
  const objectiveTitle =
    params.careerTitle?.trim() ||
    extractCareerTitleFromProject(
      params.profile?.type_profil as string | undefined,
      project,
    ) ||
    String(params.profile?.career_goal_other ?? params.profile?.career_goal ?? "").trim() ||
    "Objectif professionnel";

  const hasObjective = objectiveTitle !== "Objectif professionnel" && objectiveTitle.length > 0;

  const matching = params.matching;
  const compatibilityPercent = matching?.compatibilityScore ?? params.profileCompletionPercent ?? 0;

  const prioritySkills = matching
    ? [...matching.develop, ...matching.consolidate, ...matching.unevaluated]
    : [];

  const prioritySkillsRemaining = matching
    ? matching.develop.length + matching.consolidate.length
    : prioritySkills.length;

  const summarySentence = hasObjective
    ? `Vous êtes à ${compatibilityPercent} % de votre objectif. Il vous reste ${Math.max(prioritySkillsRemaining, 0)} compétence${prioritySkillsRemaining > 1 ? "s" : ""} prioritaire${prioritySkillsRemaining > 1 ? "s" : ""} à développer.`
    : `Complétez votre objectif professionnel pour activer le parcours guidé.`;

  const cards = buildPublicSkillCards(
    params.hardSkills.length ? params.hardSkills : Object.keys(params.skillsMetadata),
    params.skillsMetadata,
  );

  const badgeNameSet = new Set(
    params.visibleBadges.map((b) => b.name.toLowerCase()),
  );

  const skillRows: EdgeSkillGapRow[] = [];

  if (matching?.skillTable?.length) {
    for (const row of matching.skillTable.slice(0, 12)) {
      const status = resolveSkillStatus(row.skill, matching, params.skillsMetadata, badgeNameSet);
      const card = cards.find((c) => c.name.toLowerCase() === row.skill.toLowerCase());
      skillRows.push({
        name: row.skill,
        estimatedLevel: card?.estimatedLevel ?? row.userLevel,
        gapLabel: gapLabelFromRow(row),
        status,
        actionLabel: status === "validated" ? "Voir le détail" : "Travailler",
        actionHref:
          status === "validated"
            ? "/dashboard/apprenant/profil-comportemental/hard-skills"
            : "/dashboard/apprenant/parcours",
        whyImportant: `Compétence clé pour « ${objectiveTitle} » — niveau actuel : ${row.userLevel}.`,
        currentResult: `${row.userLevel} · ${row.source}`,
        resources: buildResources(row.skill, params.personalizedPlan, params.visibleBadges),
      });
    }
  } else {
    for (const card of cards.slice(0, 10)) {
      const status = resolveSkillStatus(card.name, null, params.skillsMetadata, badgeNameSet);
      skillRows.push({
        name: card.name,
        estimatedLevel: card.estimatedLevel,
        gapLabel: status === "validated" ? "Aligné" : "À évaluer",
        status,
        actionLabel: status === "validated" ? "Voir" : "Valider",
        actionHref: "/dashboard/apprenant/profil-comportemental/hard-skills",
        whyImportant: `Compétence de votre portfolio EDGE.`,
        currentResult: card.statusLabel,
        resources: buildResources(card.name, params.personalizedPlan, params.visibleBadges),
      });
    }
  }

  const explorations = buildProfilEdgeExplorations({
    hasDisc: Boolean(params.discScores),
    hasSoftSkills: params.softSkillsRadar.length > 0,
    hasIdmc: Boolean(params.idmcAxes),
  });

  const validatedSkills = cards
    .filter((c) => c.status === "validated" || c.status === "expert_validated")
    .map((c) => c.name);
  const inProgressSkills = cards.filter((c) => c.status === "ia_analyzed").map((c) => c.name);

  const timeline = buildTimeline({
    hasDisc: Boolean(params.discScores),
    hasSoftSkills: params.softSkillsRadar.length > 0,
    hasIdmc: Boolean(params.idmcAxes),
    hasObjective,
    validatedSkills,
    inProgressSkills,
    prioritySkills: matching?.develop ?? [],
    hasCrossProfileBadge: Boolean(params.hasCrossProfileBadge),
    compatibilityPercent,
  });

  const nextStep = buildNextStep(matching, params.personalizedPlan, objectiveTitle);

  return {
    objectiveTitle,
    hasObjective,
    compatibilityPercent,
    prioritySkillsRemaining,
    summarySentence,
    parcoursHref: "/dashboard/apprenant/parcours",
    nextStep,
    timeline,
    skills: skillRows,
  };
}

export function statusLabelForGap(status: SkillGapStatus): string {
  return statusLabel(status);
}

export function isGpsReady(explorations = buildProfilEdgeExplorations({ hasDisc: false, hasSoftSkills: false, hasIdmc: false })): boolean {
  return isProfilEdgeComplete(explorations);
}
