/**
 * Gamification EDGE — XP, niveaux, progression, défi du jour, compétence du
 * jour. L'objectif est un ressenti « Duolingo » : progression visible,
 * retour quotidien, jamais une évaluation.
 *
 * Les calculs sont purs et déterministes (dérivés du profil de matching).
 * La série de jours (streak) dépend d'un état persistant côté client.
 */

import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { pickRecommendedChallenge, type EdgeChallengeFormat } from "@/lib/apprenant/edge-challenges";

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

/** XP dérivé du profil : chaque force et progression rapporte des points. */
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

export type EdgeDailyChallenge = {
  skill: string;
  format: EdgeChallengeFormat;
  xpReward: number;
};

/** Compétence + format du défi du jour (déterministe selon la date). */
export function getDailyChallenge(matching: CareerMatchingResult, date = new Date()): EdgeDailyChallenge | null {
  const pool = [
    ...(matching.nextPriority ? [matching.nextPriority.skill] : []),
    ...matching.develop,
    ...matching.consolidate,
    ...matching.strengths,
  ].filter(Boolean);
  if (!pool.length) return null;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  const skill = pool[dayIndex % pool.length];
  return { skill, format: pickRecommendedChallenge(skill), xpReward: 50 };
}

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

/* ----------------------------- Série (streak) ----------------------------- */

const STREAK_KEY = "edge-streak-v1";

type StreakState = { count: number; lastDay: string };

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Met à jour et renvoie la série de jours consécutifs (client uniquement). */
export function touchStreak(date = new Date()): number {
  if (typeof window === "undefined") return 1;
  const today = todayKey(date);
  let state: StreakState | null = null;
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    if (raw) state = JSON.parse(raw) as StreakState;
  } catch {
    state = null;
  }
  if (state?.lastDay === today) return state.count;

  const yesterday = todayKey(new Date(date.getTime() - 86_400_000));
  const nextCount = state?.lastDay === yesterday ? state.count + 1 : 1;
  const next: StreakState = { count: nextCount, lastDay: today };
  try {
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return nextCount;
}
