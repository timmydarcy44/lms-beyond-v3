import type { StoredLearnerEvaluation } from "@/lib/openbadges/badge-earner-evaluation";
import { getLearnerOpenBadgeAward } from "@/lib/openbadges/open-badge-earner-submissions";
import {
  collectPlaygroundAttempts,
  type PlaygroundAttemptRecord,
} from "@/lib/openbadges/badge-playground-session";

function cfg(evaluationConfig: unknown): Record<string, unknown> {
  if (!evaluationConfig || typeof evaluationConfig !== "object" || Array.isArray(evaluationConfig)) {
    return {};
  }
  return evaluationConfig as Record<string, unknown>;
}

function collectEarnerIds(base: Record<string, unknown>): string[] {
  const ids = new Set<string>();
  for (const key of [
    "learnerSubmissions",
    "learnerSubmissionsArchive",
    "learnerEvaluationResults",
    "learnerEvaluationResultsHistory",
    "learnerAwards",
  ]) {
    const block = base[key];
    if (block && typeof block === "object" && !Array.isArray(block)) {
      for (const id of Object.keys(block as Record<string, unknown>)) {
        if (id.trim()) ids.add(id);
      }
    }
  }
  return [...ids];
}

function flattenSubmissions(
  base: Record<string, unknown>,
  earnerId: string,
): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const archive = base.learnerSubmissionsArchive;
  if (archive && typeof archive === "object" && !Array.isArray(archive)) {
    const sessions = (archive as Record<string, unknown>)[earnerId];
    if (Array.isArray(sessions)) {
      for (const session of sessions) {
        if (Array.isArray(session)) out.push(...(session as Record<string, unknown>[]));
      }
    }
  }
  const active = base.learnerSubmissions;
  if (active && typeof active === "object" && !Array.isArray(active)) {
    const list = (active as Record<string, unknown>)[earnerId];
    if (Array.isArray(list)) out.push(...(list as Record<string, unknown>[]));
  }
  return out;
}

function extractQcmAnswers(submissions: Record<string, unknown>[]): {
  answers: Record<string, string | string[]>;
  responseText: string | null;
} | null {
  for (const entry of [...submissions].reverse()) {
    const responses = entry.methodResponses;
    if (!Array.isArray(responses)) continue;
    for (const raw of [...responses].reverse()) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      if (r.methodId !== "qcm") continue;
      const qcmAnswers = r.qcmAnswers;
      if (qcmAnswers && typeof qcmAnswers === "object" && !Array.isArray(qcmAnswers)) {
        return {
          answers: qcmAnswers as Record<string, string | string[]>,
          responseText: r.responseText ? String(r.responseText) : null,
        };
      }
      const text = String(r.responseText ?? "").trim();
      if (text) {
        try {
          const parsed = JSON.parse(text) as Record<string, unknown>;
          if (parsed.evaluationAnswers && typeof parsed.evaluationAnswers === "object") {
            return {
              answers: parsed.evaluationAnswers as Record<string, string | string[]>,
              responseText: text,
            };
          }
        } catch {
          return { answers: {}, responseText: text };
        }
      }
    }
  }
  return null;
}

function parseStoredEval(raw: unknown): StoredLearnerEvaluation | null {
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
    reasoning: String(row.reasoning ?? "").trim(),
    progressionNote: row.progressionNote ? String(row.progressionNote).trim() : undefined,
  };
}

export type AdminLearnerAttemptView = {
  earnerId: string;
  attemptIndex: number;
  status: "awarded" | "failed" | "in_progress";
  evaluatedAt: string | null;
  awarded: boolean;
  reasoning: string;
  progressionNote: string;
  qcmScore: { correct: number; total: number } | null;
  playgroundPassed: boolean;
  integrityFailed: boolean;
  hasWalletAward: boolean;
  qcm: { answers: Record<string, string | string[]>; responseText: string | null } | null;
  playgroundAttempts: PlaygroundAttemptRecord[];
};

