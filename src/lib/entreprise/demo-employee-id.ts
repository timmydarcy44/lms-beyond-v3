/** IDs injectés par enrichNutrisetDemoOverview — absents de la table employees. */
export function isEnrichedDemoEmployeeId(id: string | null | undefined): boolean {
  const value = String(id ?? "").trim();
  if (!value) return false;
  return value.startsWith("demo-") || value.startsWith("demo_");
}

/** Ne garder que les collaborateurs réellement persistés (UUID). */
export function filterRealEntrepriseEmployees<T extends { id: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isEnrichedDemoEmployeeId(row.id));
}
