/** Statuts du dossier formation (Kanban Programmation). */
export const FORMATION_DOSSIER_STATUSES = [
  "qualification",
  "devis",
  "convention",
  "mise_en_place",
  "session",
  "fin",
  "cloture",
] as const;

export type FormationDossierStatus = (typeof FORMATION_DOSSIER_STATUSES)[number];

export const FORMATION_DOSSIER_STATUS_LABELS: Record<FormationDossierStatus, string> = {
  qualification: "Qualification",
  devis: "Devis",
  convention: "Convention",
  mise_en_place: "Mise en place",
  session: "Session",
  fin: "Fin",
  cloture: "Clôturé",
};

/** Première entrée dans l’un de ces stages → création auto (idempotente). */
export const DOSSIER_DEAL_TRIGGER_STAGES = ["proposition_signee", "reussi", "gagne"] as const;

export type DossierDealTriggerStage = (typeof DOSSIER_DEAL_TRIGGER_STAGES)[number];

export function isDossierDealTriggerStage(stage: string | null | undefined): boolean {
  return DOSSIER_DEAL_TRIGGER_STAGES.includes(
    String(stage ?? "") as DossierDealTriggerStage,
  );
}

export const FORMATION_DOSSIER_SOURCES = [
  "deal_won",
  "manual",
  "site_request",
  "dashboard_request",
] as const;

export type FormationDossierSource = (typeof FORMATION_DOSSIER_SOURCES)[number];

/** Demandes clients (dashboard / site) encore en qualification → inbox « Demandes entrantes ». */
export const INCOMING_DOSSIER_SOURCES: FormationDossierSource[] = [
  "dashboard_request",
  "site_request",
];

export const FORMATION_DOSSIER_SOURCE_LABELS: Record<FormationDossierSource, string> = {
  deal_won: "Deal gagné",
  manual: "Création manuelle",
  site_request: "Site web",
  dashboard_request: "Dashboard entreprise",
};

export function isIncomingInboxDossier(row: {
  source?: string | null;
  status?: string | null;
}): boolean {
  return (
    INCOMING_DOSSIER_SOURCES.includes(String(row.source ?? "") as FormationDossierSource) &&
    String(row.status ?? "") === "qualification"
  );
}

export const BPF_FUNDER_TYPES = [
  "entreprises_salaries",
  "opco",
  "pouvoirs_publics",
  "cpf",
  "particuliers",
  "autres_of",
  "autres_produits",
] as const;

export type BpfFunderType = (typeof BPF_FUNDER_TYPES)[number];

export const BPF_LEARNER_STATUSES = [
  "salarie_prive",
  "apprenti",
  "demandeur_emploi",
  "particulier",
  "autre",
] as const;

export type BpfLearnerStatus = (typeof BPF_LEARNER_STATUSES)[number];

export const DEFAULT_DOCUMENT_KINDS: Array<{ kind: string; title: string }> = [
  { kind: "devis", title: "Devis" },
  { kind: "convention", title: "Convention de formation" },
  { kind: "cgv", title: "CGV" },
  { kind: "reglement", title: "Règlement intérieur" },
  { kind: "programme", title: "Programme" },
  { kind: "convocation", title: "Convocation" },
  { kind: "livret", title: "Livret d'accueil" },
  { kind: "formateur_cv", title: "CV formateur" },
  { kind: "emargement", title: "Feuille d'émargement" },
  { kind: "certificat", title: "Certificat de réalisation" },
  { kind: "attestation", title: "Attestation de fin" },
  { kind: "facture", title: "Facture" },
];

export const ASSIGNMENT_KEYS = ["devis", "formateur", "facture", "cloture_emargement"] as const;

export type FormationAssignmentKey = (typeof ASSIGNMENT_KEYS)[number];

/** Champs BPF requis pour quitter Convention → Mise en place. */
export const BPF_REQUIRED_FOR_MISE_EN_PLACE = [
  "bpf_funder_type",
  "subcontracting",
] as const;
