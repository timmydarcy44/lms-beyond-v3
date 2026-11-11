export type ReadyFieldKey =
  | "of_legal_name"
  | "of_siret"
  | "of_nda"
  | "of_qualiopi"
  | "of_address"
  | "of_contact"
  | "of_iban"
  | "action_title"
  | "action_objective"
  | "action_dates"
  | "action_duration"
  | "action_modality"
  | "action_location"
  | "action_formula"
  | "action_certifying"
  | "action_ht"
  | "action_tva"
  | "action_ttc"
  | "action_learners_count"
  | "company_siret"
  | "company_idcc"
  | "company_headcount"
  | "company_opco"
  | "company_member_number"
  | "learner_last_name"
  | "learner_first_name"
  | "learner_sex"
  | "learner_dob"
  | "learner_contract"
  | "learner_csp"
  | "learner_entry_date"
  | "learner_diploma"
  | "learner_hours"
  | "learner_on_work_time";

export type ReadyOpcoProfile = {
  id: string;
  label: string;
  portalName: string;
  /** URL publique du portail (connexion / dépôt). */
  portalUrl: string | null;
  /** Libellé du CTA affiché sur la fiche Ready. */
  portalCtaLabel: string;
  /** Libellés portail (override). */
  labels: Partial<Record<ReadyFieldKey, string>>;
  /** Ordre d'affichage des champs action / entreprise. */
  fieldOrder: ReadyFieldKey[];
  /** Champs stagiaires facultatifs pour cet OPCO. */
  optionalLearnerFields: Array<"learner_entry_date" | "learner_diploma">;
};

const DEFAULT_ORDER: ReadyFieldKey[] = [
  "of_legal_name",
  "of_siret",
  "of_nda",
  "of_qualiopi",
  "of_address",
  "of_contact",
  "of_iban",
  "action_title",
  "action_objective",
  "action_dates",
  "action_duration",
  "action_modality",
  "action_location",
  "action_formula",
  "action_certifying",
  "action_ht",
  "action_tva",
  "action_ttc",
  "action_learners_count",
  "company_siret",
  "company_idcc",
  "company_headcount",
  "company_opco",
  "company_member_number",
];

export const READY_OPCO_PROFILES: Record<string, ReadyOpcoProfile> = {
  default: {
    id: "default",
    label: "OPCO",
    portalName: "votre portail OPCO",
    portalUrl: null,
    portalCtaLabel: "Accéder à votre portail OPCO",
    labels: {},
    fieldOrder: DEFAULT_ORDER,
    optionalLearnerFields: ["learner_entry_date", "learner_diploma"],
  },
  atlas: {
    id: "atlas",
    label: "Atlas",
    portalName: "myAtlas",
    portalUrl: "https://www.myatlas.fr/",
    portalCtaLabel: "Ouvrir le portail myAtlas",
    labels: {
      action_title: "Intitulé de l'action",
      action_duration: "Durée (heures)",
      company_member_number: "N° adhérent Atlas",
      learner_csp: "Catégorie socioprofessionnelle",
    },
    fieldOrder: DEFAULT_ORDER,
    optionalLearnerFields: ["learner_entry_date", "learner_diploma"],
  },
  akto: {
    id: "akto",
    label: "AKTO",
    portalName: "Espace AKTO",
    portalUrl: "https://www.opco-akto.fr/",
    portalCtaLabel: "Redirection vers votre portail OPCO",
    labels: {
      action_title: "Intitulé de la formation",
      company_idcc: "IDCC",
      learner_entry_date: "Date d'entrée dans l'entreprise",
    },
    fieldOrder: DEFAULT_ORDER,
    optionalLearnerFields: ["learner_diploma"],
  },
  "opco-ep": {
    id: "opco-ep",
    label: "OPCO EP",
    portalName: "portail OPCO EP",
    portalUrl: "https://www.opcoep.fr/",
    portalCtaLabel: "Redirection vers votre portail OPCO",
    labels: {
      action_formula: "Type d'action (inter / intra)",
      learner_diploma: "Niveau de diplôme",
    },
    fieldOrder: DEFAULT_ORDER,
    optionalLearnerFields: ["learner_entry_date"],
  },
  constructys: {
    id: "constructys",
    label: "Constructys",
    portalName: "Espace Constructys",
    portalUrl: "https://www.constructys.fr/",
    portalCtaLabel: "Redirection vers votre portail OPCO",
    labels: {
      of_nda: "N° déclaration d'activité",
      learner_contract: "Nature du contrat",
    },
    fieldOrder: DEFAULT_ORDER,
    optionalLearnerFields: ["learner_entry_date", "learner_diploma"],
  },
};

export function resolveOpcoProfile(opcoName: string | null | undefined): ReadyOpcoProfile {
  const raw = String(opcoName || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!raw) return READY_OPCO_PROFILES.default;
  if (raw.includes("atlas")) return READY_OPCO_PROFILES.atlas;
  if (raw.includes("akto")) return READY_OPCO_PROFILES.akto;
  if (raw.includes("opco ep") || raw.includes("opco-ep") || raw.includes("entreprises de proximite")) {
    return READY_OPCO_PROFILES["opco-ep"];
  }
  if (raw.includes("constructys")) return READY_OPCO_PROFILES.constructys;
  return {
    ...READY_OPCO_PROFILES.default,
    label: String(opcoName).trim(),
  };
}

export function fieldLabel(profile: ReadyOpcoProfile, key: ReadyFieldKey, fallback: string): string {
  return profile.labels[key] || fallback;
}
