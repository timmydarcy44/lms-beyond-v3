import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import type { AxisKey } from "@/lib/idmc/axes";
import {
  matchParcoursForKeywords,
  getFeaturedCatalogFormations,
  type CatalogFormationPreview,
} from "@/lib/learner/edge-catalog-preview";
import { resolveSkillUxStatus, type StoredHardSkillMeta } from "@/lib/hard-skills/hard-skills-portfolio";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";

export type EmpreinteDimension = {
  key: string;
  label: string;
  /** 0–100 si données réelles, null sinon */
  value: number | null;
  status: "ready" | "empty";
};

export type CockpitNextAction = {
  title: string;
  body: string;
  ctaLabel: string;
  href: string;
};

export type OnlineReco = CatalogFormationPreview & {
  reason: string;
  skills: string[];
};

export function buildEmpreinteDimensions(params: {
  discScores: DiscScores | null;
  hasIdmc: boolean;
  idmcAxes: Record<AxisKey, number> | null;
  hasSoftSkills: boolean;
  softSkillsRadar: Array<{ skill: string; score: number }>;
  hardSkillsCount: number;
  experiencesCount: number;
  provedCount: number;
}): EmpreinteDimension[] {
  const comportement = (() => {
    if (!params.discScores) return null;
    const vals = [
      params.discScores.D,
      params.discScores.I,
      params.discScores.S,
      params.discScores.C,
    ].map(Number);
    const avg = vals.reduce((a, b) => a + b, 0) / 4;
    return Math.min(100, Math.round(avg));
  })();

  const soft = (() => {
    if (!params.hasSoftSkills || !params.softSkillsRadar.length) return null;
    const avg =
      params.softSkillsRadar.reduce((a, s) => a + Number(s.score || 0), 0) /
      params.softSkillsRadar.length;
    return Math.min(100, Math.round(avg));
  })();

  const metier = (() => {
    if (params.hardSkillsCount <= 0) return null;
    return Math.min(100, 25 + params.hardSkillsCount * 8);
  })();

  const experiences = (() => {
    if (params.experiencesCount <= 0) return null;
    return Math.min(100, 20 + params.experiencesCount * 18);
  })();

  const preuves = (() => {
    if (params.provedCount <= 0 && params.hardSkillsCount <= 0) return null;
    if (params.provedCount <= 0) return 15;
    return Math.min(100, 30 + params.provedCount * 20);
  })();

  // IDMC contribue à "Comportement" si dispo (moyenne avec DISC)
  let comportementFinal = comportement;
  if (params.hasIdmc && params.idmcAxes) {
    const axisVals = Object.values(params.idmcAxes).map(Number).filter((n) => !Number.isNaN(n));
    if (axisVals.length) {
      const idmcAvg = axisVals.reduce((a, b) => a + b, 0) / axisVals.length;
      comportementFinal = comportement
        ? Math.round((comportement + idmcAvg) / 2)
        : Math.min(100, Math.round(idmcAvg));
    }
  }

  return [
    {
      key: "comportement",
      label: "Comportement",
      value: comportementFinal,
      status: comportementFinal != null ? "ready" : "empty",
    },
    {
      key: "soft",
      label: "Soft skills",
      value: soft,
      status: soft != null ? "ready" : "empty",
    },
    {
      key: "metier",
      label: "Compétences métier",
      value: metier,
      status: metier != null ? "ready" : "empty",
    },
    {
      key: "experiences",
      label: "Expériences",
      value: experiences,
      status: experiences != null ? "ready" : "empty",
    },
    {
      key: "preuves",
      label: "Preuves",
      value: preuves,
      status: preuves != null ? "ready" : "empty",
    },
  ];
}

