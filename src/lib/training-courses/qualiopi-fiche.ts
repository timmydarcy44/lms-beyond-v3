/** Champs Qualiopi fiche formation (ind. 1 & 2 — RNQ V10). */

export const QUALIOPI_RECOGNITION_TYPES = [
  {
    id: "attestation_fin",
    label: "Attestation de fin de formation",
  },
  {
    id: "certificat_realisation",
    label: "Certificat de réalisation",
  },
  {
    id: "open_badge",
    label: "Open Badge",
  },
  {
    id: "aucune_certification_pro",
    label: "Aucune certification professionnelle",
  },
] as const;

export type QualiopiRecognitionType = (typeof QUALIOPI_RECOGNITION_TYPES)[number]["id"];

export const QUALIOPI_PEDAGOGICAL_MODALITIES = [
  { id: "presentiel", label: "Présentiel" },
  { id: "distanciel_synchrone", label: "Distanciel synchrone" },
  { id: "elearning_asynchrone", label: "E-learning asynchrone" },
  { id: "mixte", label: "Mixte" },
] as const;

export type QualiopiPedagogicalModality =
  (typeof QUALIOPI_PEDAGOGICAL_MODALITIES)[number]["id"];

export const QUALIOPI_RESULTS_FALLBACK =
  "Premières données publiées après les premières sessions";

export const QUALIOPI_RESULTS_METHOD_PLACEHOLDER = "À rédiger";

export const QUALIOPI_FICHE_SELECT_FIELDS =
  "recognition_type,recognition_detail,pedagogical_modality,pedagogical_modality_detail,financing_modalities,price_on_quote,results_method_override";

export function recognitionTypeLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return QUALIOPI_RECOGNITION_TYPES.find((t) => t.id === id)?.label ?? id;
}

export function pedagogicalModalityLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return QUALIOPI_PEDAGOGICAL_MODALITIES.find((t) => t.id === id)?.label ?? id;
}

export type QualiopiFicheFields = {
  recognition_type?: string | null;
  recognition_detail?: string | null;
  pedagogical_modality?: string | null;
  pedagogical_modality_detail?: string | null;
  financing_modalities?: string | null;
  price_on_quote?: boolean | null;
  intra_price?: number | null;
  inter_price?: number | null;
  results_method_override?: string | null;
  objectives?: string[] | null;
};

export type QualiopiFicheCompliance = {
  ok: boolean;
  missing: string[];
};

/** Une fiche catalogue est conforme Lot 1 si tous les champs Qualiopi demandés sont remplis. */
export function assessQualiopiFicheCompliance(
  course: QualiopiFicheFields,
): QualiopiFicheCompliance {
  const missing: string[] = [];
  const objectives = (course.objectives ?? []).filter((o) => String(o).trim());
  if (objectives.length < 3) missing.push("Objectifs (≥ 3)");
  if (!course.recognition_type) missing.push("Type de reconnaissance");
  if (!course.pedagogical_modality) missing.push("Modalité pédagogique");
  if (!String(course.pedagogical_modality_detail ?? "").trim()) {
    missing.push("Description des modalités pédagogiques");
  }
  if (!String(course.financing_modalities ?? "").trim()) {
    missing.push("Modalités de financement");
  }
  const onQuote = Boolean(course.price_on_quote);
  if (!onQuote && course.intra_price == null && course.inter_price == null) {
    missing.push("Tarif (montant HT ou « Sur devis »)");
  }
  return { ok: missing.length === 0, missing };
}

export function resolveResultsMethod(input: {
  ofSettingsMethod?: string | null;
  courseOverride?: string | null;
}): string {
  const override = String(input.courseOverride ?? "").trim();
  if (override) return override;
  const global = String(input.ofSettingsMethod ?? "").trim();
  if (global) return global;
  return QUALIOPI_RESULTS_METHOD_PLACEHOLDER;
}

export function formatQualiopiTariff(course: QualiopiFicheFields): string {
  if (course.price_on_quote) return "Sur devis";
  const parts: string[] = [];
  if (course.inter_price != null) {
    parts.push(`${course.inter_price.toLocaleString("fr-FR")} € HT / participant (inter)`);
  }
  if (course.intra_price != null) {
    parts.push(`${course.intra_price.toLocaleString("fr-FR")} € HT / groupe (intra)`);
  }
  return parts.length ? parts.join(" · ") : "Sur devis";
}
