/** Champs Qualiopi fiche formation (ind. 1 & 2 — RNQ V10). */

/** Constantes partagées : contrôle, Preuves catalogue, fiche formation, one-pager. */
export const CATALOGUE_PROOF_FIELDS = [
  { id: "objectives", label: "Objectifs (≥ 3)", required: true },
  { id: "recognition_type", label: "Type de reconnaissance", required: true },
  { id: "pedagogical_modality", label: "Modalités pédagogiques", required: true },
  { id: "pedagogical_modality_detail", label: "Description des modalités", required: true },
  { id: "duration", label: "Durée", required: true },
  { id: "tariff", label: "Tarif", required: true },
  { id: "financing_modalities", label: "Financements possibles", required: true },
  { id: "accessibility", label: "Mention accessibilité handicap", required: true },
] as const;

export type CatalogueProofFieldId = (typeof CATALOGUE_PROOF_FIELDS)[number]["id"];

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
  duration?: string | null;
  /** Formats catalogue (Présentiel / Distanciel / Blended…) — fallback modalité. */
  formats?: string[] | null;
  /** Open Badge affiché sur la fiche — fallback type de reconnaissance. */
  badge_name?: string | null;
  badge_class_id?: string | null;
};

export type QualiopiFicheCompliance = {
  ok: boolean;
  missing: string[];
  /** Champs manquants par id CATALOGUE_PROOF_FIELDS. */
  missingIds: CatalogueProofFieldId[];
  /** Champs remplis (8 cases de complétude). */
  filledIds: CatalogueProofFieldId[];
  /** Valeurs résolues après fallbacks de lecture (ne sont pas écrites en base). */
  resolved: {
    recognition_type: string | null;
    pedagogical_modality: string | null;
    pedagogical_modality_detail: string | null;
  };
};

/** Mappe `formats[]` catalogue → id modalité Qualiopi (lecture seule). */
export function derivePedagogicalModalityFromFormats(
  formats: string[] | null | undefined,
): QualiopiPedagogicalModality | null {
  const f = (formats ?? []).map((x) => String(x).toLowerCase());
  if (!f.length) return null;
  const hasP = f.some((x) => x.includes("présentiel") || x.includes("presentiel"));
  const hasD = f.some(
    (x) => x.includes("distanciel") || x.includes("e-learning") || x.includes("elearning"),
  );
  const hasB = f.some((x) => x.includes("blended") || x.includes("mixte"));
  if (hasB || (hasP && hasD)) return "mixte";
  if (hasP && !hasD) return "presentiel";
  if (hasD && !hasP) return "distanciel_synchrone";
  return null;
}

/**
 * Résout les champs Qualiopi en lisant d’abord les colonnes dédiées,
 * puis les données déjà saisies ailleurs sur la fiche (formats, badge).
 * Ne remplit pas la description des modalités ni le financement (vraiment absents).
 */
export function resolveQualiopiFicheFields(course: QualiopiFicheFields): {
  recognition_type: string | null;
  pedagogical_modality: string | null;
  pedagogical_modality_detail: string | null;
} {
  const recognition =
    String(course.recognition_type ?? "").trim() ||
    (course.badge_name || course.badge_class_id ? "open_badge" : null);
  const modality =
    String(course.pedagogical_modality ?? "").trim() ||
    derivePedagogicalModalityFromFormats(course.formats);
  const detail = String(course.pedagogical_modality_detail ?? "").trim() || null;
  return {
    recognition_type: recognition,
    pedagogical_modality: modality,
    pedagogical_modality_detail: detail,
  };
}