export function buildCockpitNextAction(params: {
  matching: CareerMatchingResult | null;
  hardSkills: string[];
  meta: Record<string, StoredHardSkillMeta>;
  hasProject: boolean;
  testsDone: number;
}): CockpitNextAction {
  const develop = params.matching?.develop?.[0] ?? params.matching?.consolidate?.[0] ?? null;
  if (develop) {
    return {
      title: `Développez votre ${develop.toLowerCase()}`,
      body: params.hasProject
        ? "Cette compétence est importante pour votre objectif professionnel."
        : "Cette compétence renforce votre empreinte EDGE.",
      ctaLabel: "S'entraîner dans Skills",
      href: `/dashboard/apprenant/skills/develop?skill=${encodeSkillParam(develop)}`,
    };
  }

  const undeclared = params.hardSkills.find(
    (name) => resolveSkillUxStatus(params.meta[name]) === "auto_declared",
  );
  if (undeclared) {
    return {
      title: `Prouvez « ${undeclared} »`,
      body: "Ajoutez une preuve pour faire progresser votre capital de compétences.",
      ctaLabel: "Ajouter une preuve",
      href: `/dashboard/apprenant/skills/prove?skill=${encodeSkillParam(undeclared)}`,
    };
  }

  if (params.testsDone < 3) {
    return {
      title: "Complétez vos tests EDGE",
      body: "DISC, IDMC et Soft skills alimentent votre empreinte et vos recommandations.",
      ctaLabel: "Voir mes tests",
      href: "/dashboard/apprenant/profil-comportemental/tests",
    };
  }

  if (!params.hasProject) {
    return {
      title: "Définissez votre objectif professionnel",
      body: "Votre cap oriente Skills, Learn et vos recommandations.",
      ctaLabel: "Définir mon cap",
      href: "/dashboard/apprenant/profil-comportemental/identite",
    };
  }

  return {
    title: "Explorez EDGE Skills",
    body: "Entraînez une compétence et prouvez ce que vous savez faire.",
    ctaLabel: "Ouvrir Skills",
    href: "/dashboard/apprenant/skills",
  };
}

export function buildOnlineRecommendations(params: {
  objectiveLabel: string;
  matching: CareerMatchingResult | null;
  softSkillsRadar: Array<{ skill: string; score: number }>;
}): OnlineReco[] {
  const keywords = [
    ...(params.matching?.develop ?? []),
    ...(params.matching?.consolidate ?? []),
    ...params.softSkillsRadar.filter((s) => s.score < 55).map((s) => s.skill),
    params.objectiveLabel,
  ].filter(Boolean);

  const matched = matchParcoursForKeywords(keywords);
  const featured = getFeaturedCatalogFormations(4);
  const bySlug = new Map<string, CatalogFormationPreview>();
  for (const item of [...matched, ...featured]) {
    if (!bySlug.has(item.slug)) bySlug.set(item.slug, item);
  }
  const base = Array.from(bySlug.values()).slice(0, 3);
  const gapSkill = params.matching?.develop?.[0] ?? params.matching?.consolidate?.[0] ?? null;

  return base.map((item, idx) => {
    let reason = "Sélectionné pour enrichir votre parcours EDGE.";
    if (gapSkill && idx === 0) {
      reason = `Cette compétence est importante pour combler un écart identifié (${gapSkill}).`;
    } else if (params.objectiveLabel) {
      reason = `Recommandé pour votre objectif « ${params.objectiveLabel} ».`;
    }
    return {
      ...item,
      href: item.href.includes("edge-lab") ? item.href : `/edgeonline`,
      reason,
      skills: gapSkill && idx === 0 ? [gapSkill] : [item.famille].filter(Boolean),
      image: item.image,
    };
  });
}

export function countProvedSkills(
  hardSkills: string[],
  meta: Record<string, StoredHardSkillMeta>,
): number {
  return hardSkills.filter((name) => {
    const s = resolveSkillUxStatus(meta[name]);
    return s === "proved" || s === "evaluated" || s === "validated";
  }).length;
}

export function countInDevelopment(
  hardSkills: string[],
  meta: Record<string, StoredHardSkillMeta>,
): number {
  return hardSkills.filter((name) => resolveSkillUxStatus(meta[name]) === "auto_declared").length;
}
