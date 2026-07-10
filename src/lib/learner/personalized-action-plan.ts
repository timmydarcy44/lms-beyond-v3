import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { matchParcoursForKeywords } from "@/lib/learner/edge-catalog-preview";
import {
  pickPractitionerForNeed,
  SALARIE_PRACTITIONERS_FALLBACK,
  type SalariePractitioner,
} from "@/lib/learner/practitioners";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { getParcours } from "@/lib/parcours";
import {
  EDGE_CTA_LAUNCH_PROGRESSION,
  EDGE_CTA_START_PARCOURS,
  premiumSkillTitle,
} from "@/lib/edge-skill-progression-copy";
import { getExpertParcoursHref } from "@/lib/particulier/coaching-config";

export type ActionPlanItemKind = "formation" | "coaching" | "badge" | "micro_formation";

export type ActionPlanItem = {
  id: string;
  kind: ActionPlanItemKind;
  title: string;
  description: string;
  href: string;
  reason: string;
  priority: number;
};

export type CoachingRecommendation = {
  id: string;
  name: string;
  title: string;
  specialites: string[];
  reason: string;
  photoUrl?: string | null;
};

export type ActionPlanNextStep = {
  title: string;
  impactPercent: number;
  skills: string[];
  primaryHref: string;
  primaryLabel: string;
};

export type PersonalizedActionPlan = {
  headline: string;
  summary: string;
  needs: string[];
  items: ActionPlanItem[];
  coachings: CoachingRecommendation[];
  parcoursSteps: Array<{
    id: string;
    title: string;
    kind: ActionPlanItemKind;
    description: string;
    href: string;
  }>;
  nextStep: ActionPlanNextStep | null;
};

type BuildPlanInput = {
  firstName?: string;
  jobTitle?: string | null;
  discScores?: DiscScores | null;
  idmcAxes?: Record<AxisKey, number> | null;
  softSkills?: Array<{ skill: string; score: number }>;
  surface?: "apprenant" | "salarie";
  practitioners?: SalariePractitioner[];
};

const SOFT_SKILL_THRESHOLDS = 55;

const SKILL_COACHING_MAP: Record<string, { coaching: string; parcoursTitle: string; slug?: string }> = {
  "Intelligence émotionnelle": {
    coaching: "Gestion des émotions et régulation",
    parcoursTitle: "Parcours EDGE — Intelligence émotionnelle",
    slug: "gestion-emotions",
  },
  "Gestion du stress": {
    coaching: "Gestion du stress et charge mentale",
    parcoursTitle: "Parcours EDGE — Coach & Facilitateur",
    slug: "coach-facilitateur",
  },
  "Gestion des conflits": {
    coaching: "Médiation et communication assertive",
    parcoursTitle: "Parcours EDGE — Gestion des tensions",
  },
  Leadership: {
    coaching: "Leadership situationnel",
    parcoursTitle: "Parcours EDGE — Leader de la Transformation",
    slug: "leader-transformation",
  },
  "Communication interpersonnelle": {
    coaching: "Communication claire et posture professionnelle",
    parcoursTitle: "Parcours EDGE — Communication professionnelle",
  },
  Empathie: {
    coaching: "Intelligence relationnelle",
    parcoursTitle: "Parcours EDGE — Écoute et posture relationnelle",
  },
  Adaptabilité: {
    coaching: "Agilité face au changement",
    parcoursTitle: "Parcours EDGE — Agilité et adaptation",
  },
};

const IDMC_AXIS_NEEDS: Partial<Record<AxisKey, string>> = {
  A1: "Renforcer la connaissance de soi",
  A6: "Mieux gérer les difficultés et la pression",
  A4: "Structurer son organisation",
  A2: "Optimiser ses méthodes d'apprentissage",
};

function basePath(surface: "apprenant" | "salarie") {
  return surface === "salarie" ? "/dashboard/salarie" : "/dashboard/apprenant";
}

