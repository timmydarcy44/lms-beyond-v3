/**
 * Persistance des Missions EDGE (serveur).
 * Table technique : edge_challenge_runs (compatibilité).
 * Dégradation gracieuse si la migration mission_brief n'est pas encore appliquée.
 */

import type { PostgrestError } from "@supabase/supabase-js";
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

export type CreateMissionRunResult =
  | { ok: true; runId: string; mode: "full" | "legacy" }
  | { ok: false; code: string; message: string; details?: string };

function isSchemaMismatchError(error: PostgrestError | null): boolean {
  if (!error) return false;
  const msg = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    error.code === "42P01" ||
    msg.includes("does not exist") ||
    msg.includes("mission_title") ||
    msg.includes("mission_brief") ||
    msg.includes("why_selected") ||
    msg.includes("debrief_extended") ||
    msg.includes("edge_challenge_runs")
  );
}

function baseRunPayload(userId: string, ctx: MissionContext) {
  return {
    user_id: userId,
    skill_name: ctx.skillName || ctx.mission.primarySkill,
    skill_slug: normalizeSkillSlug(ctx.skillName || ctx.mission.primarySkill),
    objective: ctx.objective || null,
    challenge_format: ctx.format,
    level_before: ctx.levelCurrent || null,
    status: "in_progress" as const,
  };
}

export async function fetchPastMissionTitles(db: DB, userId: string, skillSlug: string): Promise<string[]> {
  const { data, error } = await db
    .from("edge_challenge_runs")
    .select("mission_title, skill_name")
    .eq("user_id", userId)
    .eq("skill_slug", skillSlug)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(8);

  if (error) {
    if (!isSchemaMismatchError(error)) {
      console.warn("[edge-mission-store] fetchPastMissionTitles", error.message);
    }
    return [];
  }

  return (data ?? [])
    .map((r) => String(r.mission_title ?? r.skill_name ?? ""))
    .filter(Boolean);
}

export async function createMissionRun(db: DB, userId: string, ctx: MissionContext): Promise<CreateMissionRunResult> {
  const base = baseRunPayload(userId, ctx);

  const fullInsert = await db
    .from("edge_challenge_runs")
    .insert({
      ...base,
      mission_title: ctx.mission.title,
      mission_brief: ctx.mission,
      why_selected: ctx.mission.whySelected ?? [],
    })
    .select("id")
    .single();

  if (!fullInsert.error && fullInsert.data) {
    return { ok: true, runId: String(fullInsert.data.id), mode: "full" };
  }

  if (fullInsert.error && !isSchemaMismatchError(fullInsert.error)) {
    console.error("[edge-mission-store] createMissionRun full", fullInsert.error);
    return {
      ok: false,
      code: fullInsert.error.code ?? "insert_failed",
      message: fullInsert.error.message,
      details: fullInsert.error.details ?? undefined,
    };
  }

  const legacyInsert = await db.from("edge_challenge_runs").insert(base).select("id").single();

  if (!legacyInsert.error && legacyInsert.data) {
    console.warn("[edge-mission-store] createMissionRun: mode legacy (migration mission_brief absente)");
    return { ok: true, runId: String(legacyInsert.data.id), mode: "legacy" };
  }

  const err = legacyInsert.error ?? fullInsert.error;
  console.error("[edge-mission-store] createMissionRun legacy", err);
  return {
    ok: false,
    code: err?.code ?? "insert_failed",
    message: err?.message ?? "Insertion impossible",
    details: err?.details ?? undefined,
  };
}

async function computeTotalXp(db: DB, userId: string): Promise<number> {
  const { data, error } = await db.from("edge_xp_events").select("amount").eq("user_id", userId);
  if (error) return 0;
  return (data ?? []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

async function touchStreak(db: DB, userId: string): Promise<number> {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);

  const { data: existing, error: readError } = await db
    .from("edge_streaks")
    .select("current_streak, longest_streak, last_active_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) return 0;

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

async function upsertBadgeProgress(
  db: DB,
  userId: string,
  skill: string,
  validated: boolean,
): Promise<MissionBadgeState> {
  const key = badgeKeyForSkill(skill);
  const { data: existing, error: readError } = await db
    .from("edge_badge_progress")
    .select("progress, status")
    .eq("user_id", userId)
    .eq("badge_key", key)
    .maybeSingle();

  const increment = validated ? 25 : 15;
  const prevProgress = existing && !readError ? Number(existing.progress) || 0 : 0;
  const progress = Math.min(100, prevProgress + increment);
  const status: MissionBadgeState["status"] = "in_progress";
  const now = new Date().toISOString();

  if (readError) {
    return { key, skill, progress, status };
  }

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

/** Fin de mission sans persistance DB (fallback si la table est indisponible). */
export async function finishMissionEphemeral(
  db: DB | null,
  userId: string,
  runId: string,
  ctx: MissionContext,
  debrief: MissionDebrief,
): Promise<MissionFinishResult> {
  const xpAwarded = computeMissionXp(false);
  let totalXp = xpAwarded;
  let streak = 0;
  let badge: MissionBadgeState = {
    key: badgeKeyForSkill(ctx.skillName),
    skill: ctx.skillName,
    progress: 15,
    status: "in_progress",
  };

  if (db) {
    try {
      await db.from("edge_xp_events").insert({
        user_id: userId,
        source: "challenge",
        source_id: runId.startsWith("ephemeral-") ? null : runId,
        skill_name: ctx.skillName,
        amount: xpAwarded,
      });
    } catch (e) {
      console.warn("[edge-mission-store] finishMissionEphemeral xp insert", e);
    }

    const [prevXp, currentStreak, badgeState] = await Promise.all([
      computeTotalXp(db, userId),
      touchStreak(db, userId).catch(() => 0),
      upsertBadgeProgress(db, userId, ctx.skillName, debrief.skillValidated).catch(() => badge),
    ]);
    totalXp = prevXp + xpAwarded;
    streak = currentStreak;
    badge = badgeState;
  }

  return { runId, debrief, xpAwarded, totalXp, streak, badge };
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

  const baseUpdate = {
    status: "completed" as const,
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
  };

  const fullUpdate = await db
    .from("edge_challenge_runs")
    .update({ ...baseUpdate, debrief_extended: debriefExtended })
    .eq("id", runId)
    .eq("user_id", userId);

  if (fullUpdate.error && isSchemaMismatchError(fullUpdate.error)) {
    await db
      .from("edge_challenge_runs")
      .update(baseUpdate)
      .eq("id", runId)
      .eq("user_id", userId);
  }

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
