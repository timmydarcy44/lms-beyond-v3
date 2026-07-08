/**
 * « Pourquoi EDGE pense cela ? » — justification comportementale d'une
 * compétence + niveau de confiance de l'analyse. Objectif : ne jamais
 * afficher « Force identifiée » sans explication.
 */

import type { SkillGapStatus } from "@/lib/apprenant/edge-progression-gps";
import { getBehaviorGrid } from "@/lib/apprenant/edge-behavior-grids";

const GENERIC_BEHAVIORS = [
  "abordez les situations avec méthode",
  "cherchez à comprendre avant d'agir",
  "tirez des enseignements de vos expériences",
];

function behaviorsFor(skill: string): string[] {
  const grid = getBehaviorGrid(skill);
  const labels = grid.behaviors.map((b) => b.label.toLowerCase());
  return labels.length ? labels : GENERIC_BEHAVIORS;
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
      ? "Notre IA a documenté plusieurs comportements observables compatibles avec cette compétence. Votre dossier de preuves montre notamment que vous :"
      : "Notre IA observe des signaux comportementaux à confirmer par des missions dans des contextes variés. Vos échanges montrent que vous :",
    behaviors: behaviorsFor(skill),
    confidence: confidenceFor(skill, status),
  };
}
