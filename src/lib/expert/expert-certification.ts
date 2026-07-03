import type { ExpertAccessRow } from "@/lib/expert/expert-access";

export function isEdgeCertified(
  expert: Pick<ExpertAccessRow, "certification_status" | "is_certified_beyond">,
): boolean {
  if (expert.is_certified_beyond === true) return true;
  return String(expert.certification_status ?? "").toLowerCase() === "certified";
}

export function isEdgeCertificationInProgress(
  expert: Pick<ExpertAccessRow, "certification_status">,
): boolean {
  return String(expert.certification_status ?? "").toLowerCase() === "training";
}

export function edgeCertificationLabel(
  expert: Pick<ExpertAccessRow, "certification_status" | "is_certified_beyond" | "wants_certification">,
): string {
  if (isEdgeCertified(expert)) return "EDGE Certified";
  if (isEdgeCertificationInProgress(expert)) return "Parcours en cours";
  if (expert.wants_certification === true) return "Demande enregistrée";
  return "Non active";
}
