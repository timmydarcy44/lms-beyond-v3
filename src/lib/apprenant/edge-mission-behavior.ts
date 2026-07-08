/**
 * Pont comportemental pour le moteur Mission EDGE.
 */

import {
  heuristicBehaviorDetection,
  missionBehaviorHighlights,
  parseObservedBehaviors,
  type BehaviorTurnObservation,
} from "@/lib/apprenant/edge-behavior-evidence";
import { behaviorGridBlockForPrompt, getBehaviorGrid } from "@/lib/apprenant/edge-behavior-grids";
import type {
  BehaviorObservation,
  MissionChatMessage,
  MissionContext,
  MissionDebrief,
  SkillProofMatrix,
} from "@/lib/apprenant/edge-mission-types";

export function behaviorSectionForPrompt(ctx: MissionContext): string {
  const grid = getBehaviorGrid(ctx.skillName);
  return `\n${behaviorGridBlockForPrompt(grid)}\n\nPHILOSOPHIE : n'évalue pas la « bonne réponse ». Observe les comportements de la grille.`;
}

export function observedBehaviorsJsonBlock(): string {
  return `"observedBehaviors": [{ "key": "reformule", "label": "Reformule", "observed": true, "evidenceQuote": "extrait court de la réponse utilisateur" }]`;
}

export function parseObservedBehaviorsFromTurn(
  raw: Record<string, unknown>,
  ctx: MissionContext,
  lastUserMessage: string,
): BehaviorObservation[] {
  const grid = getBehaviorGrid(ctx.skillName);
  const parsed = parseObservedBehaviors(raw.observedBehaviors);
  if (parsed.length > 0) {
    return parsed.map((b) => ({
      key: b.key,
      label: b.label,
      observed: b.observed,
      evidenceQuote: b.evidenceQuote,
    }));
  }
  return heuristicBehaviorDetection(lastUserMessage, grid).map((b) => ({
    key: b.key,
    label: b.label,
    observed: b.observed,
    evidenceQuote: b.evidenceQuote,
  }));
}

export function coachFeedbackFromBehaviors(observed: BehaviorObservation[], skillName: string): string | undefined {
  const positive = observed.filter((b) => b.observed && b.evidenceQuote.trim());
  if (positive.length === 0) return undefined;
  const b = positive[0];
  return `J'ai observé que tu as ${b.label.toLowerCase()} — comportement attendu pour ${skillName}.`;
}

export function buildBehaviorDebrief(
  ctx: MissionContext,
  messages: MissionChatMessage[],
  proofMatrix: SkillProofMatrix,
  missionTurns: BehaviorTurnObservation[],
  baseDebrief: MissionDebrief,
): MissionDebrief {
  const missionRows = proofMatrix.rows.filter((row) =>
    missionTurns.some((t) => t.behaviors.some((b) => b.key === row.behaviorKey && b.observed)),
  );
  const { coachLines, notObserved } = missionBehaviorHighlights(proofMatrix, missionRows);

  const missionBehaviorLines = coachLines.length
    ? coachLines
    : missionRows.filter((r) => r.observed).map((r) => r.debriefLine).filter(Boolean) as string[];

  const behaviorsNotYetValidated = notObserved.length
    ? notObserved.map((label) => `Je ne peux pas encore valider le comportement « ${label} » — pas assez d'observations dans des contextes variés.`)
    : proofMatrix.behaviorsToWork.slice(0, 2).map(
        (label) => `Le comportement « ${label} » n'a pas encore été observé de façon suffisante.`,
      );

  const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content);
  const celebrationBase = baseDebrief.celebrationMessage;

  return {
    ...baseDebrief,
    skillValidated: proofMatrix.isValidated,
    confidence: proofMatrix.validationProgress,
    proofMatrix,
    missionBehaviorLines,
    behaviorsNotYetValidated,
    observations: missionBehaviorLines.length ? missionBehaviorLines : baseDebrief.observations,
    whyThink: proofMatrix.validationMessage,
    summary: proofMatrix.isValidated
      ? `Dossier de preuves complet pour ${ctx.skillName} : ${proofMatrix.observedBehaviors} comportements documentés.`
      : `Mission terminée. Dossier en construction : ${proofMatrix.observedBehaviors}/${proofMatrix.totalBehaviors} comportements observés.`,
    strengths: missionBehaviorLines.length ? missionBehaviorLines.slice(0, 3) : baseDebrief.strengths,
    improvements: behaviorsNotYetValidated.length ? behaviorsNotYetValidated : baseDebrief.improvements,
    examplesFromAnswers: userMsgs.slice(0, 2).map((t) => `« ${t.slice(0, 120)}${t.length > 120 ? "…" : ""} »`),
    celebrationMessage: missionBehaviorLines[0]
      ? `${celebrationBase}\n\n${missionBehaviorLines[0]}`
      : celebrationBase,
    progressHighlight: missionRows.find((r) => r.observed)?.behaviorLabel ?? ctx.skillName,
  };
}

export function debriefSystemPromptWithBehaviors(ctx: MissionContext, proofMatrix: SkillProofMatrix): string {
  const grid = getBehaviorGrid(ctx.skillName);
  const observedList = proofMatrix.rows
    .filter((r) => r.observed)
    .map((r) => `- ${r.behaviorLabel} (${r.status})`)
    .join("\n");
  return `Tu es le Coach EDGE. Tu n'évalues PAS des bonnes réponses — tu OBSERVES des comportements.

Compétence : ${ctx.skillName}
Grille : ${grid.behaviors.map((b) => b.label).join(", ")}
Dossier cumulatif : ${proofMatrix.observedBehaviors}/${proofMatrix.totalBehaviors} comportements, ${proofMatrix.distinctMissionContexts} contextes.
Validée : ${proofMatrix.isValidated ? "oui" : "non"} — ${proofMatrix.validationMessage}

Comportements déjà documentés :
${observedList || "aucun pour l'instant"}

Rédige un débrief qui cite des OBSERVATIONS CONCRÈTES, jamais « bonne réponse ».
Exemples :
- "Aujourd'hui, j'ai observé que tu as spontanément reformulé l'objection du client avant de répondre."
- "Tu as proposé une solution sans vérifier les besoins — je ne peux pas encore valider le comportement Questionnement."

skillValidated dans le JSON = ${proofMatrix.isValidated} (ne pas le contredire).`;
}
