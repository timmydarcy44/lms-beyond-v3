import type { ParticulierObjectiveType } from "@/lib/particulier/objective-detail-fields";
import { normalizeParticulierObjectiveType } from "@/lib/particulier/objective-detail-fields";
import {
  CONTRACT_TYPES,
  DISPONIBILITE_OPTIONS,
  MOBILITE_OPTIONS,
  SECTEUR_OPTIONS,
} from "@/lib/particulier/edge-select-options";

export type OnboardingFieldType = "text" | "date" | "select" | "tags";

export type OnboardingField = {
  key: string;
  label: string;
  placeholder?: string;
  type: OnboardingFieldType;
  options?: Array<{ value: string; label: string }>;
  colSpan?: 1 | 2;
};

export type OnboardingObjectiveConfig = {
  title: string;
  subtitle: string;
  fields: OnboardingField[];
};

export const ONBOARDING_OBJECTIVE_CONFIG: Record<ParticulierObjectiveType, OnboardingObjectiveConfig> = {
  alternance: {
    title: "Construisons votre projet d'alternance",
    subtitle: "Ces informations alimentent votre matching et votre Profil EDGE.",
    fields: [
      { key: "formation_visee", label: "Formation visée", placeholder: "Ex. BTS NDRC", type: "text" },
      { key: "metier_recherche", label: "Métier recherché", placeholder: "Ex. Commercial", type: "text" },
      { key: "secteur", label: "Secteur", type: "select", options: SECTEUR_OPTIONS },
      { key: "mobilite", label: "Mobilité", type: "select", options: MOBILITE_OPTIONS },
      { key: "date_souhaitee", label: "Date souhaitée", type: "date" },
    ],
  },
  emploi: {
    title: "Construisons votre évolution professionnelle",
    subtitle: "Précisez votre situation et votre objectif pour personnaliser EDGE.",
    fields: [
      { key: "poste_actuel", label: "Poste actuel", placeholder: "Ex. Assistant commercial", type: "text" },
      { key: "metier_recherche", label: "Métier recherché", placeholder: "Ex. Chargé de clientèle", type: "text" },
      { key: "secteur", label: "Secteur", type: "select", options: SECTEUR_OPTIONS },
      {
        key: "type_contrat",
        label: "Type de contrat recherché",
        type: "select",
        options: CONTRACT_TYPES,
      },
      {
        key: "disponibilite",
        label: "Disponibilité",
        type: "select",
        options: DISPONIBILITE_OPTIONS,
      },
      { key: "mobilite", label: "Mobilité", type: "select", options: MOBILITE_OPTIONS },
    ],
  },
  freelance: {
    title: "Développons votre activité",
    subtitle: "Décrivez vos prestations et votre positionnement.",
    fields: [
      { key: "prestations", label: "Prestations proposées", type: "tags", colSpan: 2 },
      { key: "tjm", label: "TJM", placeholder: "Ex. 450 €", type: "text" },
      { key: "clientele_cible", label: "Clientèle cible", placeholder: "Ex. PME, startups…", type: "text" },
      { key: "zone_geographique", label: "Zone géographique", placeholder: "Ex. Normandie, France", type: "text", colSpan: 2 },
    ],
  },
  reconversion: {
    title: "Construisons votre nouveau projet",
    subtitle: "Définissez votre trajectoire de reconversion.",
    fields: [
      { key: "metier_actuel", label: "Métier actuel", placeholder: "Ex. Assistant administratif", type: "text" },
      { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Chef de projet digital", type: "text" },
      { key: "secteur", label: "Secteur", type: "select", options: SECTEUR_OPTIONS },
      { key: "mobilite", label: "Mobilité", type: "select", options: MOBILITE_OPTIONS },
      { key: "date_souhaitee", label: "Date souhaitée", type: "date" },
    ],
  },
  autre: {
    title: "Complétons votre profil",
    subtitle: "Ces informations améliorent votre matching et votre visibilité.",
    fields: [
      { key: "objectif_libre", label: "Objectif", placeholder: "Décrivez votre projet", type: "text", colSpan: 2 },
      { key: "secteur", label: "Secteur", type: "select", options: SECTEUR_OPTIONS },
      { key: "mobilite", label: "Mobilité", type: "select", options: MOBILITE_OPTIONS },
    ],
  },
};

export function getOnboardingConfig(typeProfil: string | null | undefined): OnboardingObjectiveConfig {
  const type = normalizeParticulierObjectiveType(typeProfil);
  return ONBOARDING_OBJECTIVE_CONFIG[type];
}

export type ParticulierOnboardingForm = {
  first_name: string;
  last_name: string;
  city: string;
  telephone: string;
  birth_date: string;
  prestations: string[];
  [key: string]: string | string[];
};

export const EMPTY_ONBOARDING_FORM: ParticulierOnboardingForm = {
  first_name: "",
  last_name: "",
  city: "",
  telephone: "",
  birth_date: "",
  prestations: [],
};

function filled(value: unknown): boolean {
  return String(value ?? "").trim().length > 0;
}

/** Hydrate le formulaire onboarding depuis le profil (colonnes + professional_project). */
export function mapProfileToOnboardingForm(profile: Record<string, unknown>): ParticulierOnboardingForm {
  const pp = (profile.professional_project as Record<string, string>) ?? {};
  const od = (profile.objective_details as Record<string, string>) ?? {};

  const pick = (key: string, ...alts: string[]): string => {
    for (const k of [key, ...alts]) {
      const v = profile[k] ?? pp[k] ?? od[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return "";
  };

  const prestationsRaw = profile.prestations ?? pp.prestations ?? pp.services_proposes ?? od.prestations;
  let prestations: string[] = [];
  if (Array.isArray(prestationsRaw)) {
    prestations = prestationsRaw.map(String).filter((t) => t.trim());
  } else if (typeof prestationsRaw === "string" && prestationsRaw.trim()) {
    prestations = prestationsRaw.split(",").map((s) => s.trim()).filter(Boolean);
  } else {
    const legacy = [profile.expertise, profile.stack_technique]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    if (legacy.length) prestations = legacy;
  }

  const disponibiliteRaw = profile.disponibilite ?? pp.disponibilite ?? od.disponibilite;
  let disponibilite = pick("disponibilite");
  if (!disponibilite && disponibiliteRaw === true) disponibilite = "immediate";
  if (!disponibilite && disponibiliteRaw === false) disponibilite = "flexible";
  if (!disponibilite && String(disponibiliteRaw).toLowerCase() === "oui") disponibilite = "immediate";
  if (!disponibilite && String(disponibiliteRaw).toLowerCase() === "non") disponibilite = "flexible";

  return {
    first_name: String(profile.first_name ?? "").trim(),
    last_name: String(profile.last_name ?? "").trim(),
    city: pick("city"),
    telephone: pick("telephone", "phone"),
    birth_date: pick("birth_date", "date_naissance"),
    prestations,
    formation_visee: pick("formation_visee"),
    metier_recherche: pick("metier_recherche", "metier_vise"),
    secteur: pick("secteur", "secteur_souhaite", "secteur_vise"),
    mobilite: pick("mobilite"),
    date_souhaitee: pick("date_souhaitee", "date_debut_recherchee", "echeance", "horizon_projet"),
    poste_actuel: pick("poste_actuel"),
    type_contrat: pick("type_contrat"),
    disponibilite,
    tjm: pick("tjm"),
    clientele_cible: pick("clientele_cible"),
    zone_geographique: pick("zone_geographique", "zone_intervention"),
    metier_actuel: pick("metier_actuel", "ancien_metier"),
    metier_vise: pick("metier_vise"),
    objectif_libre: pick("objectif_libre"),
  };
}

export function validateOnboardingForm(
  typeProfil: string | null | undefined,
  form: ParticulierOnboardingForm,
): string | null {
  for (const key of ["first_name", "last_name", "city", "telephone", "birth_date"] as const) {
    if (!filled(form[key])) {
      return "Merci de compléter tous les champs requis pour votre profil.";
    }
  }

  const config = getOnboardingConfig(typeProfil);
  for (const field of config.fields) {
    if (field.type === "tags") {
      const tags = Array.isArray(form.prestations) ? form.prestations : [];
      if (!tags.length) return "Ajoutez au moins une prestation.";
      continue;
    }
    if (!filled(form[field.key])) {
      return "Merci de compléter tous les champs requis pour votre profil.";
    }
  }
  return null;
}

/** Construit le payload Supabase pour la sauvegarde onboarding. */
export function buildOnboardingSavePayload(
  typeProfil: string | null | undefined,
  form: ParticulierOnboardingForm,
  computeAge: (birthDate: string) => number | null,
): Record<string, unknown> {
  const type = normalizeParticulierObjectiveType(typeProfil);
  const objectiveDetails: Record<string, string> = {};
  const professionalProject: Record<string, string> = {};

  const setBoth = (key: string, value: string) => {
    objectiveDetails[key] = value;
    professionalProject[key] = value;
  };

  const config = getOnboardingConfig(typeProfil);
  for (const field of config.fields) {
    if (field.type === "tags") {
      const tags = Array.isArray(form.prestations) ? form.prestations : [];
      const joined = tags.join(", ");
      setBoth("prestations", joined);
      professionalProject.services_proposes = joined;
      continue;
    }
    const v = String(form[field.key] ?? "").trim();
    if (!v) continue;
    setBoth(field.key, v);

    if (type === "alternance") {
      if (field.key === "metier_recherche") professionalProject.metier_vise = v;
      if (field.key === "secteur") professionalProject.secteur_souhaite = v;
      if (field.key === "date_souhaitee") professionalProject.date_debut_recherchee = v;
    }
    if (type === "emploi" && field.key === "metier_recherche") {
      professionalProject.metier_recherche = v;
    }
    if (type === "freelance") {
      if (field.key === "zone_geographique") professionalProject.zone_intervention = v;
    }
    if (type === "reconversion") {
      if (field.key === "metier_actuel") professionalProject.metier_actuel = v;
      if (field.key === "secteur") professionalProject.secteur_vise = v;
      if (field.key === "date_souhaitee") professionalProject.horizon_projet = v;
    }
  }

  const payload: Record<string, unknown> = {
    first_name: form.first_name.trim() || null,
    last_name: form.last_name.trim() || null,
    city: form.city.trim() || null,
    telephone: form.telephone.trim() || null,
    birth_date: form.birth_date.trim() || null,
    age: computeAge(form.birth_date),
    onboarding_completed: true,
    objective_details: objectiveDetails,
    professional_project: professionalProject,
  };

  if (type === "emploi") {
    payload.poste_actuel = String(form.poste_actuel ?? "").trim() || null;
    payload.type_contrat = String(form.type_contrat ?? "").trim() || null;
    payload.disponibilite = String(form.disponibilite ?? "").trim() || null;
  }
  if (type === "freelance") {
    const tags = Array.isArray(form.prestations) ? form.prestations : [];
    payload.tjm = String(form.tjm ?? "").trim() || null;
    payload.expertise = tags[0] ?? null;
    payload.stack_technique = tags.join(", ") || null;
    payload.prestations = tags;
  }
  if (type === "reconversion") {
    payload.ancien_metier = String(form.metier_actuel ?? "").trim() || null;
    payload.metier_vise = String(form.metier_vise ?? "").trim() || null;
    payload.echeance = String(form.date_souhaitee ?? "").trim() || null;
  }
  if (type === "alternance") {
    payload.ecole = String(form.formation_visee ?? "").trim() || null;
    payload.metier_vise = String(form.metier_recherche ?? "").trim() || null;
    payload.date_fin_contrat = String(form.date_souhaitee ?? "").trim() || null;
  }

  return payload;
}
