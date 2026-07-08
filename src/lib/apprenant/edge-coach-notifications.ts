/**
 * Notifications coach EDGE — jamais génériques : chaque message est lié à une
 * compétence réelle et à la progression de l'utilisateur.
 */

import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { getDailyMission, getNextBadgeSkill, getSkillOfTheDay } from "@/lib/apprenant/edge-gamification";
import { missionHref } from "@/lib/apprenant/edge-mission-types";

export type EdgeCoachNotification = {
  id: string;
  emoji: string;
  message: string;
  skill: string;
  href: string;
  tone: "challenge" | "badge" | "insight" | "action";
};

const PROFIL_HREF = "/dashboard/apprenant/profil";

export function buildCoachNotifications(
  matching: CareerMatchingResult,
  date = new Date(),
): EdgeCoachNotification[] {
  const notifications: EdgeCoachNotification[] = [];

  const daily = getDailyMission(matching, date);
  if (daily) {
    notifications.push({
      id: "daily-mission",
      emoji: "🎯",
      message: `J'ai préparé votre mission du jour sur ${daily.skill}. Elle vous attend quand vous êtes prêt.`,
      skill: daily.skill,
      href: missionHref(daily.skill),
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
      message: `L'IA a préparé une nouvelle mission adaptée à votre progression en ${skillOfDay}.`,
      skill: skillOfDay,
      href: missionHref(skillOfDay),
      tone: "insight",
    });
  }

  const firstForce = matching.strengths[0] ?? skillOfDay;
  if (firstForce) {
    notifications.push({
      id: "share-experience",
      emoji: "🎤",
      message: `Aujourd'hui, une mission de 10 minutes vous attend en ${firstForce} pour progresser.`,
      skill: firstForce,
      href: missionHref(firstForce),
      tone: "action",
    });
  }

  return notifications;
}

export function pickDailyNotification(
  matching: CareerMatchingResult,
  date = new Date(),
): EdgeCoachNotification | null {
  const list = buildCoachNotifications(matching, date);
  if (!list.length) return null;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return list[dayIndex % list.length];
}