export function buildPersonalizedActionPlan(input: BuildPlanInput): PersonalizedActionPlan | null {
  const {
    firstName = "Vous",
    jobTitle,
    discScores,
    idmcAxes,
    softSkills = [],
    surface = "apprenant",
    practitioners = SALARIE_PRACTITIONERS_FALLBACK,
  } = input;

  const hasData = Boolean(discScores || idmcAxes || softSkills.length);
  if (!hasData) return null;

  const needs: string[] = [];
  const items: ActionPlanItem[] = [];
  const coachings: CoachingRecommendation[] = [];
  const root = basePath(surface);
  const expertHref = surface === "apprenant" ? getExpertParcoursHref() : `${root}/parcours`;

  const weakSkills = [...softSkills]
    .filter((s) => s.score < SOFT_SKILL_THRESHOLDS)
    .sort((a, b) => a.score - b.score);

  for (const skill of weakSkills.slice(0, 3)) {
    const mapping = SKILL_COACHING_MAP[skill.skill];
    if (!mapping) continue;
    needs.push(mapping.coaching);
    const parcoursHref =
      surface === "apprenant"
        ? expertHref
        : mapping.slug
          ? `/edge-lab/parcours/${mapping.slug}`
          : `${root}/parcours?focus=${encodeURIComponent(skill.skill)}`;
    const parcours = mapping.slug ? getParcours(mapping.slug) : null;
    items.push({
      id: `formation-${skill.skill}`,
      kind: parcours ? "formation" : "micro_formation",
      title: parcours?.titre ?? mapping.parcoursTitle,
      description: parcours
        ? `${parcours.description.slice(0, 120)}… Progression actuelle : ${skill.score} %.`
        : `Progression actuelle : ${skill.score} % — priorité identifiée via votre profil EDGE.`,
      href: parcoursHref,
      reason: `Axe à renforcer : ${skill.skill}`,
      priority: 100 - skill.score,
    });
    const coach = practitionerToRecommendation(
      pickPractitionerForNeed(practitioners, mapping.coaching),
      mapping.coaching,
      skill.skill,
    );
    if (coach) coachings.push(coach);
  }

  if (idmcAxes) {
    const ranked = (Object.entries(idmcAxes) as Array<[AxisKey, number]>).sort(
      (a, b) => a[1] - b[1],
    );
    const weakest = ranked[0];
    if (weakest && weakest[1] < 50) {
      const need = IDMC_AXIS_NEEDS[weakest[0]] ?? "Consolider votre profil IDMC";
      if (!needs.includes(need)) needs.push(need);
      const matched = matchParcoursForKeywords([need]);
      const formation = matched[0];
      items.push({
        id: `idmc-${weakest[0]}`,
        kind: formation ? "formation" : "micro_formation",
        title: formation?.title ?? "Parcours EDGE — consolidation IDMC",
        description: formation
          ? `${formation.description} (axe ${weakest[0]} : ${weakest[1]} %).`
          : `${need} (axe ${weakest[0]} : ${weakest[1]} %).`,
        href: formation?.href ?? (surface === "apprenant" ? expertHref : `${root}/parcours?focus=idmc`),
        reason: need,
        priority: 100 - weakest[1],
      });
      const coach = practitionerToRecommendation(
        pickPractitionerForNeed(practitioners, need),
        need,
        `idmc-${weakest[0]}`,
      );
      if (coach) coachings.push(coach);
    }
  }

  if (discScores) {
    const { dominant } = resolveDiscProfile(discScores);
    if (dominant === "S" && !needs.some((n) => n.toLowerCase().includes("émotion"))) {
      needs.push("Stabiliser votre équilibre émotionnel au quotidien");
      items.push({
        id: "disc-stability",
        kind: "coaching",
        title: "Coaching bien-être & régulation",
        description: "Votre profil DISC met en avant la recherche de stabilité — un accompagnement ciblé peut vous aider.",
        href: `${root}/coachings?focus=emotions`,
        reason: "Profil DISC orienté stabilité (S)",
        priority: 40,
      });
    }
    if (dominant === "D" && jobTitle?.toLowerCase().includes("manager")) {
      needs.push("Affiner votre leadership opérationnel");
    }
  }

  if (jobTitle?.trim()) {
    const parcours = getParcours("sales-operations-manager");
    if (/commercial|sales|vente/i.test(jobTitle) && parcours) {
      items.push({
        id: "job-sales",
        kind: "formation",
        title: parcours.titre,
        description: parcours.description.slice(0, 140) + "…",
        href: surface === "apprenant" ? expertHref : `/edge-lab/parcours/${parcours.slug}`,
        reason: `Aligné avec votre poste : ${jobTitle}`,
        priority: 30,
      });
    }
  }

  items.push({
    id: "badge-soft-skills",
    kind: "badge",
    title: "Open Badge — Soft Skills certifiées",
    description: "Validez vos acquis et partagez-les sur LinkedIn.",
    href: `${root}/badges`,
    reason: "Capitaliser sur vos résultats",
    priority: 10,
  });

  items.sort((a, b) => b.priority - a.priority);

  const primaryNeed = needs[0] ?? "consolider vos acquis professionnels";
  const headline = `${firstName}, vos résultats montrent un besoin en ${primaryNeed.toLowerCase()}`;
  const summary = jobTitle
    ? `En tant que ${jobTitle}, voici l'accompagnement EDGE recommandé pour accélérer votre progression.`
    : "Voici l'accompagnement EDGE recommandé pour accélérer votre progression.";

  const parcoursSteps = items.slice(0, 5).map((item, index) => ({
    id: `step-${item.id}`,
    title: `Étape ${index + 1} — ${item.title}`,
    kind: item.kind,
    description: item.reason,
    href: item.href,
  }));

  const topSkills = weakSkills.slice(0, 3).map((s) => s.skill);
  const topItem = items[0];
  const nextStep: ActionPlanNextStep | null =
    topSkills.length > 0 && topItem
      ? {
          title: "Votre prochaine étape",
          impactPercent: Math.min(12, Math.max(5, Math.round((SOFT_SKILL_THRESHOLDS - (weakSkills[0]?.score ?? 40)) * 0.2))),
          skills: topSkills.map((s) => premiumSkillTitle(s)),
          primaryHref: surface === "apprenant" ? expertHref : topItem.href,
          primaryLabel:
            surface === "apprenant"
              ? EDGE_CTA_START_PARCOURS
              : topItem.kind === "coaching"
                ? "Réserver un accompagnement"
                : EDGE_CTA_LAUNCH_PROGRESSION,
        }
      : null;

  return {
    headline,
    summary,
    needs: needs.length ? needs : ["Poursuivre votre montée en compétences"],
    items: items.slice(0, 6),
    coachings: dedupeCoachings(coachings).slice(0, 3),
    parcoursSteps,
    nextStep,
  };
}

function practitionerToRecommendation(
  p: SalariePractitioner | null,
  reason: string,
  idSuffix: string,
): CoachingRecommendation | null {
  if (!p) return null;
  return {
    id: `coach-${idSuffix}`,
    name: p.name,
    title: p.title,
    specialites: p.specialites,
    reason,
    photoUrl: p.photoUrl,
  };
}

function dedupeCoachings(items: CoachingRecommendation[]) {
  const seen = new Set<string>();
  return items.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

export const SALARIE_PRACTITIONERS = {
  jessica: SALARIE_PRACTITIONERS_FALLBACK[0],
  timmy: SALARIE_PRACTITIONERS_FALLBACK[1],
  jerome: SALARIE_PRACTITIONERS_FALLBACK[2],
} as const;

export const SALARIE_PRACTITIONERS_LIST = SALARIE_PRACTITIONERS_FALLBACK;
