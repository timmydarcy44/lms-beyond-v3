import { BEYOND_INDEX_AXES, BEYOND_INDEX_QUESTIONS } from "./questions";
import {
  BEYOND_INDEX_MAX_RAW,
  type AxisScore,
  type AxisStatus,
  type BeyondIndexAnswers,
  type BeyondIndexResult,
  type GlobalProfile,
  type ScaleAnswer,
} from "./types";

function scaleScore(value: ScaleAnswer, maxPoints: number): number {
  return ((value - 1) / 4) * maxPoints;
}

function singleScore(
  questionId: string,
  answers: BeyondIndexAnswers,
  options: { id: string; points: number }[]
): number {
  const selected = answers[questionId];
  if (typeof selected !== "string") return 0;
  return options.find((o) => o.id === selected)?.points ?? 0;
}

function multiScore(
  questionId: string,
  answers: BeyondIndexAnswers,
  options: { id: string; points: number; exclusive?: boolean }[],
  maxPoints: number
): number {
  const selected = answers[questionId];
  if (!Array.isArray(selected) || selected.length === 0) return 0;

  const exclusive = options.find((o) => o.exclusive);
  if (exclusive && selected.includes(exclusive.id)) return 0;

  const total = selected.reduce((sum, id) => {
    const opt = options.find((o) => o.id === id);
    return sum + (opt?.points ?? 0);
  }, 0);

  return Math.min(total, maxPoints);
}

export function scoreQuestion(questionId: string, answers: BeyondIndexAnswers): number {
  const q = BEYOND_INDEX_QUESTIONS.find((item) => item.id === questionId);
  if (!q) return 0;

  const answer = answers[questionId];
  if (answer === undefined || answer === null) return 0;

  switch (q.type) {
    case "scale":
      return scaleScore(answer as ScaleAnswer, q.maxPoints);
    case "single":
      return singleScore(questionId, answers, q.options ?? []);
    case "multi":
      return multiScore(questionId, answers, q.options ?? [], q.maxPoints);
    default:
      return 0;
  }
}

export function scoreRawTotal(answers: BeyondIndexAnswers): number {
  return BEYOND_INDEX_QUESTIONS.reduce((sum, q) => sum + scoreQuestion(q.id, answers), 0);
}

export function scoreGlobal(answers: BeyondIndexAnswers): number {
  const raw = scoreRawTotal(answers);
  return Math.round(Math.min(100, (raw / BEYOND_INDEX_MAX_RAW) * 100));
}

function axisStatus(score: number): { status: AxisStatus; statusLabel: string } {
  if (score <= 39) return { status: "risk", statusLabel: "Risque identifié" };
  if (score <= 69) return { status: "consolidate", statusLabel: "À consolider" };
  return { status: "strength", statusLabel: "Point fort" };
}

export function scoreAxes(answers: BeyondIndexAnswers): AxisScore[] {
  return BEYOND_INDEX_AXES.map((axis) => {
    const axisQuestions = BEYOND_INDEX_QUESTIONS.filter((q) => q.axisId === axis.id);
    const raw = axisQuestions.reduce((sum, q) => sum + scoreQuestion(q.id, answers), 0);
    const max = axisQuestions.reduce((sum, q) => sum + q.maxPoints, 0);
    const score = max > 0 ? Math.round((raw / max) * 100) : 0;
    const { status, statusLabel } = axisStatus(score);

    return {
      id: axis.id,
      label: axis.label,
      raw,
      max,
      score,
      status,
      statusLabel,
    };
  });
}

export function getGlobalProfile(score: number): GlobalProfile {
  if (score <= 25) {
    return {
      id: "starter",
      title: "Organisation au point de départ",
      description:
        "Votre organisation fonctionne encore largement à l'intuition. Les compétences sont peu visibles, peu structurées et difficilement exploitables pour prendre des décisions.",
    };
  }
  if (score <= 45) {
    return {
      id: "transition",
      title: "Organisation en transition",
      description:
        "Votre organisation a commencé à structurer certains sujets, mais les compétences restent encore partiellement dispersées, peu mesurées ou insuffisamment reliées aux décisions opérationnelles.",
    };
  }
  if (score <= 65) {
    return {
      id: "structured",
      title: "Organisation structurée",
      description:
        "Votre organisation dispose déjà de bases solides. L'enjeu est maintenant de mieux connecter vos données compétences à vos décisions RH, pédagogiques et stratégiques.",
    };
  }
  return {
    id: "advanced",
    title: "Organisation avancée",
    description:
      "Votre organisation dispose d'une maturité élevée. L'enjeu devient l'optimisation continue, l'anticipation des compétences critiques et la reconnaissance fine des acquis.",
  };
}

