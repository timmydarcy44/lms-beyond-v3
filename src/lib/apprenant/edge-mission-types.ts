/**
 * Types Mission EDGE — unité centrale du coach IA.
 * (Les types Challenge* restent en alias pour compatibilité technique.)
 */

export type MissionFormatId = "story" | "situation" | "proof" | "video" | "ai" | "quickchallenge";

export type MissionDifficulty = "Accessible" | "Intermédiaire" | "Exigeant";

/** Brief scénarisé unique par utilisateur. */
export type MissionBrief = {
  title: string;
  pedagogicalObjective: string;
  primarySkill: string;
  secondarySkills: string[];
  outcomes: string[];
  context: string;
  story: string;
  characters: string[];
  coachRole: string;
  missionGoal: string;
  prerequisites: string[];
  successCriteria: string[];
  estimatedMinutes: number;
  difficulty: MissionDifficulty;
  level: string;
  whySelected: string[];
  /** Jauges dynamiques de la situation (optionnel, défaut selon compétence). */
  gauges?: { key: string; label: string; initial: number }[];
};

export type MissionGauge = {
  key: string;
  name: string;
  value: number;
};

export type MissionGaugeDelta = {
  name: string;
  delta: number;
  reason: string;
  key?: string;
};

export type MissionGaugeTurn = {
  turn: number;
  deltas: MissionGaugeDelta[];
};

export type MissionGaugeSnapshot = {
  gauges: MissionGauge[];
  capturedAt: string;
};

export type MissionOutcomeLevel = "success" | "partial" | "constructive_failure" | "retry";

export type MissionOutcome = {
  level: MissionOutcomeLevel;
  title: string;
  message: string;
};

export type MissionChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** coach = voix du Coach EDGE (hors scène) ; scene = personnage incarné */
  kind?: "coach" | "scene";
  coachInsight?: CoachInsight;
  /** intro | hint = discret ; analysis = analyse détaillée repliée */
  coachTone?: "intro" | "hint" | "analysis";
};

/** Retour transparent du coach après chaque réponse de l'apprenant. */
export type CoachInsight = {
  whyAsked: string;
  whatObserved: string;
  whyThink: string;
  howEvaluated: string;
};

export type MissionCoachReply = {
  /** Message d'accueil personnalisé (début de mission uniquement). */
  coachIntro?: string;
  /** Réplique du personnage — TOUJOURS en premier après une réponse utilisateur. */
  sceneReply: string;
  /** Feedback court du coach (1-2 phrases), après la scène. */
  coachFeedback?: string;
  /** Analyse détaillée — uniquement toutes les 2-3 interactions. */
  coachInsight?: CoachInsight;
  showDetailedInsight?: boolean;
  /** Variations de jauges après ce tour. */
  gaugeDeltas?: MissionGaugeDelta[];
  /** État des jauges après application des deltas. */
  gauges?: MissionGauge[];
};

/** Débrief enrichi en fin de mission. */
export type MissionDebrief = {
  strengths: string[];
  improvements: string[];
  levelEstimated: string;
  confidence: number;
  nextAction: string;
  skillValidated: boolean;
  summary: string;
  /** Ce que le coach a observé. */
  observations: string[];
  /** Pourquoi le coach en arrive à ces conclusions. */
  whyThink: string;
  /** Extraits concrets des réponses de l'apprenant. */
  examplesFromAnswers: string[];
  /** Compétences / axes à travailler ensuite. */
  whatToWorkNext: string[];
  /** Titre de la mission suivante recommandée. */
  recommendedMissionTitle: string;
  /** Message de célébration personnalisé en fin de mission. */
  celebrationMessage: string;
  /** Compétence sur laquelle l'apprenant a le plus progressé aujourd'hui. */
  progressHighlight: string;
  /** Issue de la mission selon les jauges finales. */
  outcome?: MissionOutcome;
};

export type MissionGaugeState = {
  initial: MissionGauge[];
  final: MissionGauge[];
  history: MissionGaugeTurn[];
  outcome: MissionOutcome;
};

export type MissionBadgeState = {
  key: string;
  skill: string;
  progress: number;
  status: "locked" | "in_progress" | "earned";
};

export type MissionFinishResult = {
  runId: string;
  debrief: MissionDebrief;
  xpAwarded: number;
  totalXp: number;
  streak: number;
  badge: MissionBadgeState;
  gaugeState?: MissionGaugeState;
  outcome?: MissionOutcome;
};

import type { CoachMemory } from "@/lib/apprenant/edge-coach-memory";

export type MissionContext = {
  skillName: string;
  objective: string;
  levelCurrent: string;
  levelExpected: string;
  format: MissionFormatId;
  mission: MissionBrief;
  coachMemory?: CoachMemory;
  gaugeState?: MissionGauge[];
};

export function normalizeSkillSlug(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function badgeKeyForSkill(skill: string): string {
  return `edge-skill-${normalizeSkillSlug(skill)}`;
}

export const MISSION_HREF = "/dashboard/apprenant/mission";

export function missionHref(skill: string, params?: Record<string, string>): string {
  const base = `${MISSION_HREF}?skill=${encodeURIComponent(skill)}`;
  if (!params) return base;
  const extra = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `${base}&${extra}`;
}
