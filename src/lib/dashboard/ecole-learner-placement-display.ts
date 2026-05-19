/** Affichage cohérent avec la logique métier (entreprise + placement `initial`). */
export function deriveEcolePlacementDisplay(hostId: string | null | undefined, placementStatus: string | null) {
  const host = hostId != null && String(hostId).trim() !== "";
  if (host) {
    return { code: "en_alternance" as const, label: "En alternance" };
  }
  if (placementStatus === "initial") {
    return { code: "initial" as const, label: "Initial" };
  }
  return { code: "recherche_alternance" as const, label: "En recherche d'alternance" };
}
