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
};

export type MissionChatMessage = {
  role: "user" | "assistant";
  content: string;
  /** coach = voix du Coach EDGE (hors scène) ; scene = personnage incarné */
  kind?: "coach" | "scene";
  coachInsight?: CoachInsight;
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
  /** Explication transparente après une réponse utilisateur. */
  coachInsight?: CoachInsight;
  /** Réplique in-character dans la scénarisation. */
  sceneReply: string;
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
