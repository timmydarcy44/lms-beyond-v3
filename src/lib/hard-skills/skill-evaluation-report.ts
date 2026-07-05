import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import type { PublicSkillStatus } from "@/lib/hard-skills/skill-validation";
import type { SkillValidationSession } from "@/lib/hard-skills/skill-validation";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import {
  EDGE_NEXT_LEVEL_STEPS,
  nextHardSkillLevel,
} from "@/lib/edge-skill-progression-copy";

export type SkillObservation = {
  type: "positive" | "warning";
  text: string;
};

export type SkillEvaluationReport = {
  whyLevel: string;
  observations: SkillObservation[];
  nextLevelLabel: string | null;
  nextLevelSteps: string[];
  showNextLevel: boolean;
};

function buildFallbackWhyLevel(
  skillName: string,
  estimatedLevel: HardSkillLevel,
  declaredLevel: HardSkillLevel,
  status: PublicSkillStatus,
  validation?: SkillValidationSession,
): string {
  const verdict = validation?.verdict;

  if (verdict === "validated" || status === "validated" || status === "expert_validated") {
    return `EDGE estime le niveau ${estimatedLevel} car les éléments fournis démontrent une maîtrise cohérente de ${skillName} : expériences concrètes, vocabulaire métier et logique d'action alignés avec le référentiel EDGE.`;
  }

  if (estimatedLevel === "Débutant" || verdict === "insufficient") {
    return `Le niveau estimé est ${estimatedLevel} car les réponses montrent une bonne compréhension théorique mais peu d'exemples concrets d'application. Les situations décrites restent générales et ne permettent pas encore de démontrer une maîtrise opérationnelle de ${skillName}.`;
  }

  if (declaredLevel !== estimatedLevel) {
    return `EDGE positionne le niveau à ${estimatedLevel} (déclaré : ${declaredLevel}). L'analyse croise vos réponses, le référentiel métier et la cohérence de votre parcours pour affiner cette estimation.`;
  }

  const next = nextHardSkillLevel(estimatedLevel);
  if (next) {
    return `Le niveau ${estimatedLevel} est atteint sur les fondamentaux de ${skillName}. Pour viser ${next}, EDGE recommande de renforcer les preuves terrain et la précision des exemples partagés.`;
  }

  return `EDGE a analysé ${skillName} selon son référentiel de compétences. Le niveau ${estimatedLevel} reflète l'ensemble des éléments disponibles à ce stade de votre parcours.`;
}

function defaultObservations(
  status: PublicSkillStatus,
  validation?: SkillValidationSession,
): SkillObservation[] {
  if (validation?.strengths?.length || validation?.improvementAreas?.length) return [];

  if (status === "validated" || status === "expert_validated") {
    return [
      { type: "positive", text: "maîtrise alignée avec le référentiel EDGE" },
      { type: "positive", text: "exemples et logique d'action cohérents" },
      { type: "positive", text: "niveau de détail suffisant pour valider la compétence" },
    ];
  }

  if (status === "ia_analyzed") {
    return [
      { type: "positive", text: "bonne compréhension des enjeux" },
      { type: "warning", text: "peu d'exemples terrain détaillés" },
      { type: "warning", text: "méthodologie à préciser dans les prochaines évaluations" },
    ];
  }

  return [
    { type: "warning", text: "compétence déclarée — évaluation EDGE recommandée" },
    { type: "warning", text: "preuves et entretien expérientiel à compléter" },
  ];
}

export function buildSkillEvaluationReport(skill: PublicSkillCardData): SkillEvaluationReport {
  const v = skill.validation;
  const estimated = skill.estimatedLevel;
  const next = nextHardSkillLevel(estimated);

  const whyLevel =
    (v?.summary || v?.detailedAnalysis || v?.analysis || "").trim() ||
    buildFallbackWhyLevel(skill.name, estimated, skill.declaredLevel, skill.status, v);

  const observations: SkillObservation[] = [
    ...(v?.strengths ?? []).map((text) => ({ type: "positive" as const, text })),
    ...(v?.improvementAreas ?? []).map((text) => ({ type: "warning" as const, text })),
  ];

  if (!observations.length) {
    observations.push(...defaultObservations(skill.status, v));
  }

  const showNextLevel = Boolean(next) && skill.status !== "expert_validated";

  return {
    whyLevel,
    observations,
    nextLevelLabel: next,
    nextLevelSteps: [...EDGE_NEXT_LEVEL_STEPS],
    showNextLevel,
  };
}

export function buildSkillEvaluationReportFromAnalysis(params: {
  skillName: string;
  declaredLevel: HardSkillLevel;
  estimatedLevel?: string;
  analysis: {
    summary?: string;
    detailedAnalysis?: string;
    analysis?: string;
    strengths?: string[];
    improvementAreas?: string[];
    verdict?: string;
  };
}): SkillEvaluationReport {
  const estimated = (params.estimatedLevel ?? params.declaredLevel) as HardSkillLevel;
  const card: PublicSkillCardData = {
    name: params.skillName,
    category: "Compétence professionnelle",
    declaredLevel: params.declaredLevel,
    estimatedLevel: estimated,
    status: "ia_analyzed",
    statusLabel: "Analyse terminée",
    confidenceScore: null,
    hasAnalysis: true,
    validation: {
      method: "interview",
      status: "analyzed",
      declaredLevel: params.declaredLevel,
      estimatedLevel: estimated,
      summary: params.analysis.summary,
      detailedAnalysis: params.analysis.detailedAnalysis,
      analysis: params.analysis.analysis,
      strengths: params.analysis.strengths,
      improvementAreas: params.analysis.improvementAreas,
      verdict: params.analysis.verdict as SkillValidationSession["verdict"],
    },
  };
  return buildSkillEvaluationReport(card);
}
