/** Projet professionnel EDGE v2 — structure unifiée (tous profils). */

export const EDGE_PROJECT_KEYS = {
  profession: "edge_profession",
  secteur: "edge_secteur",
  specialite: "edge_specialite",
  projetLibre: "edge_projet_libre",
} as const;

export const PROFESSION_OPTIONS = [
  { value: "commercial", label: "Commercial" },
  { value: "marketing", label: "Marketing" },
  { value: "communication", label: "Communication" },
  { value: "rh", label: "RH" },
  { value: "developpement_informatique", label: "Développement informatique" },
  { value: "finance", label: "Finance" },
  { value: "management", label: "Management" },
  { value: "conseil", label: "Conseil" },
  { value: "autre", label: "Autre" },
] as const;

export const SECTEUR_V2_OPTIONS = [
  { value: "immobilier", label: "Immobilier" },
  { value: "sport", label: "Sport" },
  { value: "sante", label: "Santé" },
  { value: "luxe", label: "Luxe" },
  { value: "automobile", label: "Automobile" },
  { value: "industrie", label: "Industrie" },
  { value: "tech", label: "Tech / Digital" },
  { value: "commerce", label: "Commerce / Vente" },
  { value: "services", label: "Services" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Éducation / Formation" },
  { value: "autre", label: "Autre" },
] as const;

export type EdgeProjectFields = {
  edge_profession?: string;
  edge_secteur?: string;
  edge_specialite?: string;
  edge_projet_libre?: string;
};

function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined,
): string {
  if (!value?.trim()) return "";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function getEdgeProjectFromRecord(
  project: Record<string, string | undefined>,
): EdgeProjectFields {
  return {
    edge_profession: project[EDGE_PROJECT_KEYS.profession],
    edge_secteur: project[EDGE_PROJECT_KEYS.secteur],
    edge_specialite: project[EDGE_PROJECT_KEYS.specialite],
    edge_projet_libre: project[EDGE_PROJECT_KEYS.projetLibre],
  };
}

/** Titre affiché à l'utilisateur — jamais le référentiel brut. */
export function buildUserObjectiveDisplay(project: Record<string, string | undefined>): string {
  const p = getEdgeProjectFromRecord(project);
  const profession = labelFor(PROFESSION_OPTIONS, p.edge_profession);
  const secteur = labelFor(SECTEUR_V2_OPTIONS, p.edge_secteur);
  const parts = [profession, secteur, p.edge_specialite?.trim()].filter(Boolean);
  if (parts.length) return parts.join(" · ");
  const libre = p.edge_projet_libre?.trim();
  if (libre) return libre.length > 80 ? `${libre.slice(0, 77)}…` : libre;
  return "";
}

/** Texte envoyé à l'IA pour identifier le métier EDGE le plus pertinent. */
export function buildCareerResolvePrompt(project: Record<string, string | undefined>): string {
  const p = getEdgeProjectFromRecord(project);
  const profession = labelFor(PROFESSION_OPTIONS, p.edge_profession);
  const secteur = labelFor(SECTEUR_V2_OPTIONS, p.edge_secteur);
  const lines = [
    profession ? `Profession : ${profession}` : null,
    secteur ? `Secteur : ${secteur}` : null,
    p.edge_specialite?.trim() ? `Spécialité : ${p.edge_specialite.trim()}` : null,
    p.edge_projet_libre?.trim() ? `Projet professionnel : ${p.edge_projet_libre.trim()}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

export function isEdgeProjectV2Complete(project: Record<string, string | undefined>): boolean {
  const p = getEdgeProjectFromRecord(project);
  return Boolean(
    p.edge_profession?.trim() &&
      p.edge_secteur?.trim() &&
      p.edge_projet_libre?.trim() &&
      p.edge_projet_libre.trim().length >= 20,
  );
}

export function migrateLegacyProjectToV2(
  project: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const next = { ...project };
  if (next[EDGE_PROJECT_KEYS.profession]) return next;

  const legacyMetier =
    project.metier_vise ??
    project.metier_recherche ??
    project.metier_ou_projet_vise ??
    project.activite_visee ??
    "";
  const legacySecteur =
    project.secteur ?? project.secteur_souhaite ?? project.secteur_vise ?? "";
  const legacyLibre = project.objectif_libre ?? project.besoin_principal ?? "";

  if (legacyMetier) {
    const lower = legacyMetier.toLowerCase();
    if (lower.includes("commercial")) next[EDGE_PROJECT_KEYS.profession] = "commercial";
    else if (lower.includes("market")) next[EDGE_PROJECT_KEYS.profession] = "marketing";
    else if (lower.includes("commun")) next[EDGE_PROJECT_KEYS.profession] = "communication";
    else if (lower.includes("rh") || lower.includes("ressources humaines"))
      next[EDGE_PROJECT_KEYS.profession] = "rh";
    else if (lower.includes("dev") || lower.includes("informatique"))
      next[EDGE_PROJECT_KEYS.profession] = "developpement_informatique";
    else if (lower.includes("financ")) next[EDGE_PROJECT_KEYS.profession] = "finance";
    else next[EDGE_PROJECT_KEYS.profession] = "autre";
    next[EDGE_PROJECT_KEYS.specialite] = legacyMetier;
  }

  if (legacySecteur) {
    const match = SECTEUR_V2_OPTIONS.find(
      (o) => o.label.toLowerCase() === legacySecteur.toLowerCase() || o.value === legacySecteur,
    );
    next[EDGE_PROJECT_KEYS.secteur] = match?.value ?? legacySecteur;
  }

  if (legacyLibre || legacyMetier) {
    next[EDGE_PROJECT_KEYS.projetLibre] =
      legacyLibre ||
      `Projet professionnel : ${legacyMetier}${legacySecteur ? ` dans le secteur ${legacySecteur}` : ""}.`;
  }

  return next;
}
