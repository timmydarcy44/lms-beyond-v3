import { getServiceRoleClient } from "@/lib/supabase/server";
import { getOpenBadgeClassByIdOnly } from "@/lib/openbadges/open-badges-table-store";
import { collectPlaygroundAttempts } from "@/lib/openbadges/badge-playground-session";

function cfg(row: Record<string, unknown>): Record<string, unknown> {
  const c = row.evaluation_config;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : {};
}

/** Persiste une réponse apprenant dans evaluation_config.learnerSubmissions (sans Prisma). */
export async function appendOpenBadgeEarnerSubmission(
  badgeClassId: string,
  earnerId: string,
  entry: Record<string, unknown>,
): Promise<boolean> {
  const supabase = getServiceRoleClient();
  if (!supabase) return false;

  const { data: raw, error: readErr } = await supabase
    .from("open_badges")
    .select("evaluation_config")
    .eq("id", badgeClassId)
    .maybeSingle();

  if (readErr || !raw) return false;

  const baseConfig = cfg(raw as Record<string, unknown>);
  const submissions =
    baseConfig.learnerSubmissions && typeof baseConfig.learnerSubmissions === "object"
      ? { ...(baseConfig.learnerSubmissions as Record<string, unknown>) }
      : {};

  const userKey = earnerId;
  const existing = Array.isArray(submissions[userKey])
    ? (submissions[userKey] as Record<string, unknown>[])
    : [];

  submissions[userKey] = [
    ...existing,
    {
      ...entry,
      submittedAt: entry.submittedAt ?? new Date().toISOString(),
    },
  ];

  const { error: writeErr } = await supabase
    .from("open_badges")
    .update({
      evaluation_config: {
        ...baseConfig,
        learnerSubmissions: submissions,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", badgeClassId);

  return !writeErr;
}

export async function loadOpenBadgeForEarnerSubmit(badgeClassId: string) {
  return getOpenBadgeClassByIdOnly(badgeClassId);
}

export function countPlaygroundAttemptsInSubmissions(
  submissions: Record<string, unknown>[],
): number {
  return collectPlaygroundAttempts(submissions).length;
}

export type LearnerOpenBadgeAward = {
  awardedAt: string;
  shareUrl: string;
  linkedInShareUrl: string;
  badgeName?: string;
  imageUrl?: string | null;
};

export function getLearnerOpenBadgeAward(
  evaluationConfig: unknown,
  earnerId: string,
): LearnerOpenBadgeAward | null {
  if (!evaluationConfig || typeof evaluationConfig !== "object" || Array.isArray(evaluationConfig)) {
    return null;
  }
  const awards = (evaluationConfig as Record<string, unknown>).learnerAwards;
  if (!awards || typeof awards !== "object" || Array.isArray(awards)) return null;
  const raw = (awards as Record<string, unknown>)[earnerId];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const awardedAt = String(row.awardedAt ?? "").trim();
  const shareUrl = String(row.shareUrl ?? "").trim();
  if (!awardedAt || !shareUrl) return null;
  return {
    awardedAt,
    shareUrl,
    linkedInShareUrl: String(row.linkedInShareUrl ?? shareUrl).trim() || shareUrl,
    badgeName: typeof row.badgeName === "string" ? row.badgeName : undefined,
    imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : null,
  };
}

export function countLearnerAssessmentAttempts(
  evaluationConfig: unknown,
  earnerId: string,
): number {
  return getLearnerSubmissionsFromConfig(evaluationConfig, earnerId).length;
}

export async function recordOpenBadgeAward(
  badgeClassId: string,
  earnerId: string,
  award: LearnerOpenBadgeAward,
): Promise<boolean> {
  const supabase = getServiceRoleClient();
  if (!supabase) return false;

  const { data: raw, error: readErr } = await supabase
    .from("open_badges")
    .select("evaluation_config")
    .eq("id", badgeClassId)
    .maybeSingle();

  if (readErr || !raw) return false;

  const baseConfig = cfg(raw as Record<string, unknown>);
  const awards =
    baseConfig.learnerAwards && typeof baseConfig.learnerAwards === "object"
      ? { ...(baseConfig.learnerAwards as Record<string, unknown>) }
      : {};

  awards[earnerId] = award;

  const { error: writeErr } = await supabase
    .from("open_badges")
    .update({
      evaluation_config: { ...baseConfig, learnerAwards: awards },
      updated_at: new Date().toISOString(),
    })
    .eq("id", badgeClassId);

  return !writeErr;
}

export function getLearnerSubmissionsFromConfig(
  evaluationConfig: unknown,
  earnerId: string,
): Record<string, unknown>[] {
  if (!evaluationConfig || typeof evaluationConfig !== "object" || Array.isArray(evaluationConfig)) {
    return [];
  }
  const submissions = (evaluationConfig as Record<string, unknown>).learnerSubmissions;
  if (!submissions || typeof submissions !== "object" || Array.isArray(submissions)) {
    return [];
  }
  const list = (submissions as Record<string, unknown>)[earnerId];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}
