/**
 * Persistance des Défis EDGE (serveur, service role).
 * Un défi terminé : met à jour la run, ajoute l'XP, la série, la progression
 * badge, et crée une notification coach personnalisée (statut pending).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  badgeKeyForSkill,
  normalizeSkillSlug,
  type ChallengeBadgeState,
  type ChallengeContext,
  type ChallengeChatMessage,
  type ChallengeDebrief,
  type ChallengeFinishResult,
} from "@/lib/apprenant/edge-challenge-types";
import { computeChallengeXp } from "@/lib/apprenant/edge-challenge-engine";

type DB = SupabaseClient;

export async function createChallengeRun(
  db: DB,
  userId: string,
  ctx: ChallengeContext,
): Promise<string | null> {
  const { data, error } = await db
    .from("edge_challenge_runs")
    .insert({
      user_id: userId,
      skill_name: ctx.skillName,
      skill_slug: normalizeSkillSlug(ctx.skillName),
      objective: ctx.objective || null,
      challenge_format: ctx.format,
      level_before: ctx.levelCurrent || null,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[edge-challenge-store] createChallengeRun", error);
    return null;
  }
  return String(data.id);
}

async function computeTotalXp(db: DB, userId: string): Promise<number> {
  const { data, error } = await db.from("edge_xp_events").select("amount").eq("user_id", userId);
  if (error || !data) return 0;
  return data.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

/** Met à jour la série de jours (serveur, source de vérité). */
async function touchStreak(db: DB, userId: string): Promise<number> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);

  const { data: existing } = await db
    .from("edge_streaks")
    .select("current_streak, longest_streak, last_active_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await db.from("edge_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_day: todayStr,
    });
    return 1;
  }

  if (existing.last_active_day === todayStr) {
    return Number(existing.current_streak) || 1;
  }

  const current =
    existing.last_active_day === yesterdayStr ? (Number(existing.current_streak) || 0) + 1 : 1;
  const longest = Math.max(current, Number(existing.longest_streak) || 0);

  await db
    .from("edge_streaks")
    .update({ current_streak: current, longest_streak: longest, last_active_day: todayStr, updated_at: new Date().toISOString() })
    .eq("user_id", userId);

  return current;
}

async function upsertBadgeProgress(
  db: DB,
  userId: string,
  skill: string,
  validated: boolean,
): Promise<ChallengeBadgeState> {
  const key = badgeKeyForSkill(skill);
  const { data: existing } = await db
    .from("edge_badge_progress")
    .select("progress, status")
    .eq("user_id", userId)
    .eq("badge_key", key)
    .maybeSingle();

  const increment = validated ? 40 : 20;
  const prevProgress = existing ? Number(existing.progress) || 0 : 0;
  const progress = Math.min(100, prevProgress + increment);
  const status: ChallengeBadgeState["status"] = progress >= 100 ? "earned" : "in_progress";
  const now = new Date().toISOString();

  if (existing) {
    await db
      .from("edge_badge_progress")
      .update({
        progress,
        status,
        skill_name: skill,
        earned_at: status === "earned" ? now : null,
        updated_at: now,
      })
      .eq("user_id", userId)
      .eq("badge_key", key);
  } else {
    await db.from("edge_badge_progress").insert({
      user_id: userId,
      badge_key: key,
      skill_name: skill,
      progress,
      status,
      earned_at: status === "earned" ? now : null,
    });
  }

  return { key, skill, progress, status };
}

function buildFinishNotification(
  skill: string,
  badge: ChallengeBadgeState,
): { emoji: string; message: string; tone: string; href: string } {
  const href = `/dashboard/apprenant/defi?skill=${encodeURIComponent(skill)}`;
  if (badge.status === "earned") {
    return {
      emoji: "🏆",
      message: `Bravo ! Vous avez débloqué votre badge ${skill}. Un nouveau défi vous attend pour aller plus loin.`,
      tone: "badge",
      href,
    };
  }
  if (badge.progress >= 60) {
    return {
      emoji: "🏆",
      message: `Vous êtes proche d'obtenir votre badge ${skill} (${badge.progress} %). Un défi de 7 minutes est prêt pour vous.`,
      tone: "badge",
      href,
    };
  }
  return {
    emoji: "🎯",
    message: `Votre compétence ${skill} progresse : un nouveau Défi EDGE est prêt pour continuer.`,
    tone: "challenge",
    href,
  };
}

export async function finishChallengeRun(
  db: DB,
  userId: string,
  runId: string,
  ctx: ChallengeContext,
  debrief: ChallengeDebrief,
  messages: ChallengeChatMessage[],
  proofText: string,
): Promise<ChallengeFinishResult> {
  const xpAwarded = computeChallengeXp(ctx.format, debrief);
  const now = new Date().toISOString();

  await db
    .from("edge_challenge_runs")
    .update({
      status: "completed",
      level_estimated: debrief.levelEstimated,
      confidence: debrief.confidence,
      strengths: debrief.strengths,
      improvements: debrief.improvements,
      next_action: debrief.nextAction,
      summary: debrief.summary,
      xp_awarded: xpAwarded,
      skill_validated: debrief.skillValidated,
      transcript: messages,
      proof_text: proofText || null,
      completed_at: now,
      updated_at: now,
    })
    .eq("id", runId)
    .eq("user_id", userId);

  await db.from("edge_xp_events").insert({
    user_id: userId,
    source: "challenge",
    source_id: runId,
    skill_name: ctx.skillName,
    amount: xpAwarded,
  });

  const [totalXp, streak, badge] = await Promise.all([
    computeTotalXp(db, userId),
    touchStreak(db, userId),
    upsertBadgeProgress(db, userId, ctx.skillName, debrief.skillValidated),
  ]);

  const notif = buildFinishNotification(ctx.skillName, badge);
  await db.from("edge_notifications").insert({
    user_id: userId,
    skill_name: ctx.skillName,
    emoji: notif.emoji,
    message: notif.message,
    cta_href: notif.href,
    tone: notif.tone,
    status: "pending",
  });

  return { runId, debrief, xpAwarded, totalXp, streak, badge };
}