/** Une fiche catalogue est conforme Lot 1 si tous les champs Qualiopi demandés sont remplis. */
export function assessQualiopiFicheCompliance(
  course: QualiopiFicheFields,
  options?: { accessibilityOk?: boolean },
): QualiopiFicheCompliance {
  const missing: string[] = [];
  const missingIds: CatalogueProofFieldId[] = [];
  const resolved = resolveQualiopiFicheFields(course);
  const objectives = (course.objectives ?? []).filter((o) => String(o).trim());

  if (objectives.length < 3) {
    missing.push("Objectifs (≥ 3)");
    missingIds.push("objectives");
  }
  if (!resolved.recognition_type) {
    missing.push("Type de reconnaissance");
    missingIds.push("recognition_type");
  }
  if (!resolved.pedagogical_modality) {
    missing.push("Modalité pédagogique");
    missingIds.push("pedagogical_modality");
  }
  if (!resolved.pedagogical_modality_detail) {
    missing.push("Description des modalités pédagogiques");
    missingIds.push("pedagogical_modality_detail");
  }
  if (!String(course.duration ?? "").trim()) {
    missing.push("Durée");
    missingIds.push("duration");
  }
  if (!String(course.financing_modalities ?? "").trim()) {
    missing.push("Modalités de financement");
    missingIds.push("financing_modalities");
  }
  const onQuote = Boolean(course.price_on_quote);
  if (!onQuote && course.intra_price == null && course.inter_price == null) {
    missing.push("Tarif (montant HT ou « Sur devis »)");
    missingIds.push("tariff");
  }
  if (options?.accessibilityOk === false) {
    missing.push("Mention accessibilité handicap");
    missingIds.push("accessibility");
  }

  const filledIds = CATALOGUE_PROOF_FIELDS.map((f) => f.id).filter(
    (id) => !missingIds.includes(id),
  );

  return {
    ok: missing.length === 0,
    missing,
    missingIds,
    filledIds,
    resolved,
  };
}

/** Libellés financement (fiche catalogue + saisie en série). */
export const QUALIOPI_FINANCING_OPTIONS = [
  "OPCO",
  "CPF",
  "France Travail",
  "Fonds propres",
  "Plan de développement des compétences",
  "Entreprise",
  "Sur devis",
] as const;

/** Descriptions de modalités pédagogiques — sélection unique (texte standard OF). */
export const QUALIOPI_MODALITY_DETAIL_OPTIONS = [
  {
    id: "standard_atelier",
    label: "Ateliers & mises en situation",
    text: "Alternance d’apports théoriques et de mises en situation. Ateliers en sous-groupes, études de cas métier, feedbacks individualisés. Supports remis sur le LMS ; temps de questions-réponses en fin de chaque séquence.",
  },
  {
    id: "standard_coaching",
    label: "Apports + coaching",
    text: "Séquences d’apports courts, démonstrations et coaching individuel ou en binôme. Plan d’action personnalisé en fin de parcours. Supports et replay disponibles sur le LMS.",
  },
  {
    id: "standard_elearning",
    label: "Parcours e-learning guidé",
    text: "Modules asynchrones sur le LMS, quiz de validation et classes virtuelles de consolidation. Accompagnement tutoré, forum et points synchrones planifiés.",
  },
  {
    id: "standard_mixte",
    label: "Parcours mixte (présentiel + digital)",
    text: "Journées en présentiel pour la pratique et le collectif, complétées par des modules digitaux avant/après. Évaluations formatives tout au long du parcours.",
  },
] as const;

/** Exemple / défaut (première option). */
export const QUALIOPI_MODALITY_DETAIL_EXAMPLE =
  QUALIOPI_MODALITY_DETAIL_OPTIONS[0].text;

export function modalityDetailOptionId(text: string | null | undefined): string {
  const t = String(text ?? "").trim();
  if (!t) return "";
  const found = QUALIOPI_MODALITY_DETAIL_OPTIONS.find((o) => o.text === t);
  return found?.id ?? "";
}

/** Affichage titre en casse de phrase (ne modifie pas la base). */
export function sentenceCaseTitle(title: string): string {
  const t = String(title ?? "").trim();
  if (!t) return t;
  const lower = t.toLocaleLowerCase("fr-FR");
  return lower.charAt(0).toLocaleUpperCase("fr-FR") + lower.slice(1);
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