export function buildAdminLearnerAttemptsReport(
  evaluationConfig: unknown,
): AdminLearnerAttemptView[] {
  const base = cfg(evaluationConfig);
  const rows: AdminLearnerAttemptView[] = [];

  for (const earnerId of collectEarnerIds(base)) {
    const award = getLearnerOpenBadgeAward(evaluationConfig, earnerId);
    const historyBlock = base.learnerEvaluationResultsHistory;
    const history =
      historyBlock &&
      typeof historyBlock === "object" &&
      !Array.isArray(historyBlock) &&
      Array.isArray((historyBlock as Record<string, unknown>)[earnerId])
        ? ((historyBlock as Record<string, unknown>)[earnerId] as unknown[])
        : [];

    const currentRaw =
      base.learnerEvaluationResults &&
      typeof base.learnerEvaluationResults === "object" &&
      !Array.isArray(base.learnerEvaluationResults)
        ? (base.learnerEvaluationResults as Record<string, unknown>)[earnerId]
        : null;

    const archiveBlock = base.learnerSubmissionsArchive;
    const archivedSessions =
      archiveBlock &&
      typeof archiveBlock === "object" &&
      !Array.isArray(archiveBlock) &&
      Array.isArray((archiveBlock as Record<string, unknown>)[earnerId])
        ? ((archiveBlock as Record<string, unknown>)[earnerId] as unknown[])
        : [];

    const activeSubmissions = flattenSubmissions(base, earnerId);

    if (history.length > 0) {
      history.forEach((evalRaw, index) => {
        const ev = parseStoredEval(evalRaw);
        const sessionSubs = Array.isArray(archivedSessions[index])
          ? (archivedSessions[index] as Record<string, unknown>[])
          : index === history.length - 1
            ? activeSubmissions
            : [];
        rows.push(buildRow(earnerId, index + 1, ev, sessionSubs, award));
      });
      continue;
    }

    const current = parseStoredEval(currentRaw);
    if (current) {
      rows.push(buildRow(earnerId, 1, current, activeSubmissions, award));
      continue;
    }

    if (activeSubmissions.length > 0) {
      rows.push({
        earnerId,
        attemptIndex: archivedSessions.length + 1,
        status: "in_progress",
        evaluatedAt: null,
        awarded: false,
        reasoning: "",
        progressionNote: "",
        qcmScore: null,
        playgroundPassed: false,
        integrityFailed: false,
        hasWalletAward: Boolean(award),
        qcm: extractQcmAnswers(activeSubmissions),
        playgroundAttempts: collectPlaygroundAttempts(activeSubmissions),
      });
    }
  }

  rows.sort((a, b) => {
    const ta = a.evaluatedAt ? Date.parse(a.evaluatedAt) : 0;
    const tb = b.evaluatedAt ? Date.parse(b.evaluatedAt) : 0;
    return tb - ta;
  });

  return rows;
}

function buildRow(
  earnerId: string,
  attemptIndex: number,
  evaluation: StoredLearnerEvaluation | null,
  submissions: Record<string, unknown>[],
  award: ReturnType<typeof getLearnerOpenBadgeAward>,
): AdminLearnerAttemptView {
  if (!evaluation) {
    return {
      earnerId,
      attemptIndex,
      status: "in_progress",
      evaluatedAt: null,
      awarded: false,
      reasoning: "",
      progressionNote: "",
      qcmScore: null,
      playgroundPassed: false,
      integrityFailed: false,
      hasWalletAward: Boolean(award),
      qcm: extractQcmAnswers(submissions),
      playgroundAttempts: collectPlaygroundAttempts(submissions),
    };
  }

  return {
    earnerId,
    attemptIndex,
    status: evaluation.awarded ? "awarded" : "failed",
    evaluatedAt: evaluation.evaluatedAt,
    awarded: evaluation.awarded,
    reasoning: evaluation.reasoning,
    progressionNote: evaluation.progressionNote ?? "",
    qcmScore: evaluation.qcmScore,
    playgroundPassed: evaluation.playgroundPassed,
    integrityFailed: evaluation.integrityFailed,
    hasWalletAward: Boolean(award),
    qcm: extractQcmAnswers(submissions),
    playgroundAttempts: collectPlaygroundAttempts(submissions),
  };
}

export async function resolveEarnerDisplayNames(
  earnerIds: string[],
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  if (earnerIds.length === 0) return map;

  const { getServiceRoleClient } = await import("@/lib/supabase/server");
  const supabase = getServiceRoleClient();
  if (!supabase) {
    for (const id of earnerIds) map[id] = id.slice(0, 8);
    return map;
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .in("id", earnerIds);

  for (const id of earnerIds) {
    const row = (data ?? []).find((p) => String((p as { id?: string }).id) === id) as
      | { first_name?: string; last_name?: string; email?: string }
      | undefined;
    if (!row) {
      map[id] = `${id.slice(0, 8)}…`;
      continue;
    }
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    map[id] = name || row.email || `${id.slice(0, 8)}…`;
  }

  return map;
}
