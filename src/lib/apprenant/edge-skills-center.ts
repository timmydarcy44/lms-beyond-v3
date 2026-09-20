import {
  HARD_SKILL_LEVELS,
  masteryBarFilled,
  parseHardSkillPortfolio,
  resolveSkillUxStatus,
  type LearnerHardSkillRecord,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";

export type SkillsCapital = {
  total: number;
  proved: number;
  inDevelopment: number;
  validated: number;
  badges: number;
};

export type TrainingFocus = {
  skill: string;
  currentLevel: HardSkillLevel;
  targetLevel: HardSkillLevel;
  progressPercent: number;
  nextDrill: string;
  durationMin: number;
  statusLabel: string;
};

export type ObjectiveSkillGap = {
  skill: string;
  percent: number;
  tone: "green" | "orange" | "red" | "gray";
};

const DRILL_BY_CATEGORY: Record<string, string[]> = {
  Vente: ["Gérer une objection prix", "Clôturer un entretien", "Qualifer un besoin client"],
  Communication: ["Reformuler une objection", "Pitch de 60 secondes", "Écoute active en situation"],
  Management: ["Déléguer une tâche critique", "Feedback constructif", "Prioriser une équipe"],
  IA: ["Prompting opérationnel", "Cas d'usage métier", "Contrôle qualité d'un output"],
  CRM: ["Pipeline hebdomadaire", "Scoring d'opportunité", "Relance structurée"],
  default: ["Cas pratique guidé", "Quiz de maîtrise", "Mise en situation courte"],
};

export function nextHardSkillLevel(level: HardSkillLevel): HardSkillLevel {
  const idx = HARD_SKILL_LEVELS.indexOf(level);
  if (idx < 0) return "Intermédiaire";
  return HARD_SKILL_LEVELS[Math.min(idx + 1, HARD_SKILL_LEVELS.length - 1)]!;
}

export function levelProgressPercent(level: HardSkillLevel, target?: HardSkillLevel): number {
  const current = masteryBarFilled(level); // 1..5
  const targetLevel = target ?? nextHardSkillLevel(level);
  const targetScore = masteryBarFilled(targetLevel);
  if (targetScore <= current) return 100;
  // Progression relative vers le niveau suivant (base 40% + ratio)
  const ratio = current / targetScore;
  return Math.min(96, Math.max(18, Math.round(ratio * 100)));
}

export function computeSkillsCapital(
  records: LearnerHardSkillRecord[],
  meta: Record<string, StoredHardSkillMeta>,
  badgeCount: number,
): SkillsCapital {
  let proved = 0;
  let inDevelopment = 0;
  let validated = 0;
  for (const r of records) {
    const status = resolveSkillUxStatus(meta[r.name]);
    if (status === "validated") validated += 1;
    else if (status === "proved" || status === "evaluated") proved += 1;
    else inDevelopment += 1;
  }
  return {
    total: records.length,
    proved: proved + validated,
    inDevelopment,
    validated,
    badges: badgeCount,
  };
}

export function buildTrainingFocusList(
  records: LearnerHardSkillRecord[],
  meta: Record<string, StoredHardSkillMeta>,
  matching: CareerMatchingResult | null,
  limit = 4,
): TrainingFocus[] {
  const priorityNames = [
    ...(matching?.develop ?? []),
    ...(matching?.consolidate ?? []),
    ...records
      .filter((r) => resolveSkillUxStatus(meta[r.name]) === "auto_declared")
      .map((r) => r.name),
  ];

  const seen = new Set<string>();
  const ordered: LearnerHardSkillRecord[] = [];
  for (const name of priorityNames) {
    const rec = records.find((r) => r.name.toLowerCase() === name.toLowerCase());
    if (!rec || seen.has(rec.name)) continue;
    seen.add(rec.name);
    ordered.push(rec);
  }
  for (const rec of records) {
    if (seen.has(rec.name)) continue;
    ordered.push(rec);
  }

  return ordered.slice(0, limit).map((rec) => {
    const m = meta[rec.name];
    const target = m?.trainingTargetLevel ?? nextHardSkillLevel(rec.level);
    const drills = DRILL_BY_CATEGORY[rec.category] ?? DRILL_BY_CATEGORY.default!;
    const drill = drills[rec.name.length % drills.length]!;
    const status = resolveSkillUxStatus(m);
    return {
      skill: rec.name,
      currentLevel: rec.level,
      targetLevel: target,
      progressPercent: levelProgressPercent(rec.level, target),
      nextDrill: drill,
      durationMin: 8 + (rec.name.length % 7),
      statusLabel:
        status === "auto_declared"
          ? "En développement"
          : status === "proved"
            ? "Preuve en cours"
            : status === "evaluated"
              ? "Évaluée"
              : "Validée",
    };
  });
}

export function buildObjectiveGaps(matching: CareerMatchingResult | null): ObjectiveSkillGap[] {
  if (!matching?.skillTable?.length) return [];
  return matching.skillTable.slice(0, 6).map((row) => {
    let percent = 40;
    if (row.userLevel === "Excellent") percent = 95;
    else if (row.userLevel === "Très bon") percent = 85;
    else if (row.userLevel === "Bon") percent = 72;
    else if (row.userLevel === "Moyen") percent = 55;
    else if (row.userLevel === "À renforcer") percent = 35;
    else percent = 20;
    return { skill: row.skill, percent, tone: row.tone };
  });
}

export function encodeSkillParam(skill: string): string {
  return encodeURIComponent(skill);
}

export function decodeSkillParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function portfolioFromProfile(profile: {
  hard_skills?: unknown;
  skills_metadata?: unknown;
}): { records: LearnerHardSkillRecord[]; meta: Record<string, StoredHardSkillMeta> } {
  const meta = (profile.skills_metadata as Record<string, StoredHardSkillMeta>) ?? {};
  const names = Array.isArray(profile.hard_skills) ? (profile.hard_skills as string[]) : [];
  const records = parseHardSkillPortfolio(names, meta);
  return { records, meta };
}

/** Types d’entraînement prévus (architecture UI). */
export const TRAINING_MODALITY_TYPES = [
  { id: "exercise", label: "Exercice" },
  { id: "ai_simulation", label: "Simulation IA" },
  { id: "case", label: "Cas pratique" },
  { id: "micro_learning", label: "Micro-learning" },
  { id: "quiz", label: "Quiz" },
  { id: "roleplay", label: "Mise en situation" },
  { id: "feedback", label: "Feedback" },
  { id: "learn_module", label: "Contenu EDGE Learn" },
  { id: "human_validation", label: "Validation humaine" },
] as const;

export const PROOF_METHODS = [
  { id: "realization", label: "Déposer une réalisation", hint: "Lien portfolio / projet" },
  { id: "document", label: "Ajouter un document", hint: "PDF, image, fichier" },
  { id: "video", label: "Ajouter une vidéo", hint: "Lien ou fichier vidéo" },
  { id: "edge_eval", label: "Passer une évaluation EDGE", hint: "Analyse guidée" },
  { id: "roleplay", label: "Réaliser une mise en situation", hint: "Entretien / scénario" },
  { id: "ask_validation", label: "Demander une validation", hint: "Formateur ou manager" },
  { id: "certification", label: "Ajouter une certification", hint: "Preuve externe" },
] as const;
