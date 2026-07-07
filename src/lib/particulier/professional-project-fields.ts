import type { ParticulierObjectiveType } from "@/lib/particulier/objective-detail-fields";
import { normalizeParticulierObjectiveType } from "@/lib/particulier/objective-detail-fields";
import {
  buildUserObjectiveDisplay,
  isEdgeProjectV2Complete,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import type { ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";

import {
  CONTRACT_TYPES,
  DISPONIBILITE_OPTIONS,
  MOBILITE_OPTIONS,
  SECTEUR_OPTIONS,
} from "@/lib/particulier/edge-select-options";

export type ProfessionalProjectField = {
  key: string;
  label: string;
  placeholder: string;
  /** Champ relié au référentiel métier EDGE (autocomplete + Autre) */
  isCareerTarget?: boolean;
  inputType?: "text" | "select";
  options?: Array<{ value: string; label: string }>;
};

export const OBJECTIVE_TYPE_LABELS: Record<ParticulierObjectiveType, string> = {
  alternance: "Alternance",
  emploi: "Emploi",
  reconversion: "Reconversion",
  freelance: "Freelance",
  autre: "Autre",
};

export const PROFESSIONAL_PROJECT_FIELDS: Record<ParticulierObjectiveType, ProfessionalProjectField[]> = {
  alternance: [
    { key: "formation_visee", label: "Formation visée", placeholder: "Ex. BTS NDRC" },
    { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Responsable commercial", isCareerTarget: true },
    { key: "secteur_souhaite", label: "Secteur souhaité", placeholder: "Choisir…", inputType: "select", options: SECTEUR_OPTIONS },
    { key: "rythme_souhaite", label: "Rythme souhaité", placeholder: "Ex. 2 semaines entreprise / 1 semaine école" },
    { key: "date_debut_recherchee", label: "Date de début recherchée", placeholder: "Ex. Septembre 2026" },
    { key: "mobilite", label: "Mobilité", placeholder: "Choisir…", inputType: "select", options: MOBILITE_OPTIONS },
  ],
  emploi: [
    { key: "metier_recherche", label: "Métier recherché", placeholder: "Ex. Chargé de clientèle", isCareerTarget: true },
    { key: "secteur", label: "Secteur", placeholder: "Choisir…", inputType: "select", options: SECTEUR_OPTIONS },
    { key: "type_contrat", label: "Type de contrat", placeholder: "Choisir…", inputType: "select", options: CONTRACT_TYPES },
    { key: "niveau_experience", label: "Niveau d'expérience", placeholder: "Ex. Débutant, 3 ans…" },
    { key: "disponibilite", label: "Disponibilité", placeholder: "Choisir…", inputType: "select", options: DISPONIBILITE_OPTIONS },
    { key: "mobilite", label: "Mobilité", placeholder: "Choisir…", inputType: "select", options: MOBILITE_OPTIONS },
  ],
  freelance: [
    { key: "activite_visee", label: "Activité visée", placeholder: "Ex. Consultant RH" },
    { key: "clientele_cible", label: "Clientèle cible", placeholder: "Ex. PME, indépendants…" },
    { key: "niveau_avancement", label: "Niveau d'avancement", placeholder: "Ex. Idée, lancement, croissance" },
    { key: "services_proposes", label: "Services proposés", placeholder: "Ex. Coaching, formation…" },
    { key: "zone_intervention", label: "Zone d'intervention", placeholder: "Ex. Normandie, France entière" },
  ],
  reconversion: [
    { key: "metier_actuel", label: "Métier actuel", placeholder: "Ex. Assistant administratif" },
    { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Chef de projet digital", isCareerTarget: true },
    { key: "secteur_vise", label: "Secteur visé", placeholder: "Choisir…", inputType: "select", options: SECTEUR_OPTIONS },
    { key: "horizon_projet", label: "Horizon du projet", placeholder: "Ex. 6 à 12 mois" },
    { key: "contraintes_principales", label: "Contraintes principales", placeholder: "Ex. Temps partiel, mobilité limitée…" },
  ],
  autre: [
    { key: "objectif_libre", label: "Objectif libre", placeholder: "Décrivez votre projet" },
    { key: "contexte_actuel", label: "Contexte actuel", placeholder: "Ex. En poste, en recherche…" },
    {
      key: "metier_ou_projet_vise",
      label: "Métier ou projet visé",
      placeholder: "Ex. Création d'entreprise, reconversion…",
      isCareerTarget: true,
    },
    { key: "besoin_principal", label: "Besoin principal", placeholder: "Ex. Orientation, montée en compétences…" },
  ],
};

export function objectiveTypeLabel(raw: string | null | undefined): string {
  const type = normalizeParticulierObjectiveType(raw);
  return OBJECTIVE_TYPE_LABELS[type];
}

export function getProfessionalProjectFields(typeProfil: string | null | undefined): ProfessionalProjectField[] {
  return PROFESSIONAL_PROJECT_FIELDS[normalizeParticulierObjectiveType(typeProfil)];
}

export function getCareerTargetFieldKey(typeProfil: string | null | undefined): string | null {
  const field = getProfessionalProjectFields(typeProfil).find((f) => f.isCareerTarget);
  return field?.key ?? null;
}

export function extractCareerTitleFromProject(
  typeProfil: string | null | undefined,
  project: ProfessionalProject,
): string | null {
  const migrated = migrateLegacyProjectToV2(project);
  const v2Display = buildUserObjectiveDisplay(migrated);
  if (v2Display) return v2Display;

  const key = getCareerTargetFieldKey(typeProfil);
  if (!key) return null;
  const value = project[key]?.trim();
  return value || null;
}

function filled(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

export function isProfessionalProjectCompleteForType(
  typeProfil: string | null | undefined,
  project: ProfessionalProject,
): boolean {
  const migrated = migrateLegacyProjectToV2(project);
  if (isEdgeProjectV2Complete(migrated)) return true;

  const fields = getProfessionalProjectFields(typeProfil);
  if (!fields.length) return false;
  return fields.every((f) => filled(project[f.key]));
}

/** Fusionne objective_details (onboarding) dans professional_project si champs vides. */
export function mergeObjectiveDetailsIntoProject(
  typeProfil: string | null | undefined,
  project: ProfessionalProject,
  objectiveDetails: Record<string, string> | null | undefined,
): ProfessionalProject {
  if (!objectiveDetails) return project;
  const merged = { ...project };
  for (const [key, value] of Object.entries(objectiveDetails)) {
    if (!filled(merged[key]) && filled(value)) {
      merged[key] = String(value).trim();
    }
  }
  // Rétrocompat : anciens champs projet générique
  if (!filled(merged.secteur) && filled(merged.secteur_souhaite)) merged.secteur = merged.secteur_souhaite;
  if (!filled(merged.metier_vise) && filled(merged.metier_recherche)) merged.metier_vise = merged.metier_recherche;
  return merged;
}

export function projectSummaryLines(
  typeProfil: string | null | undefined,
  project: ProfessionalProject,
): Array<{ label: string; value: string }> {
  const migrated = migrateLegacyProjectToV2(project);
  const display = buildUserObjectiveDisplay(migrated);
  if (display) {
    return [
      { label: "Objectif", value: display },
      {
        label: "Projet",
        value: migrated.edge_projet_libre?.trim() || "—",
      },
    ];
  }

  return getProfessionalProjectFields(typeProfil)
    .slice(0, 3)
    .map((f) => ({ label: f.label, value: project[f.key]?.trim() || "—" }));
}
