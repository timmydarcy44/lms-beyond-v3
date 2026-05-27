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
  /** Blocage automatique de validation badge */
  integrityFailed: boolean;
  integrityFailureReasons: string[];
};

export function createEmptyIntegrityMetrics(): BadgeIntegrityMetrics {
  return {
    writingSeconds: 0,
    totalSeconds: 0,
    leaveCount: 0,
    tabHiddenCount: 0,
    events: [],
    hadTabHidden: false,
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

  const integrityFailureReasons: string[] = [];
  if (hadTabHidden) {
    integrityFailureReasons.push(
      "L’apprenant a quitté l’onglet du navigateur pendant la rédaction (risque de consultation externe ou IA).",
    );
  }
  if (leaveCount > 0) {
    integrityFailureReasons.push(
      `L’apprenant est sorti de la page ${leaveCount} fois avant de soumettre.`,
    );
  }

  return {
    writingSeconds,
    totalSeconds,
    leaveCount,
    tabHiddenCount,
    events,
    hadTabHidden,
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
