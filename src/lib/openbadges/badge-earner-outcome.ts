import { evaluateIntegrityMetrics } from "@/lib/openbadges/badge-assessment-integrity";
import type { BadgeMethodConfig, QcmQuestion } from "@/lib/openbadges/badge-method-config";
import { getQcmPassingScorePercent } from "@/lib/openbadges/badge-method-config";
import { getBadgeCriteriaUrl } from "@/lib/openbadges/urls";

export type BadgeEarnerOutcome = {
  awarded: boolean;
  integrityFailed: boolean;
  qcmScore: { correct: number; total: number } | null;
  shareUrl: string;
  linkedInShareUrl: string;
  headline: string;
  message: string;
};

type MethodResponse = {
  methodId?: string;
  responseText?: string;
  qcmAnswers?: Record<string, string | string[]>;
};

function cfg(row: Record<string, unknown>): Record<string, unknown> {
  const c = row.evaluation_config ?? row.evaluationConfig;
  return c && typeof c === "object" && !Array.isArray(c) ? (c as Record<string, unknown>) : {};
}

export function getLearnerSubmissionsFromBadgeRow(
  badgeRow: Record<string, unknown>,
  earnerId: string,
): Record<string, unknown>[] {
  const base = cfg(badgeRow);
  const submissions = base.learnerSubmissions;
  if (!submissions || typeof submissions !== "object" || Array.isArray(submissions)) {
    return [];
  }
  const list = (submissions as Record<string, unknown>)[earnerId];
  return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
}

function collectMethodResponses(submissions: Record<string, unknown>[]): MethodResponse[] {
  const out: MethodResponse[] = [];
  for (const entry of submissions) {
    const responses = entry.methodResponses;
    if (!Array.isArray(responses)) continue;
    for (const raw of responses) {
      if (raw && typeof raw === "object") out.push(raw as MethodResponse);
    }
  }
  return out;
}

function questionType(q: QcmQuestion) {
  return q.questionType ?? "single";
}

function isQuestionCorrect(
  q: QcmQuestion,
  answers: Record<string, string | string[]>,
): boolean | null {
  const type = questionType(q);
  const value = answers[q.id];
  if (type === "text") return null;

  const correctIds = q.choices.filter((c) => c.isCorrect).map((c) => c.id);
  if (type === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    if (selected.length !== correctIds.length) return false;
    return correctIds.every((id) => selected.includes(id));
  }

  const selectedId = typeof value === "string" ? value : "";
  const choice = q.choices.find((c) => c.id === selectedId);
  return Boolean(choice?.isCorrect);
}

function scoreQcmMethod(
  method: BadgeMethodConfig,
  responses: MethodResponse[],
): { correct: number; total: number; passed: boolean; submitted: boolean } {
  const questions = method.quiz?.questions ?? [];
  const qcmResponse = [...responses].reverse().find((r) => r.methodId === "qcm");
  if (!qcmResponse) {
    return { correct: 0, total: 0, passed: false, submitted: false };
  }

  let answers = qcmResponse.qcmAnswers ?? {};
  if (!Object.keys(answers).length && qcmResponse.responseText) {
    try {
      const parsed = JSON.parse(qcmResponse.responseText) as {
        evaluationAnswers?: Record<string, string | string[]>;
      };
      if (parsed?.evaluationAnswers) answers = parsed.evaluationAnswers;
    } catch {
      /* ignore */
    }
  }

  let correct = 0;
  let total = 0;
  for (const q of questions) {
    const result = isQuestionCorrect(q, answers);
    if (result === null) continue;
    total += 1;
    if (result) correct += 1;
  }

  if (total === 0) {
    return { correct: 0, total: 0, passed: true, submitted: true };
  }

  const threshold = getQcmPassingScorePercent(method);
  const percent = Math.round((correct / total) * 100);

  return {
    correct,
    total,
    passed: percent >= threshold,
    submitted: true,
  };
}

export function isQcmScorePassing(
  qcmConfig: BadgeMethodConfig | undefined,
  qcmScore: { correct: number; total: number } | null,
): boolean {
  if (!qcmConfig) return true;
  if (!qcmScore || qcmScore.total <= 0) return true;
  const threshold = getQcmPassingScorePercent(qcmConfig);
  const percent = Math.round((qcmScore.correct / qcmScore.total) * 100);
  return percent >= threshold;
}

export function computeBadgeEarnerOutcome(params: {
  badgeClassId: string;
  badgeName: string;
  methodConfigs: BadgeMethodConfig[];
  submissions: Record<string, unknown>[];
}): BadgeEarnerOutcome {
  const { badgeClassId, badgeName, methodConfigs, submissions } = params;
  const shareUrl = getBadgeCriteriaUrl(badgeClassId);
  const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const responses = collectMethodResponses(submissions);
  const integrityFailed = submissions.some((entry) =>
    evaluateIntegrityMetrics(
      entry.integrityMetrics as Parameters<typeof evaluateIntegrityMetrics>[0],
    ).integrityFailed,
  );

  const methodsSubmitted = new Set(responses.map((r) => r.methodId).filter(Boolean));
  const allMethodsSubmitted = methodConfigs.every((m) => methodsSubmitted.has(m.methodId));

  let qcmScore: { correct: number; total: number } | null = null;
  let qcmPassed = true;

  const qcmConfig = methodConfigs.find((m) => m.methodId === "qcm");
  if (qcmConfig) {
    const scored = scoreQcmMethod(qcmConfig, responses);
    qcmPassed = scored.passed && scored.submitted;
    if (scored.total > 0) {
      qcmScore = { correct: scored.correct, total: scored.total };
    } else if (!scored.submitted) {
      qcmPassed = false;
    }
  }

  const awarded = !integrityFailed && allMethodsSubmitted && qcmPassed;

  if (awarded) {
    return {
      awarded: true,
      integrityFailed: false,
      qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Badge obtenu",
      message: `Félicitations ! Vous avez validé toutes les épreuves de ${badgeName} et obtenu ce badge.`,
    };
  }

  if (integrityFailed) {
    return {
      awarded: false,
      integrityFailed: true,
      qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Badge non obtenu",
      message:
        "Vos réponses ont été enregistrées, mais la session a été signalée (changement d’onglet ou sortie de page). Le badge ne peut pas être délivré dans ces conditions.",
    };
  }

  if (qcmScore && !qcmPassed) {
    const threshold = qcmConfig ? getQcmPassingScorePercent(qcmConfig) : 100;
    const percent = Math.round((qcmScore.correct / qcmScore.total) * 100);
    return {
      awarded: false,
      integrityFailed: false,
      qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Badge non obtenu",
      message: `Score insuffisant à l’évaluation : ${qcmScore.correct}/${qcmScore.total} bonnes réponses (${percent} %, seuil ${threshold} %). Vous pouvez reprendre le parcours si une nouvelle tentative est autorisée.`,
    };
  }

  if (!allMethodsSubmitted) {
    return {
      awarded: false,
      integrityFailed: false,
      qcmScore,
      shareUrl,
      linkedInShareUrl,
      headline: "Épreuves incomplètes",
      message: "Certaines épreuves n’ont pas été finalisées. Complétez toutes les étapes pour obtenir une décision.",
    };
  }

  return {
    awarded: false,
    integrityFailed: false,
    qcmScore,
    shareUrl,
    linkedInShareUrl,
    headline: "Badge non obtenu",
    message: `Vous n’avez pas rempli les critères requis pour obtenir ${badgeName}.`,
  };
}
