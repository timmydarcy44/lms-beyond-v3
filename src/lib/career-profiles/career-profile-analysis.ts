import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

const DISC_STRENGTHS: Record<keyof DiscScores, string[]> = {
  D: ["énergie commerciale", "prise de décision", "détermination", "orientation résultats", "assertivité"],
  I: ["aisance relationnelle", "influence", "enthousiasme", "communication", "mobilisation"],
  S: ["écoute active", "patience", "fiabilité", "stabilité relationnelle", "empathie"],
  C: ["rigueur", "organisation", "analyse", "méthode", "fiabilité administrative"],
};

/** Pont entre libellés métier (fiche) et compétences du test EDGE (20 soft skills). */
const CAREER_SOFT_TO_TEST: Record<string, string[]> = {
  "écoute active": ["Écoute active"],
  empathie: ["Empathie"],
  persévérance: ["Persévérance"],
  résilience: ["Persévérance", "Gestion du stress"],
  communication: ["Communication interpersonnelle"],
  organisation: ["Sens de l'organisation", "Gestion du temps"],
  autonomie: ["Proactivité", "Confiance en soi"],
  adaptabilité: ["Adaptabilité"],
  leadership: ["Leadership"],
  rigueur: ["Esprit critique", "Sens des responsabilités"],
  confiance: ["Confiance en soi"],
  patience: ["Écoute active", "Gestion du stress"],
  créativité: ["Créativité"],
  proactivité: ["Proactivité"],
  "gestion du stress": ["Gestion du stress"],
  "travail en équipe": ["Collaboration et travail en équipe"],
  "prise de décision": ["Prise de décision"],
  "résolution de problèmes": ["Résolution des problèmes"],
};

const HARD_SKILL_ALIASES: Record<string, string[]> = {
  prospection: ["énergie commerciale", "détermination", "persévérance", "assertivité", "proactivité"],
  négociation: ["influence", "assertivité", "communication", "détermination"],
  "écoute active": ["écoute active", "empathie", "patience"],
  organisation: ["organisation", "méthode", "rigueur"],
  communication: ["communication", "aisance relationnelle", "influence"],
  résilience: ["détermination", "stabilité relationnelle", "patience"],
  leadership: ["prise de décision", "orientation résultats", "mobilisation"],
  closing: ["assertivité", "détermination", "énergie commerciale"],
  estimation: ["analyse", "méthode", "rigueur"],
  argumentation: ["communication", "influence", "assertivité"],
  "relation client": ["écoute active", "empathie", "aisance relationnelle"],
  "suivi administratif": ["organisation", "méthode", "fiabilité administrative"],
  "connaissance marché": ["analyse", "méthode"],
  gestion: ["organisation", "méthode", "prise de décision"],
  marketing: ["communication", "influence", "créativité"],
  facturation: ["rigueur", "organisation", "fiabilité administrative"],
  "développement commercial": ["énergie commerciale", "persévérance", "influence"],
  conseil: ["écoute active", "empathie", "analyse"],
  fidélisation: ["patience", "fiabilité", "écoute active"],
};

const SOFT_SKILL_MAX = 15;
const SOFT_SKILL_STRONG_THRESHOLD = 10;

export type SkillComparisonItem = {
  skill: string;
  status: "aligned" | "gap";
  detail?: string;
  userScore?: number;
  mappedTestSkill?: string;
};

export type CareerFitAnalysis = {
  score: number;
  hardSkillsScore: number;
  softSkillsScore: number | null;
  hardSkills: SkillComparisonItem[];
  softSkills: SkillComparisonItem[];
  profileStrengths: string[];
  axesToReinforce: string[];
  softSkillsTestDone: boolean;
};

