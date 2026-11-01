/** Métriques anti-triche pour une tentative d'obtention de badge. */
export type BadgeIntegrityEvent = {
  type: "tab_hidden" | "tab_visible" | "window_blur" | "window_focus" | "page_leave" | "page_return";
  at: string;
};

export type BadgeIntegrityMetrics = {
  writingSeconds: number;
  totalSeconds: number;
  leaveCount: number;
  tabHiddenCount: number;
  events: BadgeIntegrityEvent[];
  /** true si l'apprenant a quitté l'onglet au moins une fois */
  hadTabHidden: boolean;
  /** Sorties qui arrêtent l'épreuve. Une sortie courte tolérée n'entre pas ici. */
  disqualifyingLeaves?: number;
  /** Blocage automatique de validation badge */
  integrityFailed: boolean;
  integrityFailureReasons: string[];
};

export type LeaveJudgement = "ok" | "warn" | "stop";

/** Une sortie plus courte que la tolérance est notée. La suivante, ou une sortie plus longue, arrête l'épreuve. */
export function judgeLeave(input: {
  durationMs: number;
  shortLeavesUsed: number;
  toleranceMs?: number;
  toleratedLeaves?: number;
  enforce?: boolean;
}): LeaveJudgement {
  if (input.enforce === false) return "ok";
  const toleranceMs = input.toleranceMs ?? 2000;
  const toleratedLeaves = input.toleratedLeaves ?? 1;
  if (input.durationMs < toleranceMs && input.shortLeavesUsed < toleratedLeaves) return "warn";
  return "stop";
}

export function createEmptyIntegrityMetrics(): BadgeIntegrityMetrics {
  return {
    writingSeconds: 0,
    totalSeconds: 0,
    leaveCount: 0,
    tabHiddenCount: 0,
    events: [],
    hadTabHidden: false,
    disqualifyingLeaves: 0,
    integrityFailed: false,
    integrityFailureReasons: [],
  };
}

export function evaluateIntegrityMetrics(
  metrics: Partial<BadgeIntegrityMetrics> | null | undefined,
): BadgeIntegrityMetrics {
  const base = createEmptyIntegrityMetrics();
  if (!metrics || typeof metrics !== "object") return base;

  const writingSeconds = Math.max(0, Number(metrics.writingSeconds) || 0);
  const totalSeconds = Math.max(0, Number(metrics.totalSeconds) || 0);
  const leaveCount = Math.max(0, Number(metrics.leaveCount) || 0);
  const tabHiddenCount = Math.max(0, Number(metrics.tabHiddenCount) || 0);
  const events = Array.isArray(metrics.events) ? metrics.events : [];
  const hadTabHidden =
    Boolean(metrics.hadTabHidden) || tabHiddenCount > 0 || events.some((e) => e.type === "tab_hidden");

  const disqualifyingLeaves = Math.max(0, Number(metrics.disqualifyingLeaves) || 0);
  const integrityFailureReasons: string[] = [];
  if (disqualifyingLeaves > 0) {
    integrityFailureReasons.push(
      `L’apprenant a quitté la page au-delà de la tolérance (${disqualifyingLeaves} sortie${disqualifyingLeaves > 1 ? "s" : ""}).`,
    );
  }

  return {
    writingSeconds,
    totalSeconds,
    leaveCount,
    tabHiddenCount,
    events,
    hadTabHidden,
    disqualifyingLeaves,
    integrityFailed: integrityFailureReasons.length > 0,
    integrityFailureReasons,
  };
}

/** Contexte injecté dans le prompt IA d’évaluation. */
export function buildIntegrityContextForAi(metrics: BadgeIntegrityMetrics): string {
  if (!metrics.integrityFailed && metrics.writingSeconds === 0 && metrics.leaveCount === 0) {
    return "";
  }

  const lines = [
    "## Contexte d’intégrité (session apprenant)",
    `- Temps de rédaction actif : ${metrics.writingSeconds} secondes`,
    `- Temps total sur la page : ${metrics.totalSeconds} secondes`,
    `- Sorties de page : ${metrics.leaveCount}`,
    `- Changements d’onglet (masquage) : ${metrics.tabHiddenCount}`,
  ];

  if (metrics.integrityFailed) {
    lines.push(
      "",
      "⚠️ INTÉGRITÉ COMPROMISE : ne pas valider automatiquement le badge.",
      ...metrics.integrityFailureReasons.map((r) => `- ${r}`),
    );
  }

  return lines.join("\n");
}

export function canAutoApproveBadge(metrics: BadgeIntegrityMetrics | null | undefined): boolean {
  const evaluated = evaluateIntegrityMetrics(metrics ?? undefined);
  return !evaluated.integrityFailed;
}
