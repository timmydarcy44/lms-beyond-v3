import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { getParcours } from "@/lib/parcours";

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
};

type BuildPlanInput = {
  firstName?: string;
  jobTitle?: string | null;
  discScores?: DiscScores | null;
  idmcAxes?: Record<AxisKey, number> | null;
  softSkills?: Array<{ skill: string; score: number }>;
  surface?: "apprenant" | "salarie";
};

const SOFT_SKILL_THRESHOLDS = 55;

const SKILL_COACHING_MAP: Record<string, { coaching: string; formation: string; slug?: string }> = {
  "Intelligence émotionnelle": {
    coaching: "Gestion des émotions et régulation",
    formation: "Micro-formation : identifier et canaliser ses émotions",
    slug: "gestion-emotions",
  },
  "Gestion du stress": {
    coaching: "Gestion du stress et charge mentale",
    formation: "Micro-formation : techniques de respiration et récupération",
    slug: "gestion-stress",
  },
  "Gestion des conflits": {
    coaching: "Médiation et communication assertive",
    formation: "Micro-formation : désamorcer les tensions en équipe",
  },
  Leadership: {
    coaching: "Leadership situationnel",
    formation: "Parcours Leadership — piloter une équipe avec impact",
    slug: "sales-operations-manager",
  },
  "Communication interpersonnelle": {
    coaching: "Communication claire et posture professionnelle",
    formation: "Micro-formation : structurer son message",
  },
  Empathie: {
    coaching: "Intelligence relationnelle",
    formation: "Micro-formation : écoute active et posture bienveillante",
  },
  Adaptabilité: {
    coaching: "Agilité face au changement",
    formation: "Micro-formation : s'adapter aux imprévus",
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
  } = input;

  const hasData = Boolean(discScores || idmcAxes || softSkills.length);
  if (!hasData) return null;

  const needs: string[] = [];
  const items: ActionPlanItem[] = [];
  const coachings: CoachingRecommendation[] = [];
  const root = basePath(surface);

  const weakSkills = [...softSkills]
    .filter((s) => s.score < SOFT_SKILL_THRESHOLDS)
    .sort((a, b) => a.score - b.score);

  for (const skill of weakSkills.slice(0, 3)) {
    const mapping = SKILL_COACHING_MAP[skill.skill];
    if (!mapping) continue;
    needs.push(mapping.coaching);
    items.push({
      id: `formation-${skill.skill}`,
      kind: "formation",
      title: mapping.formation,
      description: `Score actuel : ${skill.score} % — priorité identifiée via vos soft skills.`,
      href: `${root}/formations?focus=${encodeURIComponent(skill.skill)}`,
      reason: `Axe à renforcer : ${skill.skill}`,
      priority: 100 - skill.score,
    });
    coachings.push({
      id: `coach-${skill.skill}`,
      name: pickCoachForSkill(skill.skill).name,
      title: pickCoachForSkill(skill.skill).title,
      specialites: pickCoachForSkill(skill.skill).specialites,
      reason: mapping.coaching,
      photoUrl: pickCoachForSkill(skill.skill).photoUrl,
    });
  }

  if (idmcAxes) {
    const ranked = (Object.entries(idmcAxes) as Array<[AxisKey, number]>).sort(
      (a, b) => a[1] - b[1],
    );
    const weakest = ranked[0];
    if (weakest && weakest[1] < 50) {
      const need = IDMC_AXIS_NEEDS[weakest[0]] ?? "Consolider votre profil IDMC";
      if (!needs.includes(need)) needs.push(need);
      items.push({
        id: `idmc-${weakest[0]}`,
        kind: "micro_formation",
        title: "Micro-formation IDMC ciblée",
        description: `${need} (axe ${weakest[0]} : ${weakest[1]} %).`,
        href: `${root}/formations?focus=idmc`,
        reason: need,
        priority: 100 - weakest[1],
      });
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
        href: `/edge-lab/parcours/${parcours.slug}`,
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
    ? `En tant que ${jobTitle}, voici le plan d'action que nous vous conseillons pour progresser efficacement.`
    : "Voici le plan d'action que nous vous conseillons pour progresser efficacement.";

  const parcoursSteps = items.slice(0, 5).map((item, index) => ({
    id: `step-${item.id}`,
    title: `Étape ${index + 1} — ${item.title}`,
    kind: item.kind,
    description: item.reason,
    href: item.href,
  }));

  return {
    headline,
    summary,
    needs: needs.length ? needs : ["Poursuivre votre montée en compétences"],
    items: items.slice(0, 6),
    coachings: dedupeCoachings(coachings).slice(0, 3),
    parcoursSteps,
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

function pickCoachForSkill(skill: string) {
  if (/émotion|stress|empathie/i.test(skill)) {
    return SALARIE_PRACTITIONERS.jessica;
  }
  if (/leadership|conflit|communication/i.test(skill)) {
    return SALARIE_PRACTITIONERS.jerome;
  }
  return SALARIE_PRACTITIONERS.timmy;
}

export const SALARIE_PRACTITIONERS = {
  jessica: {
    id: "jessica-contentin",
    name: "Jessica Contentin",
    title: "Psychopédagogue — neuroéducation",
    specialites: ["Gestion des émotions", "TDA-H", "Confiance en soi", "Phobie scolaire"],
    photoUrl: "/jessica-contentin/jessica-portrait.jpg",
    bio: "Psychopédagogue certifiée, spécialisée en gestion des émotions et accompagnement TND.",
  },
  timmy: {
    id: "timmy-darcy",
    name: "Timmy Darcy",
    title: "Coach professionnel — performance",
    specialites: ["Leadership", "Communication", "Orientation carrière", "Soft skills"],
    photoUrl: null,
    bio: "Coach certifié EDGE, accompagnement des parcours professionnels et montée en compétences.",
  },
  jerome: {
    id: "jerome-picot",
    name: "Jérôme Picot",
    title: "Consultant management & transformation",
    specialites: ["Management", "Conflits", "Performance d'équipe", "Pilotage"],
    photoUrl: null,
    bio: "Expert management et conduite du changement pour managers et collaborateurs.",
  },
} as const;

export const SALARIE_PRACTITIONERS_LIST = Object.values(SALARIE_PRACTITIONERS);