function normalizeSkill(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function profileStrengths(discScores: DiscScores): string[] {
  const { dominant, secondary } = resolveDiscProfile(discScores);
  const primary = DISC_STRENGTHS[dominant];
  const extra = secondary ? DISC_STRENGTHS[secondary].slice(0, 2) : [];
  return [...new Set([...primary, ...extra])];
}

function skillMatchesStrength(skill: string, strengths: string[], aliases: Record<string, string[]>): boolean {
  const norm = normalizeSkill(skill);
  const aliasList = aliases[norm] ?? [norm];
  return strengths.some((s) => {
    const ns = normalizeSkill(s);
    return aliasList.some((a) => {
      const na = normalizeSkill(a);
      return ns.includes(na) || na.includes(ns);
    });
  });
}

function resolveCareerSoftTestSkills(careerSoftSkill: string): string[] {
  const norm = normalizeSkill(careerSoftSkill);
  const direct = CAREER_SOFT_TO_TEST[norm];
  if (direct?.length) return direct;

  const fromCatalog = SOFT_SKILLS.map((s) => s.titre).filter((title) => {
    const nt = normalizeSkill(title);
    return nt.includes(norm) || norm.includes(nt);
  });
  return fromCatalog;
}

function compareHardSkills(career: CareerProfile, strengths: string[]): {
  items: SkillComparisonItem[];
  score: number;
} {
  const items = career.key_skills.map((skill) => {
    const aligned = skillMatchesStrength(skill, strengths, HARD_SKILL_ALIASES);
    return {
      skill,
      status: aligned ? ("aligned" as const) : ("gap" as const),
      detail: aligned
        ? "Cohérent avec votre profil comportemental (DISC)"
        : "À développer ou à valider en situation professionnelle",
    };
  });

  const alignedCount = items.filter((i) => i.status === "aligned").length;
  const score = items.length ? Math.round((alignedCount / items.length) * 100) : 70;

  return { items, score };
}

function compareSoftSkills(
  career: CareerProfile,
  softScores: Record<string, number> | null,
  discStrengths: string[],
): {
  items: SkillComparisonItem[];
  score: number | null;
  testDone: boolean;
} {
  if (!softScores || Object.keys(softScores).length === 0) {
    const items = career.soft_skills.map((skill) => {
      const alignedViaDisc = skillMatchesStrength(skill, discStrengths, HARD_SKILL_ALIASES);
      return {
        skill,
        status: alignedViaDisc ? ("aligned" as const) : ("gap" as const),
        detail: "Complétez le test Soft Skills pour un comparatif précis",
      };
    });
    return { items, score: null, testDone: false };
  }

  const numericScores = Object.entries(softScores)
    .filter(([key]) => key !== "variant")
    .map(([, value]) => Number(value))
    .filter((n) => Number.isFinite(n));
  const median =
    numericScores.length > 0
      ? [...numericScores].sort((a, b) => a - b)[Math.floor(numericScores.length / 2)]
      : 0;

  const items = career.soft_skills.map((skill) => {
    const mapped = resolveCareerSoftTestSkills(skill);
    let bestScore = -1;
    let bestTestSkill = "";

    for (const testSkill of mapped) {
      const raw = softScores[testSkill];
      const score = Number(raw);
      if (Number.isFinite(score) && score > bestScore) {
        bestScore = score;
        bestTestSkill = testSkill;
      }
    }

    const aligned =
      bestScore >= SOFT_SKILL_STRONG_THRESHOLD || (bestScore >= median && bestScore >= 7);

    return {
      skill,
      status: aligned ? ("aligned" as const) : ("gap" as const),
      userScore: bestScore >= 0 ? bestScore : undefined,
      mappedTestSkill: bestTestSkill || undefined,
      detail: bestTestSkill
        ? aligned
          ? `Score ${bestScore}/${SOFT_SKILL_MAX} sur « ${bestTestSkill} »`
          : `Score ${bestScore}/${SOFT_SKILL_MAX} — marge de progression sur « ${bestTestSkill} »`
        : "Non couvert directement par le test — à travailler en situation",
    };
  });

  const alignedCount = items.filter((i) => i.status === "aligned").length;
  const score = items.length ? Math.round((alignedCount / items.length) * 100) : 70;

  return { items, score, testDone: true };
}

function blendScores(hard: number, soft: number | null): number {
  if (soft == null) return Math.round(Math.min(92, Math.max(50, hard * 0.65 + 25)));
  return Math.round(Math.min(95, Math.max(50, hard * 0.45 + soft * 0.55)));
}

export function analyzeCareerFit(params: {
  career: CareerProfile;
  discScores: DiscScores;
  softSkillsScores?: Record<string, number> | null;
}): CareerFitAnalysis {
  const strengths = profileStrengths(params.discScores);
  const hard = compareHardSkills(params.career, strengths);
  const soft = compareSoftSkills(params.career, params.softSkillsScores ?? null, strengths);

  const gaps = [
    ...hard.items.filter((i) => i.status === "gap").map((i) => i.skill),
    ...soft.items.filter((i) => i.status === "gap").map((i) => i.skill),
    ...params.career.typical_challenges.slice(0, 1),
  ]
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .slice(0, 5);

  return {
    score: blendScores(hard.score, soft.score),
    hardSkillsScore: hard.score,
    softSkillsScore: soft.score,
    hardSkills: hard.items,
    softSkills: soft.items,
    profileStrengths: strengths.slice(0, 4),
    axesToReinforce: gaps,
    softSkillsTestDone: soft.testDone,
  };
}
