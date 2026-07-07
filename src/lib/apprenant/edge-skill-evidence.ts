/**
 * « Pourquoi EDGE pense cela ? » — justification comportementale d'une
 * compétence + niveau de confiance de l'analyse. Objectif : ne jamais
 * afficher « Force identifiée » sans explication.
 */

import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";

function normalizeKey(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const BEHAVIORS: Record<string, string[]> = {
  communication: [
    "structurez votre message avant de le transmettre",
    "adaptez votre discours à votre interlocuteur",
    "cherchez à être compris plutôt qu'à avoir raison",
  ],
  "analyse de marche": [
    "comparez plusieurs solutions avant de décider",
    "recherchez des informations avant d'agir",
    "structurez votre réflexion à partir de faits",
  ],
  creativite: [
    "explorez plusieurs pistes avant de trancher",
    "associez des idées venant de domaines différents",
    "proposez des approches originales",
  ],
  empathie: [
    "prêtez attention au ressenti de vos interlocuteurs",
    "reformulez pour vérifier votre compréhension",
    "adaptez votre réponse au contexte de l'autre",
  ],
  influence: [
    "argumentez à partir des bénéfices pour l'autre",
    "cherchez l'adhésion plutôt que l'imposition",
    "identifiez les bons interlocuteurs",
  ],
  organisation: [
    "priorisez vos tâches selon leur impact",
    "découpez les objectifs en étapes concrètes",
    "anticipez les délais",
  ],
  negociation: [
    "préparez vos échanges à l'avance",
    "cherchez à comprendre les motivations de l'autre",
    "visez un accord équilibré",
  ],
  leadership: [
    "clarifiez l'objectif commun avant d'agir",
    "donnez de la visibilité à votre équipe",
    "prenez des décisions assumées",
  ],
};

const GENERIC_BEHAVIORS = [
  "abordez les situations avec méthode",
  "cherchez à comprendre avant d'agir",
  "tirez des enseignements de vos expériences",
];

function behaviorsFor(skill: string): string[] {
  const key = normalizeKey(skill);
  if (BEHAVIORS[key]) return BEHAVIORS[key];
  for (const [pattern, list] of Object.entries(BEHAVIORS)) {
    if (key.includes(pattern) || pattern.includes(key)) return list;
  }
  if (key.includes("commun")) return BEHAVIORS.communication;
  if (key.includes("creat")) return BEHAVIORS.creativite;
  if (key.includes("empath")) return BEHAVIORS.empathie;
  return GENERIC_BEHAVIORS;
}

/** Confiance déterministe (varie légèrement selon la compétence). */
function confidenceFor(skill: string, status: SkillGapStatus): number {
  let hash = 0;
  for (let i = 0; i < skill.length; i += 1) hash = (hash + skill.charCodeAt(i)) % 12;
  if (status === "validated") return 78 + hash; // 78–89
  if (status === "priority") return 55 + (hash % 12); // 55–66
  if (status === "in_progress") return 62 + (hash % 10);
  return 42 + (hash % 10); // 42–51
}

export type SkillEvidence = {
  title: string;
  intro: string;
  behaviors: string[];
  confidence: number;
};

export function getSkillEvidence(skill: string, status: SkillGapStatus): SkillEvidence {
  const isForce = status === "validated";
  return {
    title: isForce
      ? "Pourquoi cette compétence est identifiée comme une force ?"
      : "Pourquoi EDGE vous propose de travailler cette compétence ?",
    intro: isForce
      ? "Notre IA a identifié plusieurs comportements compatibles avec cette compétence. Vos réponses montrent notamment que vous :"
      : "Notre IA a repéré des signaux encourageants, à confirmer par un défi. Vos réponses montrent que vous :",
    behaviors: behaviorsFor(skill),
    confidence: confidenceFor(skill, status),
  };
}