const AXIS_INSIGHTS: Record<
  string,
  { risk: string; consolidate: string; strength: string; recommendation: string }
> = {
  competences: {
    risk: "Visibilité insuffisante sur les compétences réelles de vos équipes.",
    consolidate: "Des bases existent, mais la cartographie compétences reste incomplète.",
    strength: "Bonne visibilité sur les compétences et les profils.",
    recommendation:
      "Structurer un référentiel de compétences et le connecter à vos outils d'évaluation (DISC, 360°, mises en situation).",
  },
  formation: {
    risk: "Les parcours ne sont pas assez reliés aux besoins réels ni mesurés.",
    consolidate: "Quelques adaptations existent, mais l'impact reste partiellement mesuré.",
    strength: "Parcours personnalisés et validation des acquis bien ancrés.",
    recommendation:
      "Relier chaque parcours à un écart de compétences identifié et mesurer l'impact avec des livrables ou badges.",
  },
  ia: {
    risk: "L'IA n'est ni encadrée ni exploitée dans le pilotage compétences.",
    consolidate: "Des usages émergent, mais sans cadre ni politique formalisée.",
    strength: "L'IA est intégrée dans les pratiques et encadrée par une politique claire.",
    recommendation:
      "Formaliser une politique IA et l'intégrer dans vos parcours de développement des compétences.",
  },
  recrutement: {
    risk: "Le recrutement repose encore sur l'intuition plutôt que sur les compétences.",
    consolidate: "Les soft skills sont parfois évalués, sans méthode systématique.",
    strength: "Recrutement aligné sur les compétences critiques et le potentiel.",
    recommendation:
      "Cartographier les compétences manquantes avant chaque recrutement et évaluer systématiquement les soft skills.",
  },
  transmission: {
    risk: "Les savoirs critiques restent non documentés et peu transmis.",
    consolidate: "Des initiatives existent, sans programme structuré de transmission.",
    strength: "Transmission des connaissances formalisée et suivie.",
    recommendation:
      "Mettre en place un programme de transmission des savoirs entre experts et nouvelles recrues.",
  },
  "vision-rh": {
    risk: "La gestion des compétences n'est pas encore un levier stratégique.",
    consolidate: "La direction s'intéresse au sujet, mais le budget et la vision restent limités.",
    strength: "Compétences et développement intégrés à la stratégie RH.",
    recommendation:
      "Ancrer la gestion des compétences dans la feuille de route stratégique avec un budget dédié.",
  },
};

export function buildInsights(axisScores: AxisScore[]): {
  strengths: string[];
  risks: string[];
  recommendations: string[];
} {
  const sorted = [...axisScores].sort((a, b) => b.score - a.score);

  const strengths = sorted
    .filter((a) => a.status === "strength")
    .slice(0, 3)
    .map((a) => AXIS_INSIGHTS[a.id]?.strength ?? a.label);

  const risks = [...axisScores]
    .sort((a, b) => a.score - b.score)
    .filter((a) => a.status === "risk" || a.status === "consolidate")
    .slice(0, 3)
    .map((a) => AXIS_INSIGHTS[a.id]?.risk ?? AXIS_INSIGHTS[a.id]?.consolidate ?? a.label);

  const recommendations = [...axisScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((a) => AXIS_INSIGHTS[a.id]?.recommendation ?? `Renforcer l'axe ${a.label}.`);

  while (strengths.length < 3) {
    const next = sorted.find((a) => !strengths.some((s) => s.includes(a.label)));
    if (!next) break;
    strengths.push(AXIS_INSIGHTS[next.id]?.consolidate ?? `Base solide sur ${next.label}.`);
  }

  while (risks.length < 3) {
    const weakest = [...axisScores].sort((a, b) => a.score - b.score)[risks.length];
    if (!weakest) break;
    risks.push(AXIS_INSIGHTS[weakest.id]?.consolidate ?? `Axe ${weakest.label} à renforcer.`);
  }

  return {
    strengths: strengths.slice(0, 3),
    risks: risks.slice(0, 3),
    recommendations,
  };
}

export function computeBeyondIndexResult(
  answers: BeyondIndexAnswers,
  contact: BeyondIndexResult["contact"]
): BeyondIndexResult {
  const globalScore = scoreGlobal(answers);
  const axisScores = scoreAxes(answers);
  const globalProfile = getGlobalProfile(globalScore);
  const { strengths, risks, recommendations } = buildInsights(axisScores);

  return {
    answers,
    contact,
    globalScore,
    globalProfile,
    axisScores,
    strengths,
    risks,
    recommendations,
    completedAt: new Date().toISOString(),
  };
}
