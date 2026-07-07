/**
 * Notifications coach EDGE — jamais génériques : chaque message est lié à une
 * compétence réelle et à la progression de l'utilisateur.
 */

import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getDailyChallenge, getNextBadgeSkill, getSkillOfTheDay } from "@/lib/apprenant/edge-gamification";

export type EdgeCoachNotification = {
  id: string;
  emoji: string;
  message: string;
  /** Compétence concernée (jamais générique). */
  skill: string;
  href: string;
  tone: "challenge" | "badge" | "insight" | "action";
};

const PROFIL_HREF = "/dashboard/apprenant/profil";

function challengeHref(skill: string, format?: string): string {
  const base = `/dashboard/apprenant/defi?skill=${encodeURIComponent(skill)}`;
  return format ? `${base}&format=${format}` : base;
}

export function buildCoachNotifications(
  matching: CareerMatchingResult,
  date = new Date(),
): EdgeCoachNotification[] {
  const notifications: EdgeCoachNotification[] = [];

  const daily = getDailyChallenge(matching, date);
  if (daily) {
    notifications.push({
      id: "daily-challenge",
      emoji: "🎯",
      message: `Votre défi du jour est disponible : ${daily.skill}.`,
      skill: daily.skill,
      href: challengeHref(daily.skill, daily.format.id),
      tone: "challenge",
    });
  }

  const badgeSkill = getNextBadgeSkill(matching);
  if (badgeSkill) {
    notifications.push({
      id: "near-badge",
      emoji: "🏆",
      message: `Vous êtes proche d'obtenir votre badge ${badgeSkill}.`,
      skill: badgeSkill,
      href: PROFIL_HREF,
      tone: "badge",
    });
  }

  const skillOfDay = getSkillOfTheDay(matching, date);
  if (skillOfDay) {
    notifications.push({
      id: "adapted-situation",
      emoji: "✨",
      message: `L'IA a préparé une nouvelle mise en situation adaptée à votre progression en ${skillOfDay}.`,
      skill: skillOfDay,
      href: challengeHref(skillOfDay, "situation"),
      tone: "insight",
    });
  }

  const firstForce = matching.strengths[0] ?? skillOfDay;
  if (firstForce) {
    notifications.push({
      id: "share-experience",
      emoji: "🎤",
      message: `Aujourd'hui, racontez une expérience de 5 minutes en ${firstForce} pour progresser.`,
      skill: firstForce,
      href: challengeHref(firstForce, "story"),
      tone: "action",
    });
  }

  return notifications;
}

/** Notification « du jour » (une seule, mise en avant). */
export function pickDailyNotification(
  matching: CareerMatchingResult,
  date = new Date(),
): EdgeCoachNotification | null {
  const list = buildCoachNotifications(matching, date);
  if (!list.length) return null;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return list[dayIndex % list.length];
}
