/**
 * Gamification EDGE — XP d'engagement, niveaux, mission du jour, compétence du jour.
 * L'XP ne valide jamais une compétence : il récompense l'engagement (missions,
 * preuves, badges). La série (streak) est persistée côté serveur (edge_streaks).
 */

import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { pickMissionMechanic, type MissionMechanic } from "@/lib/apprenant/edge-missions";

const LEVEL_TITLES = [
  "Explorateur",
  "Apprenti",
  "Praticien",
  "Stratège",
  "Expert",
  "Maître EDGE",
] as const;

/** XP nécessaires pour finir chaque niveau (index = niveau - 1). */
const XP_PER_LEVEL = 500;

export type EdgeLevelInfo = {
  level: number;
  title: string;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  percentToNext: number;
};

/** @deprecated L'XP provient des événements edge_xp_events (engagement uniquement). */
export function computeEdgeXp(matching: CareerMatchingResult): number {
  const forces = matching.strengths.length * 120;
  const consolidating = matching.consolidate.length * 70;
  const exploring = matching.develop.length * 40;
  const compat = Math.round(matching.compatibilityScore * 1.5);
  return forces + consolidating + exploring + compat;
}

export function edgeLevelFromXp(totalXp: number): EdgeLevelInfo {
  const level = Math.min(LEVEL_TITLES.length, Math.floor(totalXp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = totalXp % XP_PER_LEVEL;
  const capped = level >= LEVEL_TITLES.length;
  return {
    level,
    title: LEVEL_TITLES[level - 1],
    totalXp,
    xpIntoLevel: capped ? XP_PER_LEVEL : xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    percentToNext: capped ? 100 : Math.round((xpIntoLevel / XP_PER_LEVEL) * 100),
  };
}

export type EdgeDailyMission = {
  skill: string;
  mechanic: MissionMechanic;
  xpReward: number;
};

/** Compétence + mission du jour (déterministe selon la date). */
export function getDailyMission(matching: CareerMatchingResult, date = new Date()): EdgeDailyMission | null {
  const pool = [
    ...(matching.nextPriority ? [matching.nextPriority.skill] : []),
    ...matching.develop,
    ...matching.consolidate,
    ...matching.strengths,
  ].filter(Boolean);
  if (!pool.length) return null;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  const skill = pool[dayIndex % pool.length];
  return { skill, mechanic: pickMissionMechanic(skill), xpReward: 50 };
}

/** @deprecated Utiliser getDailyMission */
export const getDailyChallenge = getDailyMission;

/** Compétence du jour à mettre en avant (carte). */
export function getSkillOfTheDay(matching: CareerMatchingResult, date = new Date()): string | null {
  const pool = [...matching.consolidate, ...matching.develop, ...matching.strengths].filter(Boolean);
  if (!pool.length) return null;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return pool[dayIndex % pool.length];
}

/** Prochain badge « proche d'être débloqué » (compétence à consolider). */
export function getNextBadgeSkill(matching: CareerMatchingResult): string | null {
  return matching.consolidate[0] ?? matching.develop[0] ?? matching.strengths[0] ?? null;
}

