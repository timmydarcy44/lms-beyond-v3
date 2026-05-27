import { getStoredLearnerEvaluation } from "@/lib/openbadges/badge-earner-evaluation";
import {
  countPlaygroundAttemptsInSubmissions,
  getLearnerOpenBadgeAward,
  getLearnerSubmissionsFromConfig,
} from "@/lib/openbadges/open-badge-earner-submissions";
import {
  getPlaygroundMaxAttempts,
  resolveMethodConfigsForBadge,
  type BadgeMethodConfig,
} from "@/lib/openbadges/badge-method-config";
import { getServiceRoleClient } from "@/lib/supabase/server";

function cfg(evaluationConfig: unknown): Record<string, unknown> {
  if (!evaluationConfig || typeof evaluationConfig !== "object" || Array.isArray(evaluationConfig)) {
    return {};
  }
  return evaluationConfig as Record<string, unknown>;
}

function evaluationHistoryCount(evaluationConfig: unknown, earnerId: string): number {
  const base = cfg(evaluationConfig);
  const history = base.learnerEvaluationResultsHistory;
  if (!history || typeof history !== "object" || Array.isArray(history)) return 0;
  const list = (history as Record<string, unknown>)[earnerId];
  return Array.isArray(list) ? list.length : 0;
}

/** Nombre de passages complets à l'épreuve (verdict obtenu). */
export function countLearnerBadgeAttempts(
  evaluationConfig: unknown,
  earnerId: string,
): number {
  const base = cfg(evaluationConfig);
  const historyLen = evaluationHistoryCount(evaluationConfig, earnerId);
  if (historyLen > 0) return historyLen;

  const counters = base.learnerAttemptCounts;
  if (counters && typeof counters === "object" && !Array.isArray(counters)) {
    const n = (counters as Record<string, unknown>)[earnerId];
    if (typeof n === "number" && n > 0) return n;
  }

  const archive = base.learnerSubmissionsArchive;
  let archivedSessions = 0;
  if (archive && typeof archive === "object" && !Array.isArray(archive)) {
    const list = (archive as Record<string, unknown>)[earnerId];
    if (Array.isArray(list)) archivedSessions = list.length;
  }

  const stored = getStoredLearnerEvaluation(
    { evaluation_config: evaluationConfig },
    earnerId,
  );
  if (stored && !stored.awarded) {
    return Math.max(archivedSessions + 1, 1);
  }

  return archivedSessions;
}

export type LearnerAssessmentProgress = {
  submittedMethodIds: string[];
  playgroundAttemptsUsed: number;
  playgroundMaxAttempts: number;
  playgroundComplete: boolean;
  readyForFinalEvaluation: boolean;
};

export function resolveLearnerAssessmentProgress(
  methodConfigs: BadgeMethodConfig[],
  evaluationConfig: unknown,
  earnerId: string,
): LearnerAssessmentProgress {
  const submissions = getLearnerSubmissionsFromConfig(evaluationConfig, earnerId);
  const submittedMethodIds = new Set<string>();
  let playgroundDone = false;

  for (const entry of submissions) {
    const responses = entry.methodResponses;
    if (!Array.isArray(responses)) continue;
    for (const raw of responses) {
      if (!raw || typeof raw !== "object") continue;
      const methodId = String((raw as { methodId?: string }).methodId ?? "").trim();
      if (methodId === "playground_done") playgroundDone = true;
      if (methodId && methodId !== "playground") {
        submittedMethodIds.add(methodId);
      }
    }
  }

  const playgroundConfig = methodConfigs.find((m) => m.methodId === "playground");
  const playgroundMaxAttempts = playgroundConfig
    ? getPlaygroundMaxAttempts(playgroundConfig)
    : 0;
  const playgroundAttemptsUsed = countPlaygroundAttemptsInSubmissions(submissions);
  const playgroundComplete =
    !playgroundConfig || playgroundDone || playgroundAttemptsUsed >= playgroundMaxAttempts;

  const readyForFinalEvaluation = methodConfigs.every((method) => {
    if (method.methodId === "playground") return playgroundComplete;
    return submittedMethodIds.has(method.methodId);
  });

  return {
    submittedMethodIds: Array.from(submittedMethodIds),
    playgroundAttemptsUsed,
    playgroundMaxAttempts,
    playgroundComplete,
    readyForFinalEvaluation,
  };
}

export function resolveLearnerAssessmentProgressForBadge(
  badgeRow: Record<string, unknown>,
  earnerId: string,
): LearnerAssessmentProgress {
  const methodConfigs = resolveMethodConfigsForBadge(badgeRow);
  const evaluationConfig = badgeRow.evaluation_config ?? badgeRow.evaluationConfig ?? null;
  return resolveLearnerAssessmentProgress(methodConfigs, evaluationConfig, earnerId);
}

/** Reprise à zéro uniquement après un verdict d'échec (pas pendant une session en cours). */
export function learnerMustRestartBadgeAssessment(
  evaluationConfig: unknown,
  earnerId: string,
): boolean {
  if (getLearnerOpenBadgeAward(evaluationConfig, earnerId)) return false;

  const stored = getStoredLearnerEvaluation(
    { evaluation_config: evaluationConfig },
    earnerId,
  );
  return Boolean(stored && !stored.awarded);
}

export async function resetLearnerBadgeAttempt(
  badgeClassId: string,
  earnerId: string,
): Promise<boolean> {
  const supabase = getServiceRoleClient();
  if (!supabase) return false;

  const { data: raw, error: readErr } = await supabase
    .from("open_badges")
    .select("evaluation_config")
    .eq("id", badgeClassId)
    .maybeSingle();

  if (readErr || !raw) return false;

  const baseConfig = cfg((raw as { evaluation_config?: unknown }).evaluation_config);
  const submissions =
    baseConfig.learnerSubmissions && typeof baseConfig.learnerSubmissions === "object"
      ? { ...(baseConfig.learnerSubmissions as Record<string, unknown>) }
      : {};

  const archive =
    baseConfig.learnerSubmissionsArchive &&
    typeof baseConfig.learnerSubmissionsArchive === "object"
      ? { ...(baseConfig.learnerSubmissionsArchive as Record<string, unknown>) }
      : {};

  const active = submissions[earnerId];
  if (Array.isArray(active) && active.length > 0) {
    const prev = Array.isArray(archive[earnerId]) ? (archive[earnerId] as unknown[]) : [];
    archive[earnerId] = [...prev, active];
  }
  delete submissions[earnerId];

  const results =
    baseConfig.learnerEvaluationResults &&
    typeof baseConfig.learnerEvaluationResults === "object"
      ? { ...(baseConfig.learnerEvaluationResults as Record<string, unknown>) }
      : {};
  delete results[earnerId];

  const { error: writeErr } = await supabase
    .from("open_badges")
    .update({
      evaluation_config: {
        ...baseConfig,
        learnerSubmissions: submissions,
        learnerSubmissionsArchive: archive,
        learnerEvaluationResults: results,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", badgeClassId);

  return !writeErr;
}

export function getFailureRemediationCourseId(
  badgeRow: Record<string, unknown>,
): string | null {
  const evaluationConfig = badgeRow.evaluation_config ?? badgeRow.evaluationConfig;
  const base = cfg(evaluationConfig);
  const fromConfig = String(base.failureRemediationCourseId ?? "").trim();
  return fromConfig || null;
}
