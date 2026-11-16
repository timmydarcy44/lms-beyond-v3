/**
 * Scorer Qualiopi ind. 31 / 32 — règles brief Qualité réclamations v2.
 * is_test exclu des compteurs.
 */

import { formatDurationHours, formatFrDateShort } from "@/lib/qualiopi/reclamation-format";
import { resolveReclamationStep } from "@/lib/qualiopi/reclamation-status";

const TWELVE_MONTHS_MS = 365.25 * 24 * 60 * 60 * 1000;

export type ReclamationIndicatorRow = {
  received_at?: string | null;
  answered_at?: string | null;
  closed_at?: string | null;
  status?: string | null;
  response?: string | null;
  is_test?: boolean | null;
  ack_at?: string | null;
};

export type ActionIndicatorRow = {
  status?: string | null;
  reviewed_at?: string | null;
  source?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  due_at?: string | null;
};

function withinLast12m(iso: string | null | undefined, now = Date.now()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return now - t <= TWELVE_MONTHS_MS;
}

function hasTracedReply(row: ReclamationIndicatorRow): boolean {
  if (row.answered_at) return true;
  return Boolean(row.response && String(row.response).trim().length > 0);
}

export type Indicator31Score = {
  status: "proven" | "todo" | "missing";
  treatedCount: number;
  avgReplyHours: number | null;
  proofLabel: string;
  openOverdueOrUnanswered: boolean;
};

/**
 * Ind. 31 — réclamations :
 * - proven si toutes les réclamations (12 mois, hors test) sont closes avec réponse tracée
 *   (0 ticket OK si procédure active)
 * - todo s'il en existe une ouverte en retard OU close sans réponse
 * - missing si procédure absente
 */
export function scoreIndicator31(input: {
  processReady: boolean;
  rows: ReclamationIndicatorRow[];
  /** Ouvertes en retard (délai réponse / accusé) — fourni par l’appelant. */
  hasOpenOverdue: boolean;
  now?: number;
}): Indicator31Score {
  if (!input.processReady) {
    return {
      status: "missing",
      treatedCount: 0,
      avgReplyHours: null,
      proofLabel: "Procédure réclamations manquante",
      openOverdueOrUnanswered: false,
    };
  }

  const now = input.now ?? Date.now();
  const rows = input.rows.filter(
    (r) => r.is_test !== true && withinLast12m(r.received_at, now),
  );

  const closedWithoutReply = rows.some((r) => {
    const step = resolveReclamationStep(r);
    return step === "closed" && !hasTracedReply(r);
  });

  const treated = rows.filter((r) => {
    const step = resolveReclamationStep(r);
    return step === "closed" && hasTracedReply(r);
  });

  const replyHours: number[] = [];
  for (const r of treated) {
    const start = r.received_at ? new Date(r.received_at).getTime() : NaN;
    const end = r.answered_at
      ? new Date(r.answered_at).getTime()
      : r.closed_at
        ? new Date(r.closed_at).getTime()
        : NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      replyHours.push((end - start) / 3_600_000);
    }
  }
  const avgReplyHours =
    replyHours.length > 0
      ? replyHours.reduce((a, b) => a + b, 0) / replyHours.length
      : null;

  const openOverdueOrUnanswered = input.hasOpenOverdue || closedWithoutReply;
  const allClosedWithReply = rows.every((r) => {
    const step = resolveReclamationStep(r);
    return step === "closed" && hasTracedReply(r);
  });

  const status: Indicator31Score["status"] = openOverdueOrUnanswered
    ? "todo"
    : allClosedWithReply
      ? "proven"
      : "todo";

  return {
    status,
    treatedCount: treated.length,
    avgReplyHours,
    proofLabel: `${treated.length} réclamations traitées · délai moyen ${formatDurationHours(avgReplyHours)}`,
    openOverdueOrUnanswered,
  };
}

export type Indicator32Score = {
  status: "proven" | "todo" | "missing";
  actionsDoneCount: number;
  lastReviewAt: string | null;
  proofLabel: string;
};

/**
 * Ind. 32 — amélioration continue :
 * - proven s'il existe ≥1 action faite sur 12 mois ET une revue qualité datée
 * - sinon todo si process/risques partiels, missing sinon
 */
export function scoreIndicator32(input: {
  actions: ActionIndicatorRow[];
  risksCount?: number;
  processPaqReady?: boolean;
  now?: number;
}): Indicator32Score {
  const now = input.now ?? Date.now();
  const doneLast12 = input.actions.filter((a) => {
    if (a.status !== "done") return false;
    const at = a.updated_at || a.reviewed_at || a.created_at;
    return withinLast12m(at, now);
  });

  const reviews = input.actions
    .filter((a) => {
      if (!a.reviewed_at) return false;
      return a.source === "revue" || Boolean(a.reviewed_at);
    })
    .map((a) => a.reviewed_at as string)
    .filter((iso) => withinLast12m(iso, now))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const lastReviewAt = reviews[0] ?? null;
  const actionsDoneCount = doneLast12.length;
  const proven = actionsDoneCount >= 1 && Boolean(lastReviewAt);

  if (proven) {
    return {
      status: "proven",
      actionsDoneCount,
      lastReviewAt,
      proofLabel: `${actionsDoneCount} actions menées · dernière revue le ${formatFrDateShort(lastReviewAt)}`,
    };
  }

  if (actionsDoneCount >= 1 || lastReviewAt || (input.risksCount ?? 0) >= 1 || input.processPaqReady) {
    return {
      status: "todo",
      actionsDoneCount,
      lastReviewAt,
      proofLabel: lastReviewAt
        ? `${actionsDoneCount} actions · dernière revue le ${formatFrDateShort(lastReviewAt)}`
        : actionsDoneCount >= 1
          ? `${actionsDoneCount} actions menées · revue qualité manquante`
          : (input.risksCount ?? 0) >= 1
            ? `Registre des risques actif · PAQ / revue à compléter`
            : "Plan d’amélioration à compléter",
    };
  }

  return {
    status: "missing",
    actionsDoneCount: 0,
    lastReviewAt: null,
    proofLabel: "Pas de PAQ ni de revue qualité",
  };
}
