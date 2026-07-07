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
  buildUserObjectiveDisplay,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import {
  extractCareerTitleFromProject,
} from "@/lib/particulier/professional-project-fields";
import type { Diplome, ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import {
  gapSeverityFrom,
  levelScoreFromLabel,
  type GapSeverity,
} from "@/lib/apprenant/edge-skill-gap-visuals";

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
  levelScore: number | null;
  gapSeverity: GapSeverity;
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
  referentialTitle: string | null;
  hasObjective: boolean;
  compatibilityPercent: number;
  prioritySkillsRemaining: number;
  gapsCount: number;
  prioritySkill: string;
  summarySentence: string;
  parcoursHref: string;
  nextStep: EdgeNextStep;
  timeline: TimelineStep[];
  skills: EdgeSkillGapRow[];
};

function enrichSkillRow(
  partial: Omit<EdgeSkillGapRow, "levelScore" | "gapSeverity">,
): EdgeSkillGapRow {
  const level = partial.estimatedLevel;
  return {
    ...partial,
    levelScore: levelScoreFromLabel(level),
    gapSeverity: gapSeverityFrom(partial.gapLabel, partial.status),
  };
}

function gapLabelFromRow(row: CareerSkillRow): string {
  if (row.tone === "green") return "Aligné";
  if (row.tone === "orange") return "À consolider";
  if (row.tone === "red") return "Prochaine progression";
  return "À évaluer";
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
      return "Alignée";
    case "in_progress":
      return "En progression";
    case "priority":
      return "Priorité EDGE";
    case "badge_available":
      return "Badge disponible";
    default:
      return "À consolider";
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
      actionLabel: "Demander une recommandation personnalisée",
      actionHref: "/dashboard/apprenant/parcours",
      estimatedMinutes: 2,
      expectedOutcome:
        "Un conseiller EDGE analyse vos résultats et construit une proposition adaptée à votre situation.",
    };
  }

  if (plan?.nextStep) {
    const skill = plan.nextStep.skills[0] ?? "votre prochaine compétence";
    return {
      skill,
      why: plan.nextStep.title,
      actionLabel: "Demander une recommandation personnalisée",
      actionHref: "/dashboard/apprenant/parcours",
      estimatedMinutes: 2,
      expectedOutcome:
        "Un conseiller EDGE analyse vos résultats et construit une proposition adaptée à votre situation.",
    };
  }

  if (matching?.develop[0]) {
    const skill = matching.develop[0];
    return {
      skill,
      why: `Compétence prioritaire pour votre objectif « ${objectiveTitle} ».`,
      actionLabel: "Demander une recommandation personnalisée",
      actionHref: "/dashboard/apprenant/parcours",
      estimatedMinutes: 2,
      expectedOutcome:
        "Un conseiller EDGE analyse vos résultats et construit une proposition adaptée à votre situation.",
    };
  }

  return {
    skill: "Compléter votre profil EDGE",
    why: "Vos tests et votre objectif professionnel permettent de calculer les écarts précis.",
    actionLabel: "Définir mon objectif",
    actionHref: "/dashboard/apprenant/profil-comportemental/projet",
    estimatedMinutes: 5,
    expectedOutcome: "Vos écarts de compétences seront identifiés pour préparer une recommandation.",
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
      label: "Parcours personnalisé proposé",
      done: false,
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
  referentialTitle?: string | null;
  profileCompletionPercent?: number;
  hasCrossProfileBadge?: boolean;
}): EdgeProgressionGps {
  const project = migrateLegacyProjectToV2(parseProfessionalProject(params.profile?.professional_project));
  const userObjectiveTitle =
    buildUserObjectiveDisplay(project) ||
    extractCareerTitleFromProject(
      params.profile?.type_profil as string | undefined,
      project,
    ) ||
    String(params.profile?.career_goal_other ?? params.profile?.career_goal ?? "").trim() ||
    "";
  const referentialTitle = params.referentialTitle?.trim() || params.careerTitle?.trim() || null;
  const objectiveTitle = userObjectiveTitle || referentialTitle || "Objectif professionnel";
  const showReferentialHint =
    Boolean(userObjectiveTitle && referentialTitle) &&
    userObjectiveTitle.toLowerCase() !== referentialTitle.toLowerCase();

  const hasObjective = objectiveTitle !== "Objectif professionnel" && objectiveTitle.length > 0;

  const matching = params.matching;
  const compatibilityPercent = matching?.compatibilityScore ?? params.profileCompletionPercent ?? 0;

  const prioritySkills = matching
    ? [...matching.develop, ...matching.consolidate, ...matching.unevaluated]
    : [];

  const prioritySkillsRemaining = matching
    ? matching.develop.length + matching.consolidate.length
    : prioritySkills.length;

  const gapsCount = Math.max(prioritySkillsRemaining, 0);

  const summarySentence = hasObjective
    ? `Compatibilité estimée : ${compatibilityPercent} %. EDGE a identifié ${gapsCount} écart${gapsCount > 1 ? "s" : ""} de compétences à traiter pour rapprocher votre profil de cet objectif.`
    : `Définissez votre objectif professionnel pour que EDGE identifie vos écarts et prépare une recommandation personnalisée.`;

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
      skillRows.push(
        enrichSkillRow({
          name: row.skill,
          estimatedLevel: card?.estimatedLevel ?? row.userLevel,
          gapLabel: gapLabelFromRow(row),
          status,
          actionLabel: status === "validated" ? "Voir le détail" : "Analyser cette compétence",
          actionHref:
            status === "validated"
              ? "/dashboard/apprenant/profil-comportemental/hard-skills"
              : "/dashboard/apprenant/parcours",
          whyImportant: `Compétence clé pour « ${objectiveTitle} » — niveau actuel : ${row.userLevel}.`,
          currentResult: `${row.userLevel} · ${row.source}`,
          resources: buildResources(row.skill, params.personalizedPlan, params.visibleBadges),
        }),
      );
    }
  } else {
    for (const card of cards.slice(0, 10)) {
      const status = resolveSkillStatus(card.name, null, params.skillsMetadata, badgeNameSet);
      skillRows.push(
        enrichSkillRow({
          name: card.name,
          estimatedLevel: card.estimatedLevel,
          gapLabel: status === "validated" ? "Aligné" : "À évaluer",
          status,
          actionLabel: status === "validated" ? "Voir" : "Valider",
          actionHref: "/dashboard/apprenant/profil-comportemental/hard-skills",
          whyImportant: `Compétence de votre portfolio EDGE.`,
          currentResult: card.statusLabel,
          resources: buildResources(card.name, params.personalizedPlan, params.visibleBadges),
        }),
      );
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
    referentialTitle: showReferentialHint ? referentialTitle : null,
    hasObjective,
    compatibilityPercent,
    prioritySkillsRemaining,
    gapsCount,
    prioritySkill: nextStep.skill,
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
