import { evaluateIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import type { BadgeIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import {
  computeBadgeEarnerOutcome,
  isQcmScorePassing,
  getLearnerSubmissionsFromBadgeRow,
  type BadgeEarnerOutcome,
} from "@/lib/openbadges/badge-earner-outcome";
import { evaluateBadgeSessionWithAi } from "@/lib/openbadges/badge-playground-ai";
import { collectPlaygroundAttempts } from "@/lib/openbadges/badge-playground-session";
import { buildOpenBadgeLinkedInShareUrl } from "@/lib/openbadges/linkedin-share";
import { resolveMethodConfigsForBadge, type BadgeMethodConfig } from "@/lib/openbadges/badge-method-config";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type StoredLearnerEvaluation = {
  awarded: boolean;
  evaluatedAt: string;
  integrityFailed: boolean;
  qcmScore: { correct: number; total: number } | null;
  playgroundPassed: boolean;
  reasoning: string;
  progressionNote?: string;
};

export type BadgeEarnerResultPayload = BadgeEarnerOutcome & {
  badgeLevel: number | null;
  badgeImageUrl: string | null;
  playgroundAnalysis?: string;
};

function cfg(row: Record<string, unknown>): Record<string, unknown> {
  const c = row.evaluation_config ?? row.evaluationConfig;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : {};
}

export function getStoredLearnerEvaluation(
  badgeRow: Record<string, unknown>,
  earnerId: string,
): StoredLearnerEvaluation | null {
  const base = cfg(badgeRow);
  const results = base.learnerEvaluationResults;
  if (!results || typeof results !== "object" || Array.isArray(results)) return null;
  const raw = (results as Record<string, unknown>)[earnerId];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  if (!row.evaluatedAt) return null;
  return {
    awarded: Boolean(row.awarded),
    evaluatedAt: String(row.evaluatedAt),
    integrityFailed: Boolean(row.integrityFailed),
    qcmScore:
      row.qcmScore && typeof row.qcmScore === "object"
        ? (row.qcmScore as { correct: number; total: number })
        : null,
    playgroundPassed: Boolean(row.playgroundPassed),
    reasoning: String(row.reasoning ?? ""),
    progressionNote: row.progressionNote ? String(row.progressionNote) : undefined,
  };
}

export async function storeLearnerEvaluation(
  badgeClassId: string,
  earnerId: string,
  evaluation: StoredLearnerEvaluation,
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
  const results =
    baseConfig.learnerEvaluationResults && typeof baseConfig.learnerEvaluationResults === "object"
      ? { ...(baseConfig.learnerEvaluationResults as Record<string, unknown>) }
      : {};

  results[earnerId] = evaluation;

  const history =
    baseConfig.learnerEvaluationResultsHistory &&
    typeof baseConfig.learnerEvaluationResultsHistory === "object"
      ? { ...(baseConfig.learnerEvaluationResultsHistory as Record<string, unknown>) }
      : {};
  const prevHistory = Array.isArray(history[earnerId])
    ? (history[earnerId] as StoredLearnerEvaluation[])
    : [];
  history[earnerId] = [...prevHistory, evaluation];

  const attemptCounts =
    baseConfig.learnerAttemptCounts && typeof baseConfig.learnerAttemptCounts === "object"
      ? { ...(baseConfig.learnerAttemptCounts as Record<string, unknown>) }
      : {};
  attemptCounts[earnerId] = prevHistory.length + 1;

  const { error: writeErr } = await supabase
    .from("open_badges")
    .update({
      evaluation_config: {
        ...baseConfig,
        learnerEvaluationResults: results,
        learnerEvaluationResultsHistory: history,
        learnerAttemptCounts: attemptCounts,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", badgeClassId);

  return !writeErr;
}

function outcomeFromStored(
  stored: StoredLearnerEvaluation,
  badgeClassId: string,
  badgeName: string,
  badgeLevel: number | null,
): BadgeEarnerOutcome {
  const shareUrl = getBadgeCriteriaUrl(badgeClassId);
  const linkedInShareUrl = buildOpenBadgeLinkedInShareUrl({
    shareUrl,
    badgeName,
    level: badgeLevel,
  });

  if (stored.awarded) {
    return {
      awarded: true,
      integrityFailed: false,
      qcmScore: stored.qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Badge obtenu",
      message: stored.reasoning || `Vous avez obtenu le badge ${badgeName}.`,
    };
  }

  if (stored.integrityFailed) {
    return {
      awarded: false,
      integrityFailed: true,
      qcmScore: stored.qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Badge non obtenu",
      message:
        stored.reasoning ||
        "Session signalée (changement d'onglet). Le badge ne peut pas être délivré.",
    };
  }

  return {
    awarded: false,
    integrityFailed: false,
    qcmScore: stored.qcmScore,
    shareUrl,
    linkedInShareUrl,
    headline: "Badge non obtenu",
    message: stored.reasoning || `Vous n'avez pas obtenu le badge ${badgeName}.`,
  };
}

function getEvaluationPrompt(badgeRow: Record<string, unknown>, methodConfigs: BadgeMethodConfig[]): string {
  const receivability = badgeRow.receivability as Record<string, unknown> | undefined;
  const fromReceivability = String(receivability?.aiEvaluationPrompt ?? "").trim();
  if (fromReceivability) return fromReceivability;

  return methodConfigs
    .map((m) => m.evaluationPrompt?.trim())
    .filter(Boolean)
    .join("\n\n");
}

export async function runFullBadgeEarnerEvaluation(params: {
  badgeRow: Record<string, unknown>;
  earnerId: string;
  force?: boolean;
}): Promise<{
  result: BadgeEarnerResultPayload;
  stored: StoredLearnerEvaluation;
}> {
  const { badgeRow, earnerId, force } = params;
  const badgeClassId = String(badgeRow.id);
  const badgeName = String(badgeRow.name ?? "Badge");
  const badgeLevel =
    typeof badgeRow.level === "number"
      ? badgeRow.level
      : typeof cfg(badgeRow).level === "number"
        ? (cfg(badgeRow).level as number)
        : null;
  const badgeImageUrl =
    (badgeRow.imageUrl as string | null) ??
    (badgeRow.image_url as string | null) ??
    null;

  if (!force) {
    const cached = getStoredLearnerEvaluation(badgeRow, earnerId);
    if (cached) {
      return {
        stored: cached,
        result: {
          ...outcomeFromStored(cached, badgeClassId, badgeName, badgeLevel),
          badgeLevel,
          badgeImageUrl,
          playgroundAnalysis: cached.progressionNote,
        },
      };
    }
  }

  const methodConfigs = resolveMethodConfigsForBadge(badgeRow);
  const submissions = getLearnerSubmissionsFromBadgeRow(badgeRow, earnerId);
  const baseOutcome = computeBadgeEarnerOutcome({
    badgeClassId,
    badgeName,
    methodConfigs,
    submissions,
  });

  const integrityMetrics: BadgeIntegrityMetrics[] = submissions.map((entry) =>
    evaluateIntegrityMetrics(
      entry.integrityMetrics as Parameters<typeof evaluateIntegrityMetrics>[0],
    ),
  );
  const integrityFailed = integrityMetrics.some((m) => m.integrityFailed);

  const hasPlayground = methodConfigs.some((m) => m.methodId === "playground");
  const playgroundAttempts = collectPlaygroundAttempts(submissions);

  let awarded = baseOutcome.awarded;
  let playgroundPassed = true;
  let reasoning = baseOutcome.message;
  let progressionNote = "";

  const qcmConfig = methodConfigs.find((m) => m.methodId === "qcm");
  const qcmPassed = isQcmScorePassing(qcmConfig, baseOutcome.qcmScore);

  if (hasPlayground) {
    const pgConfig = methodConfigs.find((m) => m.methodId === "playground")!;

    const aiEval = await evaluateBadgeSessionWithAi({
      badgeName,
      level: badgeLevel,
      evaluationPrompt: getEvaluationPrompt(badgeRow, methodConfigs) || pgConfig.evaluationPrompt,
      qcmPassed,
      qcmScore: baseOutcome.qcmScore,
      playgroundAttempts,
      integrityMetrics,
    });

    playgroundPassed = aiEval.playgroundPassed;
    progressionNote =
      playgroundAttempts.length >= 2 && aiEval.progressionNote.trim()
        ? aiEval.progressionNote
        : "";
    reasoning = aiEval.reasoning;

    awarded =
      !integrityFailed &&
      qcmPassed &&
      aiEval.awarded &&
      playgroundAttempts.length >= 1;
  } else if (integrityFailed) {
    awarded = false;
  } else {
    awarded = baseOutcome.awarded;
  }

  const stored: StoredLearnerEvaluation = {
    awarded,
    evaluatedAt: new Date().toISOString(),
    integrityFailed,
    qcmScore: baseOutcome.qcmScore,
    playgroundPassed,
    reasoning,
    progressionNote,
  };

  await storeLearnerEvaluation(badgeClassId, earnerId, stored);

  const shareUrl = baseOutcome.shareUrl;
  const linkedInShareUrl = buildOpenBadgeLinkedInShareUrl({
    shareUrl,
    badgeName,
    level: badgeLevel,
  });

  const result: BadgeEarnerResultPayload = {
    awarded,
    integrityFailed,
    qcmScore: baseOutcome.qcmScore,
    shareUrl,
    linkedInShareUrl,
    headline: awarded ? "Badge obtenu" : "Badge non obtenu",
    message: reasoning,
    badgeLevel,
    badgeImageUrl,
    playgroundAnalysis: progressionNote,
  };

  return { result, stored };
}
