import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { analyzeCareerFit } from "@/lib/career-profiles/career-profile-analysis";
import type { Diplome, ExperiencePro, HardSkillLevel, LearnerHardSkillMeta } from "@/lib/particulier/profil-edge-maturity";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export type SkillLevelLabel =
  | "Excellent"
  | "Très bon"
  | "Bon"
  | "Moyen"
  | "À renforcer"
  | "Non évaluée"
  | "Non renseigné";

export type CareerSkillRow = {
  skill: string;
  userLevel: SkillLevelLabel;
  tone: "green" | "orange" | "red" | "gray";
  source: string;
};

export type CareerSkillBucket = "strength" | "consolidate" | "develop" | "unevaluated";

export type CareerNextPriority = {
  skill: string;
  impactPercent: number;
  actionType: "micro_formation" | "evaluation" | "proof";
  actionLabel: string;
};

export type CareerMatchingResult = {
  compatibilityScore: number;
  strengths: string[];
  /** Compétences connues mais pouvant être améliorées. */
  consolidate: string[];
  /** Compétences évaluées comme insuffisantes. */
  develop: string[];
  unevaluated: string[];
  skillTable: CareerSkillRow[];
  actionPlanAxes: string[];
  nextPriority: CareerNextPriority | null;
  /** @deprecated Utiliser `develop` — conservé pour compatibilité interne. */
  gaps: string[];
};

/** Score numérique minimal pour classer une compétence en « Force » (niveau Bon et au-dessus). */
export const CAREER_STRENGTH_THRESHOLD = 72;

/** Score minimal pour « À consolider » (compétence connue mais perfectible). */
export const CAREER_CONSOLIDATE_THRESHOLD = 55;

const CAREER_SOFT_TO_TEST: Record<string, string[]> = {
  "écoute active": ["Écoute active"],
  empathie: ["Empathie"],
  persévérance: ["Persévérance"],
  résilience: ["Persévérance", "Gestion du stress"],
  communication: ["Communication interpersonnelle"],
  persuasion: ["Communication interpersonnelle", "Confiance en soi"],
  organisation: ["Sens de l'organisation", "Gestion du temps"],
  autonomie: ["Proactivité", "Confiance en soi"],
  négociation: ["Communication interpersonnelle", "Prise de décision"],
  prospection: ["Proactivité", "Persévérance"],
  crm: [],
  "relation client": ["Écoute active", "Empathie"],
  "gestion du stress": ["Gestion du stress"],
  "gestion des objections": ["Gestion des conflits", "Communication interpersonnelle"],
};

const HARD_LEVEL_SCORE: Record<HardSkillLevel, number> = {
  Débutant: 45,
  Intermédiaire: 62,
  Confirmé: 78,
  Expert: 92,
};

const SOFT_SCORE_LABELS: Array<{ min: number; label: SkillLevelLabel; tone: CareerSkillRow["tone"] }> = [
  { min: 12, label: "Excellent", tone: "green" },
  { min: 10, label: "Très bon", tone: "green" },
  { min: 8, label: "Bon", tone: "green" },
  { min: 6, label: "Moyen", tone: "orange" },
  { min: 0, label: "À renforcer", tone: "red" },
];

