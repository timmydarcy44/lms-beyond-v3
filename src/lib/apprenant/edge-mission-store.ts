/**
 * Persistance des Missions EDGE (serveur).
 * Table technique : edge_challenge_runs (compatibilité).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  badgeKeyForSkill,
  normalizeSkillSlug,
  type MissionBadgeState,
  type MissionBrief,
  type MissionChatMessage,
  type MissionContext,
  type MissionDebrief,
  type MissionFinishResult,
  missionHref,
} from "@/lib/apprenant/edge-mission-types";
import { computeMissionXp } from "@/lib/apprenant/edge-mission-engine";

type DB = SupabaseClient;

export async function fetchPastMissionTitles(db: DB, userId: string, skillSlug: string): Promise<string[]> {
  const { data } = await db
    .from("edge_challenge_runs")
    .select("mission_title")
    .eq("user_id", userId)
    .eq("skill_slug", skillSlug)
    .eq("status", "completed")
    .not("mission_title", "is", null)
    .order("completed_at", { ascending: false })
    .limit(8);
  return (data ?? []).map((r) => String(r.mission_title)).filter(Boolean);
}

export async function createMissionRun(db: DB, userId: string, ctx: MissionContext): Promise<string | null> {
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
      mission_title: ctx.mission.title,
      mission_brief: ctx.mission,
      why_selected: ctx.mission.whySelected,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[edge-mission-store] createMissionRun", error);
    return null;
  }
  return String(data.id);
}

async function computeTotalXp(db: DB, userId: string): Promise<number> {
  const { data } = await db.from("edge_xp_events").select("amount").eq("user_id", userId);
  return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

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
  if (existing.last_active_day === todayStr) return Number(existing.current_streak) || 1;

  const current =
    existing.last_active_day === yesterdayStr ? (Number(existing.current_streak) || 0) + 1 : 1;
  const longest = Math.max(current, Number(existing.longest_streak) || 0);
  await db
    .from("edge_streaks")
    .update({ current_streak: current, longest_streak: longest, last_active_day: todayStr, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  return current;
}

/** Progression vers Open Badge — pas un badge acquis. */
async function upsertBadgeProgress(
  db: DB,
  userId: string,
  skill: string,
  validated: boolean,
): Promise<MissionBadgeState> {
  const key = badgeKeyForSkill(skill);
  const { data: existing } = await db
    .from("edge_badge_progress")
    .select("progress, status")
    .eq("user_id", userId)
    .eq("badge_key", key)
    .maybeSingle();

  const increment = validated ? 25 : 15;
  const prevProgress = existing ? Number(existing.progress) || 0 : 0;
  const progress = Math.min(100, prevProgress + increment);
  const status: MissionBadgeState["status"] = progress >= 100 ? "in_progress" : "in_progress";
  const now = new Date().toISOString();

  if (existing) {
    await db
      .from("edge_badge_progress")
      .update({ progress, status, skill_name: skill, updated_at: now })
      .eq("user_id", userId)
      .eq("badge_key", key);
  } else {
    await db.from("edge_badge_progress").insert({
      user_id: userId,
      badge_key: key,
      skill_name: skill,
      progress,
      status: "in_progress",
    });
  }

  return { key, skill, progress, status };
}

function buildFinishNotification(skill: string, badge: MissionBadgeState): {
  emoji: string;
  message: string;
  tone: string;
  href: string;
} {
  const href = missionHref(skill);
  if (badge.progress >= 75) {
    return {
      emoji: "🏆",
      message: `Vous êtes proche d'obtenir votre badge ${skill} (${badge.progress} %). Une mission de 10 minutes est prête pour vous.`,
      tone: "badge",
      href,
    };
  }
  return {
    emoji: "🎯",
    message: `Votre compétence ${skill} vous attend : une nouvelle Mission EDGE est prête pour continuer votre progression.`,
    tone: "challenge",
    href,
  };
}

export async function finishMissionRun(
  db: DB,
  userId: string,
  runId: string,
  ctx: MissionContext,
  debrief: MissionDebrief,
  messages: MissionChatMessage[],
  proofText: string,
): Promise<MissionFinishResult> {
  const hasProof = proofText.trim().length > 20;
  const xpAwarded = computeMissionXp(hasProof);
  const now = new Date().toISOString();

  const debriefExtended = {
    observations: debrief.observations,
    whyThink: debrief.whyThink,
    examplesFromAnswers: debrief.examplesFromAnswers,
    whatToWorkNext: debrief.whatToWorkNext,
    recommendedMissionTitle: debrief.recommendedMissionTitle,
  };

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
      debrief_extended: debriefExtended,
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

export type { MissionBrief };
