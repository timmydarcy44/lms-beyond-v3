import type { WorldBible } from "../game-state/types";

/**
 * Retourne le coût unitaire d'un maillot en fonction d'un volume de production
 * et de la table d'économies d'échelle définie dans le WorldBible.
 */
export function calculateJerseyUnitCost(
  productionVolume: number,
  unitCostTable: WorldBible["jerseyUnitCostTable"],
): number {
  if (!unitCostTable || unitCostTable.length === 0) {
    return 0;
  }

  const sortedTiers = [...unitCostTable].sort((a, b) => a.minVolume - b.minVolume);

  let matchedCost = sortedTiers[0]?.unitCost ?? 0;
  const volume = Math.max(0, Math.floor(productionVolume));

  for (const tier of sortedTiers) {
    if (volume >= tier.minVolume) {
      matchedCost = tier.unitCost;
    } else {
      break;
    }
  }

  return Math.max(0, matchedCost);
}
