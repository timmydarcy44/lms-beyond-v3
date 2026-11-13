export function handicapSourceLabel(kind: string) {
  if (kind === "employee") return "Salarié";
  if (kind === "formation_participant") return "Participant formation";
  if (kind === "cfa_application") return "Candidature CFA";
  return kind;
}

export function handicapSourceHref(sourceKind: string, sourceId: string, organizationId?: string | null) {
  if (sourceKind === "cfa_application") return `/super/crm/cfa/apprenants/${sourceId}`;
  if (sourceKind === "employee" && organizationId) {
    return `/super/organisations/${organizationId}?tab=members`;
  }
  return null;
}
