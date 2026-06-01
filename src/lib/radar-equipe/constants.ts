/** Seuil RGPD : pas d'affichage agrégé en dessous de ce nombre de diagnostics. */
export const ANONYMITY_THRESHOLD = 5;

export const IDMC_ZONES = {
  optimal: { min: 70, label: "Optimal" },
  attention: { min: 50, label: "Attention" },
  rupture: { min: 0, label: "Rupture" },
} as const;

export type IdmcZone = keyof typeof IDMC_ZONES;

export type StressSignal = "faible" | "modere" | "eleve" | "critique";

export function idmcZoneFromScore(score: number): IdmcZone {
  if (score >= 70) return "optimal";
  if (score >= 50) return "attention";
  return "rupture";
}

export function stressSignalFromScore(score: number): StressSignal {
  if (score < 35) return "faible";
  if (score < 55) return "modere";
  if (score < 75) return "eleve";
  return "critique";
}
