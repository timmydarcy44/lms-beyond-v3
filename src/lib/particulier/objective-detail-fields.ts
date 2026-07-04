export type ParticulierObjectiveType =
  | "alternance"
  | "emploi"
  | "reconversion"
  | "freelance"
  | "autre";

export type ObjectiveDetailField = {
  key: string;
  label: string;
  placeholder: string;
};

export const OBJECTIVE_DETAIL_FIELDS: Record<ParticulierObjectiveType, ObjectiveDetailField[]> = {
  alternance: [
    { key: "formation_visee", label: "Formation visée", placeholder: "Ex. BTS NDRC" },
    { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Responsable commercial" },
    { key: "secteur", label: "Secteur souhaité", placeholder: "Ex. Distribution, tech…" },
  ],
  emploi: [
    { key: "metier_recherche", label: "Métier recherché", placeholder: "Ex. Chargé de clientèle" },
    { key: "secteur", label: "Secteur", placeholder: "Ex. Services, industrie…" },
    { key: "niveau_experience", label: "Niveau d'expérience", placeholder: "Ex. Débutant, 3 ans…" },
  ],
  reconversion: [
    { key: "metier_actuel", label: "Métier actuel", placeholder: "Ex. Assistant administratif" },
    { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Chef de projet digital" },
    { key: "horizon", label: "Horizon du projet", placeholder: "Ex. 6 à 12 mois" },
  ],
  freelance: [
    { key: "activite_visee", label: "Activité visée", placeholder: "Ex. Consultant RH" },
    { key: "clientele_cible", label: "Clientèle cible", placeholder: "Ex. PME, indépendants…" },
    { key: "niveau_avancement", label: "Niveau d'avancement", placeholder: "Ex. Idée, lancement, croissance" },
  ],
  autre: [
    { key: "objectif_libre", label: "Objectif libre", placeholder: "Décrivez votre projet" },
    { key: "contexte", label: "Contexte actuel", placeholder: "Ex. En poste, en recherche…" },
  ],
};

export function normalizeParticulierObjectiveType(raw: string | null | undefined): ParticulierObjectiveType {
  const v = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  if (v in OBJECTIVE_DETAIL_FIELDS) return v as ParticulierObjectiveType;
  if (v === "recherche_alternance") return "alternance";
  return "autre";
}

export function objectiveDetailsSummary(
  type: ParticulierObjectiveType,
  details: Record<string, string>,
): string {
  const fields = OBJECTIVE_DETAIL_FIELDS[type];
  const parts = fields
    .map((f) => details[f.key]?.trim())
    .filter(Boolean);
  return parts.join(" · ") || "Projet en cours de définition";
}

export function objectiveTargetLabel(
  type: ParticulierObjectiveType,
  details: Record<string, string>,
): string {
  switch (type) {
    case "alternance":
      return details.metier_vise?.trim() || details.formation_visee?.trim() || "votre alternance";
    case "emploi":
      return details.metier_recherche?.trim() || "votre recherche d'emploi";
    case "reconversion":
      return details.metier_vise?.trim() || "votre reconversion";
    case "freelance":
      return details.activite_visee?.trim() || "votre activité indépendante";
    default:
      return details.objectif_libre?.trim() || "votre objectif";
  }
}