function normalizeSkill(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function careerExpectedSkills(career: CareerProfile): string[] {
  return [...new Set([...career.key_skills, ...career.soft_skills, ...career.behavioral_expectations])];
}

function softScoreToLabel(score: number): { label: SkillLevelLabel; tone: CareerSkillRow["tone"] } {
  for (const row of SOFT_SCORE_LABELS) {
    if (score >= row.min) return { label: row.label, tone: row.tone };
  }
  return { label: "À renforcer", tone: "red" };
}

function hardLevelToLabel(level: HardSkillLevel | undefined): { label: SkillLevelLabel; tone: CareerSkillRow["tone"]; score: number } {
  if (!level) return { label: "Non renseigné", tone: "gray", score: 0 };
  const score = HARD_LEVEL_SCORE[level] ?? 50;
  if (level === "Expert") return { label: "Excellent", tone: "green", score };
  if (level === "Confirmé") return { label: "Très bon", tone: "green", score };
  if (level === "Intermédiaire") return { label: "Bon", tone: "green", score };
  return { label: "Moyen", tone: "orange", score };
}

function findHardSkillMatch(
  skill: string,
  hardSkills: string[],
  skillsMetadata: Record<string, LearnerHardSkillMeta>,
): { label: SkillLevelLabel; tone: CareerSkillRow["tone"]; score: number; source: string } | null {
  const norm = normalizeSkill(skill);
  for (const hs of hardSkills) {
    const nhs = normalizeSkill(hs);
    if (nhs.includes(norm) || norm.includes(nhs)) {
      const meta = skillsMetadata[hs];
      const mapped = hardLevelToLabel(meta?.level);
      return { ...mapped, source: "Hard skill déclaré" };
    }
  }
  return null;
}

function findSoftSkillMatch(
  skill: string,
  softScores: Record<string, number> | null,
): { label: SkillLevelLabel; tone: CareerSkillRow["tone"]; score: number; source: string } | null {
  if (!softScores) return null;
  const mapped = CAREER_SOFT_TO_TEST[normalizeSkill(skill)] ?? [];
  const catalog = SOFT_SKILLS.map((s) => s.titre).filter((title) => {
    const nt = normalizeSkill(title);
    return nt.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(nt);
  });
  const candidates = [...new Set([...mapped, ...catalog])];
  let best = -1;
  let bestTitle = "";
  for (const title of candidates) {
    const score = Number(softScores[title]);
    if (Number.isFinite(score) && score > best) {
      best = score;
      bestTitle = title;
    }
  }
  if (best < 0) return null;
  const mappedLabel = softScoreToLabel(best);
  return { ...mappedLabel, score: best, source: `Test Soft Skills (${bestTitle})` };
}

function experienceMentionsSkill(skill: string, experiences: ExperiencePro[]): boolean {
  const norm = normalizeSkill(skill);
  return experiences.some((exp) => {
    const blob = [exp.poste, exp.missions, ...(exp.competences_developpees ?? [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return blob.includes(norm);
  });
}

function diplomaMentionsSkill(skill: string, diplomas: Diplome[]): boolean {
  const norm = normalizeSkill(skill);
  return diplomas.some((d) => {
    const blob = [d.intitule, d.description, d.niveau, d.diploma_type].filter(Boolean).join(" ").toLowerCase();
    return blob.includes(norm);
  });
}

function rowToNumericScore(row: CareerSkillRow): number | null {
  if (row.userLevel === "Non évaluée" || row.userLevel === "Non renseigné") return null;
  if (row.userLevel === "Excellent") return 95;
  if (row.userLevel === "Très bon") return 85;
  if (row.userLevel === "Bon") return 72;
  if (row.userLevel === "Moyen") return 55;
  if (row.userLevel === "À renforcer") return 35;
  return null;
}

function scoreToPercent(scores: number[]): number {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function classifySkillRow(row: CareerSkillRow): CareerSkillBucket {
  const score = rowToNumericScore(row);
  if (score === null) return "unevaluated";
  if (score >= CAREER_STRENGTH_THRESHOLD) return "strength";
  if (score >= CAREER_CONSOLIDATE_THRESHOLD) return "consolidate";
  return "develop";
}

function rebalanceBuckets(
  skillTable: CareerSkillRow[],
  buckets: Record<CareerSkillBucket, string[]>,
): Record<CareerSkillBucket, string[]> {
  const result = {
    strength: [...buckets.strength],
    consolidate: [...buckets.consolidate],
    develop: [...buckets.develop],
    unevaluated: [...buckets.unevaluated],
  };

  if (result.develop.length > 0 || result.consolidate.length > 0) return result;

  const scoredStrengths = skillTable
    .filter((row) => result.strength.includes(row.skill))
    .map((row) => ({ skill: row.skill, score: rowToNumericScore(row) ?? 0 }))
    .sort((a, b) => a.score - b.score);

  const toConsolidate = scoredStrengths.slice(0, Math.min(3, scoredStrengths.length));
  for (const item of toConsolidate) {
    result.strength = result.strength.filter((s) => s !== item.skill);
    if (!result.consolidate.includes(item.skill)) {
      result.consolidate.push(item.skill);
    }
  }

  return result;
}

function estimateImpactPercent(skill: string, currentScore: number | null, compatibilityScore: number): number {
  const base = currentScore != null ? Math.max(4, Math.round((100 - currentScore) * 0.12)) : 8;
  const ceiling = Math.min(14, Math.max(5, 100 - compatibilityScore));
  const skillHash = skill.length % 3;
  return Math.min(ceiling, base + skillHash);
}

function buildNextPriority(
  skillTable: CareerSkillRow[],
  develop: string[],
  consolidate: string[],
  unevaluated: string[],
  compatibilityScore: number,
): CareerNextPriority | null {
  const pickSkill = develop[0] ?? consolidate[0] ?? unevaluated[0];
  if (!pickSkill) return null;

  const row = skillTable.find((r) => r.skill === pickSkill);
  const score = row ? rowToNumericScore(row) : null;

  let actionType: CareerNextPriority["actionType"] = "micro_formation";
  let actionLabel = "Commencer la micro-formation";

  if (develop.includes(pickSkill)) {
    actionType = "micro_formation";
    actionLabel = "Commencer la micro-formation";
  } else if (consolidate.includes(pickSkill)) {
    actionType = "evaluation";
    actionLabel = "Passer une nouvelle évaluation";
  } else {
    actionType = "proof";
    actionLabel = "Déposer une preuve";
  }

  return {
    skill: pickSkill,
    impactPercent: estimateImpactPercent(pickSkill, score, compatibilityScore),
    actionType,
    actionLabel,
  };
}

function axisMessage(skill: string): string {
  const norm = normalizeSkill(skill);
  const label = skill.charAt(0).toUpperCase() + skill.slice(1);
  if (norm.includes("resilien") || norm.includes("stress")) {
    return `Développer votre résilience face aux situations exigeantes (${label}).`;
  }
  if (norm.includes("negoc") || norm.includes("objection")) {
    return `Améliorer vos techniques de négociation et de traitement des objections (${label}).`;
  }
  if (norm.includes("organ")) {
    return `Renforcer votre organisation et votre rigueur opérationnelle (${label}).`;
  }
  if (norm.includes("prospec")) {
    return `Structurer votre prospection et votre régularité commerciale (${label}).`;
  }
  return `Renforcer ${label} pour vous rapprocher du référentiel métier.`;
}

export function analyzeCareerMatching(params: {
  career: CareerProfile;
  discScores: DiscScores;
  softSkillsScores?: Record<string, number> | null;
  hardSkills?: string[];
  skillsMetadata?: Record<string, LearnerHardSkillMeta>;
  experiences?: ExperiencePro[];
  diplomas?: Diplome[];
  hasIdmc?: boolean;
}): CareerMatchingResult {
  const base = analyzeCareerFit({
    career: params.career,
    discScores: params.discScores,
    softSkillsScores: params.softSkillsScores,
  });

  const hardSkills = params.hardSkills ?? [];
  const skillsMetadata = params.skillsMetadata ?? {};
  const experiences = params.experiences ?? [];
  const diplomas = params.diplomas ?? [];
  const expected = careerExpectedSkills(params.career);

  const skillTable: CareerSkillRow[] = expected.map((skill) => {
    const soft = findSoftSkillMatch(skill, params.softSkillsScores ?? null);
    const hard = findHardSkillMatch(skill, hardSkills, skillsMetadata);
    const fromExp = experienceMentionsSkill(skill, experiences);
    const fromDip = diplomaMentionsSkill(skill, diplomas);

    if (soft && (!hard || soft.score >= (hard.score ?? 0))) {
      return { skill, userLevel: soft.label, tone: soft.tone, source: soft.source };
    }
    if (hard) {
      return { skill, userLevel: hard.label, tone: hard.tone, source: hard.source };
    }
    if (fromExp) {
      return { skill, userLevel: "Bon", tone: "green", source: "Expérience professionnelle" };
    }
    if (fromDip) {
      return { skill, userLevel: "Bon", tone: "green", source: "Formation / diplôme" };
    }

    const discAligned =
      base.hardSkills.find((h) => normalizeSkill(h.skill) === normalizeSkill(skill))?.status === "aligned" ||
      base.softSkills.find((s) => normalizeSkill(s.skill) === normalizeSkill(skill))?.status === "aligned";

    if (discAligned) {
      return { skill, userLevel: "Bon", tone: "green", source: "Profil comportemental (DISC)" };
    }

    return {
      skill,
      userLevel: params.softSkillsScores ? "Non évaluée" : "Non renseigné",
      tone: "gray",
      source: "—",
    };
  });

  const rowScores = skillTable.map((row) => rowToNumericScore(row) ?? 20);
  const compatibilityScore = scoreToPercent(rowScores.length ? rowScores : [base.score]);

  const rawBuckets: Record<CareerSkillBucket, string[]> = {
    strength: [],
    consolidate: [],
    develop: [],
    unevaluated: [],
  };

  for (const row of skillTable) {
    const bucket = classifySkillRow(row);
    rawBuckets[bucket].push(row.skill);
  }

  const balanced = rebalanceBuckets(skillTable, rawBuckets);
  const { strength: strengths, consolidate, develop, unevaluated } = balanced;

  const prioritySkills = [...develop, ...consolidate, ...unevaluated].slice(0, 3);
  const actionPlanAxes = prioritySkills.map(axisMessage);

  const nextPriority = buildNextPriority(skillTable, develop, consolidate, unevaluated, compatibilityScore);

  return {
    compatibilityScore,
    strengths,
    consolidate,
    develop,
    unevaluated,
    skillTable,
    actionPlanAxes: actionPlanAxes.length
      ? actionPlanAxes
      : consolidate.slice(0, 3).map((s) => `Consolider ${s.toLowerCase()} pour viser l'excellence.`),
    nextPriority,
    gaps: develop,
  };
}

export function buildDynamicActionPlan(params: {
  firstName: string;
  careerTitle: string;
  matching: CareerMatchingResult;
  discScores: DiscScores;
}): string {
  const name = params.firstName.trim() || "Vous";
  const { dominant } = resolveDiscProfile(params.discScores);
  const discHint =
    dominant === "D"
      ? "Votre énergie et votre orientation résultats sont des atouts pour ce métier."
      : dominant === "I"
        ? "Votre aisance relationnelle est un levier important pour ce métier."
        : dominant === "S"
          ? "Votre constance et votre écoute sont des fondations solides pour ce métier."
          : "Votre rigueur et votre sens de l'analyse soutiennent votre progression vers ce métier.";

  const axes =
    params.matching.actionPlanAxes.length > 0
      ? params.matching.actionPlanAxes
      : ["Consolider vos acquis et préciser votre projet professionnel."];

  const intro =
    params.matching.compatibilityScore >= 75
      ? `${name}, votre profil est particulièrement adapté au métier de ${params.careerTitle}. ${discHint}`
      : `${name}, votre profil présente des points d'appui pour le métier de ${params.careerTitle}, avec une marge de progression identifiée. ${discHint}`;

  const axesText = axes.map((a, i) => `${i + 1}. ${a}`).join("\n");

  const nextStep = params.matching.nextPriority;
  const nextStepLine = nextStep
    ? `\n\nVotre prochaine priorité : ${nextStep.skill} (impact estimé +${nextStep.impactPercent} %).`
    : "";

  return `${intro}\n\nNous avons identifié ${axes.length} axe${axes.length > 1 ? "s" : ""} prioritaire${axes.length > 1 ? "s" : ""} :\n${axesText}${nextStepLine}`;
}
