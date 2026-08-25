/**
 * Configuration centralisée du moteur Skills Gap (échelle Soft Skills EDGE = /15).
 * Modifier ici uniquement pour ajuster les seuils produit.
 */

/** Score Soft Skill issu du test : 3 questions × Likert 1–5. */
export const SKILLS_GAP_SCORE_MIN = 3;
export const SKILLS_GAP_SCORE_MAX = 15;

/** Cible métier par défaut (échelle /15) si absente. */
export const SKILLS_GAP_DEFAULT_TARGET = 11;

/**
 * Conversion d'une ancienne cible métier stockée en 0–100 vers /15.
 * Heuristique : valeur > 15 ⇒ legacy /100.
 */
export function normalizeTargetToScale15(raw: number): number {
  if (!Number.isFinite(raw)) return SKILLS_GAP_DEFAULT_TARGET;
  if (raw > SKILLS_GAP_SCORE_MAX) {
    return Math.max(
      SKILLS_GAP_SCORE_MIN,
      Math.min(SKILLS_GAP_SCORE_MAX, Math.round((raw / 100) * SKILLS_GAP_SCORE_MAX)),
    );
  }
  return Math.max(SKILLS_GAP_SCORE_MIN, Math.min(SKILLS_GAP_SCORE_MAX, Math.round(raw)));
}

/**
 * Normalise un score observé (test /15, ou legacy démo /100).
 */
export function normalizeObservedToScale15(raw: number): number {
  if (!Number.isFinite(raw)) return SKILLS_GAP_SCORE_MIN;
  if (raw > SKILLS_GAP_SCORE_MAX) {
    return Math.max(
      SKILLS_GAP_SCORE_MIN,
      Math.min(SKILLS_GAP_SCORE_MAX, Math.round((raw / 100) * SKILLS_GAP_SCORE_MAX)),
    );
  }
  return Math.max(SKILLS_GAP_SCORE_MIN, Math.min(SKILLS_GAP_SCORE_MAX, Math.round(raw)));
}

/** Classification d'un écart individuel (observé − cible). */
export type GapSeverity = "conforme" | "leger" | "modere" | "important";

export const SKILLS_GAP_SEVERITY_THRESHOLDS = {
  /** écart >= 0 → conforme */
  conformeMin: 0,
  /** -1.5 <= écart < 0 → léger (comparaison : gap > legerMin) */
  legerMin: -1.5,
  /** -3 <= écart <= -1.5 → modéré */
  modereMin: -3,
  /** écart < -3 → important */
} as const;

export function classifyGapSeverity(gap: number): GapSeverity {
  if (gap >= SKILLS_GAP_SEVERITY_THRESHOLDS.conformeMin) return "conforme";
  if (gap > SKILLS_GAP_SEVERITY_THRESHOLDS.legerMin) return "leger";
  if (gap >= SKILLS_GAP_SEVERITY_THRESHOLDS.modereMin) return "modere";
  return "important";
}

export function gapSeverityLabel(severity: GapSeverity): string {
  if (severity === "conforme") return "Conforme / positif";
  if (severity === "leger") return "Écart léger";
  if (severity === "modere") return "Écart modéré";
  return "Écart important";
}

/** Part des collaborateurs sous la cible → lecture collective. */
export type CollectiveScope = "individuel" | "intermediaire" | "collectif" | "collectif_prioritaire";

export const SKILLS_GAP_COLLECTIVE_THRESHOLDS = {
  /** < 25 % */
  individuelMaxPct: 25,
  /** 25–50 % */
  intermediaireMaxPct: 50,
  /** 50–75 % */
  collectifMaxPct: 75,
  /** > 75 % → collectif prioritaire */
} as const;

export function classifyCollectiveScope(pctUnderTarget: number): CollectiveScope {
  if (pctUnderTarget < SKILLS_GAP_COLLECTIVE_THRESHOLDS.individuelMaxPct) return "individuel";
  if (pctUnderTarget < SKILLS_GAP_COLLECTIVE_THRESHOLDS.intermediaireMaxPct) return "intermediaire";
  if (pctUnderTarget <= SKILLS_GAP_COLLECTIVE_THRESHOLDS.collectifMaxPct) return "collectif";
  return "collectif_prioritaire";
}

export function collectiveScopeLabel(scope: CollectiveScope): string {
  if (scope === "individuel") return "Besoin individuel";
  if (scope === "intermediaire") return "Besoin mixte";
  if (scope === "collectif") return "Besoin collectif";
  return "Besoin collectif prioritaire";
}

/** Libellé court pour expliquer le % sous cible. */
export function collectiveScopeHint(scope: CollectiveScope): string {
  if (scope === "individuel") return "Moins de 25 % de l’équipe sous la cible";
  if (scope === "intermediaire") return "25 à 50 % de l’équipe sous la cible";
  if (scope === "collectif") return "50 à 75 % de l’équipe sous la cible";
  return "Plus de 75 % de l’équipe sous la cible";
}

/** Minimum d'évalués pour publier une analyse collective comme représentative. */
export const SKILLS_GAP_MIN_EVALUATED_FOR_COLLECTIVE = 5;

/** Prix indicatif formation synchrone EDGE (€ / jour). */
export const EDGE_EXPERT_TRAINING_DAY_PRICE_EUR = 2000;
