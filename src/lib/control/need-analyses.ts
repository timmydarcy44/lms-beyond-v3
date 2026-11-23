export type NeedAnalysisRecommendation = {
  label: string;
  notes: string;
  catalog_course_id?: string | null;
};

export type NeedAnalysisStatus = "draft" | "complete";
export type NeedAnalysisRequestType = "entreprise" | "particulier";

export type NeedAnalysisPlaceMode =
  | ""
  | "presentiel"
  | "visio"
  | "distanciel_asynchrone"
  | "mixte"
  | "a_preciser";

export type NeedAnalysisFunding =
  | ""
  | "entreprise"
  | "opco"
  | "plan_dev"
  | "particulier"
  | "france_travail"
  | "autre"
  | "a_preciser"
  | "mixte"
  | "inconnu";

export type NeedAnalysisExchangeMode = "" | "telephone" | "visio" | "rdv" | "mail";

export type NeedAnalysisBeneficiarySituation =
  | ""
  | "salarie"
  | "demandeur_emploi"
  | "independant"
  | "reconversion"
  | "autre";

export type NeedAnalysisDigitalEase = "" | "faible" | "moyenne" | "bonne";

/** Champs structurés de prise de notes (récolte besoins). */
export type NeedAnalysisDetails = {
  place: string;
  place_mode: NeedAnalysisPlaceMode;
  duration: string;
  dates: string;
  budget: string;
  /** Particulier : prix annoncé TTC (à la place de budget). */
  announced_price_ttc: string;
  funding: NeedAnalysisFunding;
  headcount: string;
  roles: string;
  level: string;
  experience: string;
  audience_notes: string;
  constraints_notes: string;
  /** Particulier — bénéficiaire */
  beneficiary_situation: NeedAnalysisBeneficiarySituation;
  professional_project: string;
  motivations: string;
  domain_experience: string;
  weekly_availability: string;
  has_computer: boolean | null;
  has_internet: boolean | null;
  digital_ease: NeedAnalysisDigitalEase;
  prerequisites_checked: boolean;
  prerequisites_comment: string;
};

export const EMPTY_NEED_ANALYSIS_DETAILS: NeedAnalysisDetails = {
  place: "",
  place_mode: "",
  duration: "",
  dates: "",
  budget: "",
  announced_price_ttc: "",
  funding: "",
  headcount: "",
  roles: "",
  level: "",
  experience: "",
  audience_notes: "",
  constraints_notes: "",
  beneficiary_situation: "",
  professional_project: "",
  motivations: "",
  domain_experience: "",
  weekly_availability: "",
  has_computer: null,
  has_internet: null,
  digital_ease: "",
  prerequisites_checked: false,
  prerequisites_comment: "",
};

export type OrganizationNeedAnalysis = {
  id: string;
  organization_id: string | null;
  deal_id: string | null;
  title: string;
  request_type: NeedAnalysisRequestType;
  exchange_date: string | null;
  exchange_mode: NeedAnalysisExchangeMode;
  interlocutor_name: string;
  interlocutor_role: string;
  conducted_by: string | null;
  accessibility_asked: boolean;
  accessibility_needed: "oui" | "non" | "";
  context_problem: string;
  expected_outcomes: string;
  audience: string;
  constraints: string;
  disability_accommodations: string;
  decided_adaptations: string;
  details: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
  status: NeedAnalysisStatus;
  completed_at: string | null;
  validated_by: string | null;
  validated_at: string | null;
  client_sent_at: string | null;
  client_validated_at: string | null;
  pdf_storage_path: string | null;
  pdf_storage_bucket: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export const PLACE_MODE_LABEL: Record<Exclude<NeedAnalysisPlaceMode, "">, string> = {
  presentiel: "Présentiel",
  visio: "Distanciel synchrone (visio)",
  distanciel_asynchrone: "Distanciel asynchrone (LMS)",
  mixte: "Mixte",
  a_preciser: "À préciser",
};

export const FUNDING_LABEL: Record<Exclude<NeedAnalysisFunding, "">, string> = {
  entreprise: "Entreprise (fonds propres)",
  opco: "OPCO",
  plan_dev: "Plan de développement des compétences",
  particulier: "Particulier (autofinancement)",
  france_travail: "France Travail",
  autre: "Autre",
  a_preciser: "À préciser",
  mixte: "Mixte OPCO / entreprise",
  inconnu: "Financement à préciser",
};

export const EXCHANGE_MODE_LABEL: Record<Exclude<NeedAnalysisExchangeMode, "">, string> = {
  telephone: "Téléphone",
  visio: "Visio",
  rdv: "Rendez-vous",
  mail: "Mail",
};

export const BENEFICIARY_SITUATION_LABEL: Record<
  Exclude<NeedAnalysisBeneficiarySituation, "">,
  string
> = {
  salarie: "Salarié(e)",
  demandeur_emploi: "Demandeur d'emploi",
  independant: "Indépendant(e)",
  reconversion: "En reconversion",
  autre: "Autre",
};

function asBoolOrNull(v: unknown): boolean | null {
  if (v === true || v === "true" || v === "oui" || v === 1) return true;
  if (v === false || v === "false" || v === "non" || v === 0) return false;
  return null;
}

export function normalizeNeedAnalysisDetails(raw: unknown): NeedAnalysisDetails {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const placeMode = String(row.place_mode ?? "");
  const funding = String(row.funding ?? "");
  const situation = String(row.beneficiary_situation ?? "");
  const ease = String(row.digital_ease ?? "");

  let normalizedPlace: NeedAnalysisPlaceMode = "";
  if (
    placeMode === "presentiel" ||
    placeMode === "visio" ||
    placeMode === "distanciel_asynchrone" ||
    placeMode === "mixte" ||
    placeMode === "a_preciser"
  ) {
    normalizedPlace = placeMode;
  }

  const fundingOk = [
    "entreprise",
    "opco",
    "plan_dev",
    "particulier",
    "france_travail",
    "autre",
    "a_preciser",
    "mixte",
    "inconnu",
  ].includes(funding);

  return {
    place: String(row.place ?? "").trim(),
    place_mode: normalizedPlace,
    duration: String(row.duration ?? "").trim(),
    dates: String(row.dates ?? "").trim(),
    budget: String(row.budget ?? "").trim(),
    announced_price_ttc: String(row.announced_price_ttc ?? "").trim(),
    funding: fundingOk ? (funding as NeedAnalysisFunding) : "",
    headcount: String(row.headcount ?? "").trim(),
    roles: String(row.roles ?? "").trim(),
    level: String(row.level ?? "").trim(),
    experience: String(row.experience ?? "").trim(),
    audience_notes: String(row.audience_notes ?? "").trim(),
    constraints_notes: String(row.constraints_notes ?? "").trim(),
    beneficiary_situation: (
      ["salarie", "demandeur_emploi", "independant", "reconversion", "autre"] as const
    ).includes(situation as never)
      ? (situation as NeedAnalysisBeneficiarySituation)
      : "",
    professional_project: String(row.professional_project ?? "").trim(),
    motivations: String(row.motivations ?? "").trim(),
    domain_experience: String(row.domain_experience ?? "").trim(),
    weekly_availability: String(row.weekly_availability ?? "").trim(),
    has_computer: asBoolOrNull(row.has_computer),
    has_internet: asBoolOrNull(row.has_internet),
    digital_ease:
      ease === "faible" || ease === "moyenne" || ease === "bonne"
        ? ease
        : "",
    prerequisites_checked: Boolean(row.prerequisites_checked),
    prerequisites_comment: String(row.prerequisites_comment ?? "").trim(),
  };
}

export function composeAudienceText(
  details: NeedAnalysisDetails,
  fallback = "",
  requestType: NeedAnalysisRequestType = "entreprise",
) {
  if (requestType === "particulier") {
    const lines = [
      details.beneficiary_situation
        ? `Situation : ${BENEFICIARY_SITUATION_LABEL[details.beneficiary_situation]}`
        : null,
      details.professional_project ? `Projet : ${details.professional_project}` : null,
      details.motivations ? `Motivations : ${details.motivations}` : null,
      details.domain_experience ? `Expérience domaine : ${details.domain_experience}` : null,
      details.weekly_availability ? `Temps / semaine : ${details.weekly_availability}` : null,
      details.has_computer != null ? `Ordinateur : ${details.has_computer ? "oui" : "non"}` : null,
      details.has_internet != null
        ? `Connexion internet : ${details.has_internet ? "oui" : "non"}`
        : null,
      details.digital_ease ? `Aisance numérique : ${details.digital_ease}` : null,
      details.prerequisites_checked
        ? `Prérequis vérifiés${details.prerequisites_comment ? ` — ${details.prerequisites_comment}` : ""}`
        : null,
    ].filter(Boolean);
    return lines.length ? lines.join("\n") : fallback.trim();
  }
  const lines = [
    details.headcount ? `Effectif : ${details.headcount}` : null,
    details.roles ? `Postes : ${details.roles}` : null,
    details.level ? `Niveau : ${details.level}` : null,
    details.experience ? `Expérience : ${details.experience}` : null,
    details.audience_notes || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : fallback.trim();
}

export function composeConstraintsText(details: NeedAnalysisDetails, fallback = "") {
  const lines = [
    details.place_mode ? `Modalité : ${PLACE_MODE_LABEL[details.place_mode]}` : null,
    details.place ? `Lieu : ${details.place}` : null,
    details.duration ? `Durée : ${details.duration}` : null,
    details.dates ? `Dates / période : ${details.dates}` : null,
    details.budget ? `Budget : ${details.budget}` : null,
    details.announced_price_ttc ? `Prix annoncé (TTC) : ${details.announced_price_ttc}` : null,
    details.funding ? `Financement : ${FUNDING_LABEL[details.funding]}` : null,
    details.constraints_notes || null,
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : fallback.trim();
}

export type NeedAnalysisCompleteness = {
  ready: boolean;
  missing: string[];
};

/** Évalue la complétude selon le type + liste des manques. */
export function assessNeedAnalysisCompleteness(input: {
  request_type?: NeedAnalysisRequestType | null;
  exchange_date?: string | null;
  exchange_mode?: string | null;
  interlocutor_name?: string | null;
  conducted_by?: string | null;
  context_problem?: string | null;
  expected_outcomes?: string | null;
  accessibility_asked?: boolean | null;
  accessibility_needed?: string | null;
  disability_accommodations?: string | null;
  decided_adaptations?: string | null;
  validated_by?: string | null;
  details?: NeedAnalysisDetails | null;
}): NeedAnalysisCompleteness {
  const type: NeedAnalysisRequestType =
    input.request_type === "particulier" ? "particulier" : "entreprise";
  const details = input.details ?? EMPTY_NEED_ANALYSIS_DETAILS;
  const missing: string[] = [];

  if (!String(input.exchange_date ?? "").trim()) missing.push("Date de l'échange");
  if (!String(input.exchange_mode ?? "").trim()) missing.push("Mode d'échange");
  if (!String(input.interlocutor_name ?? "").trim()) missing.push("Interlocuteur (nom)");
  if (!String(input.conducted_by ?? "").trim()) missing.push("Analyse menée par");

  if (!String(input.context_problem ?? "").trim()) {
    missing.push(type === "particulier" ? "Pourquoi cette formation, maintenant ?" : "Contexte");
  }
  if (!String(input.expected_outcomes ?? "").trim()) {
    missing.push(
      type === "particulier"
        ? "Ce que la personne veut être capable de faire"
        : "Résultats attendus",
    );
  }

  if (type === "entreprise") {
    if (!composeAudienceText(details, "", "entreprise")) missing.push("Public (effectif / postes…)");
  } else {
    if (!details.beneficiary_situation) missing.push("Situation actuelle");
    if (!details.professional_project.trim()) missing.push("Projet professionnel");
    if (!details.motivations.trim()) missing.push("Motivations et attentes");
  }

  if (!composeConstraintsText(details)) missing.push("Cadre & contraintes (modalité / financement…)");

  if (!input.accessibility_asked) missing.push("Question handicap posée");
  if (input.accessibility_needed === "oui") {
    if (!String(input.disability_accommodations ?? "").trim()) {
      missing.push("Situations de handicap / aménagements");
    }
    if (!String(input.decided_adaptations ?? "").trim()) {
      missing.push("Adaptations décidées");
    }
  } else if (input.accessibility_needed !== "non") {
    // Legacy : sans le nouveau champ, exiger les deux textes comme avant
    if (!String(input.disability_accommodations ?? "").trim()) {
      missing.push("Handicap & aménagements");
    }
    if (!String(input.decided_adaptations ?? "").trim()) {
      missing.push("Adaptations décidées");
    }
  }

  if (!String(input.validated_by ?? "").trim()) missing.push("Validée par (interne)");

  return { ready: missing.length === 0, missing };
}

/** @deprecated Prefer assessNeedAnalysisCompleteness */
export function isNeedAnalysisComplete(input: {
  context_problem?: string | null;
  expected_outcomes?: string | null;
  audience?: string | null;
  constraints?: string | null;
  disability_accommodations?: string | null;
  decided_adaptations?: string | null;
  details?: NeedAnalysisDetails | null;
  request_type?: NeedAnalysisRequestType | null;
  exchange_date?: string | null;
  exchange_mode?: string | null;
  interlocutor_name?: string | null;
  conducted_by?: string | null;
  accessibility_asked?: boolean | null;
  accessibility_needed?: string | null;
  validated_by?: string | null;
}) {
  // Rétrocompat : si aucun champ v2, garder l’ancienne règle 6 blocs
  const hasV2 =
    input.request_type != null ||
    input.exchange_date != null ||
    input.conducted_by != null ||
    input.validated_by != null ||
    input.accessibility_asked != null;

  if (!hasV2) {
    const details = input.details ?? EMPTY_NEED_ANALYSIS_DETAILS;
    const audience = composeAudienceText(details, input.audience ?? "");
    const constraints = composeConstraintsText(details, input.constraints ?? "");
    return (
      String(input.context_problem ?? "").trim().length > 0 &&
      String(input.expected_outcomes ?? "").trim().length > 0 &&
      audience.length > 0 &&
      constraints.length > 0 &&
      String(input.disability_accommodations ?? "").trim().length > 0 &&
      String(input.decided_adaptations ?? "").trim().length > 0
    );
  }

  return assessNeedAnalysisCompleteness(input).ready;
}

export function normalizeRecommendations(raw: unknown): NeedAnalysisRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const label = String(row.label ?? "").trim();
      if (!label) return null;
      return {
        label,
        notes: String(row.notes ?? "").trim(),
        catalog_course_id: row.catalog_course_id ? String(row.catalog_course_id) : null,
      };
    })
    .filter(Boolean) as NeedAnalysisRecommendation[];
}

function normalizeExchangeMode(raw: unknown): NeedAnalysisExchangeMode {
  const v = String(raw ?? "");
  return v === "telephone" || v === "visio" || v === "rdv" || v === "mail" ? v : "";
}

export function mapNeedAnalysisRow(row: Record<string, unknown>): OrganizationNeedAnalysis {
  const details = normalizeNeedAnalysisDetails(row.details);
  const requestType: NeedAnalysisRequestType =
    row.request_type === "particulier" ? "particulier" : "entreprise";
  const needed = String(row.accessibility_needed ?? "");
  return {
    id: String(row.id),
    organization_id: row.organization_id ? String(row.organization_id) : null,
    deal_id: row.deal_id ? String(row.deal_id) : null,
    title: String(row.title ?? ""),
    request_type: requestType,
    exchange_date: row.exchange_date ? String(row.exchange_date).slice(0, 10) : null,
    exchange_mode: normalizeExchangeMode(row.exchange_mode),
    interlocutor_name: String(row.interlocutor_name ?? ""),
    interlocutor_role: String(row.interlocutor_role ?? ""),
    conducted_by: row.conducted_by ? String(row.conducted_by) : null,
    accessibility_asked: Boolean(row.accessibility_asked),
    accessibility_needed: needed === "oui" || needed === "non" ? needed : "",
    context_problem: String(row.context_problem ?? ""),
    expected_outcomes: String(row.expected_outcomes ?? ""),
    audience: String(row.audience ?? "") || composeAudienceText(details, "", requestType),
    constraints: String(row.constraints ?? "") || composeConstraintsText(details),
    disability_accommodations: String(row.disability_accommodations ?? ""),
    decided_adaptations: String(row.decided_adaptations ?? ""),
    details,
    recommendations: normalizeRecommendations(row.recommendations),
    status: row.status === "complete" ? "complete" : "draft",
    completed_at: row.completed_at ? String(row.completed_at) : null,
    validated_by: row.validated_by ? String(row.validated_by) : null,
    validated_at: row.validated_at ? String(row.validated_at) : null,
    client_sent_at: row.client_sent_at ? String(row.client_sent_at) : null,
    client_validated_at: row.client_validated_at
      ? String(row.client_validated_at).slice(0, 10)
      : null,
    pdf_storage_path: row.pdf_storage_path ? String(row.pdf_storage_path) : null,
    pdf_storage_bucket: row.pdf_storage_bucket ? String(row.pdf_storage_bucket) : null,
    created_by: row.created_by ? String(row.created_by) : null,
    updated_by: row.updated_by ? String(row.updated_by) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

/** Brief agrégé pour préremplir Sur-mesure. */
export function needAnalysisToSurMesureBrief(analysis: {
  title: string;
  context_problem: string;
  expected_outcomes: string;
  audience: string;
  constraints: string;
  disability_accommodations: string;
  decided_adaptations: string;
  details?: NeedAnalysisDetails;
  recommendations: NeedAnalysisRecommendation[];
  request_type?: NeedAnalysisRequestType;
}) {
  const details = analysis.details ?? EMPTY_NEED_ANALYSIS_DETAILS;
  const type = analysis.request_type ?? "entreprise";
  const audience = composeAudienceText(details, analysis.audience, type);
  const constraints = composeConstraintsText(details, analysis.constraints);
  const lines = [
    analysis.title.trim() ? `Titre : ${analysis.title.trim()}` : null,
    analysis.context_problem.trim()
      ? `Contexte et problème :\n${analysis.context_problem.trim()}`
      : null,
    analysis.expected_outcomes.trim()
      ? `Résultats attendus :\n${analysis.expected_outcomes.trim()}`
      : null,
    audience ? `Public :\n${audience}` : null,
    constraints ? `Contraintes :\n${constraints}` : null,
    analysis.disability_accommodations.trim()
      ? `Handicap / aménagements :\n${analysis.disability_accommodations.trim()}`
      : null,
    analysis.decided_adaptations.trim()
      ? `Adaptations décidées :\n${analysis.decided_adaptations.trim()}`
      : null,
  ].filter(Boolean);

  if (analysis.recommendations.length) {
    lines.push(
      `Préconisations :\n${analysis.recommendations
        .map((r) => `- ${r.label}${r.notes ? ` — ${r.notes}` : ""}`)
        .join("\n")}`,
    );
  }

  return lines.join("\n\n");
}

export const NEED_ANALYSIS_SURMESURE_STORAGE_KEY = "byound.surmesure.briefFromBesoin";

export const NEED_ANALYSIS_SELECT =
  "id, organization_id, deal_id, title, request_type, exchange_date, exchange_mode, interlocutor_name, interlocutor_role, conducted_by, accessibility_asked, accessibility_needed, context_problem, expected_outcomes, audience, constraints, disability_accommodations, decided_adaptations, details, recommendations, status, completed_at, validated_by, validated_at, client_sent_at, client_validated_at, pdf_storage_path, pdf_storage_bucket, created_by, updated_by, created_at, updated_at";

export const NEED_ANALYSIS_SELECT_LEGACY =
  "id, organization_id, deal_id, title, context_problem, expected_outcomes, audience, constraints, disability_accommodations, decided_adaptations, details, recommendations, status, completed_at, created_by, updated_by, created_at, updated_at";

/** Payload commun create/update — compose audience/constraints depuis details. */
export function buildNeedAnalysisWritePayload(body: Record<string, unknown>) {
  const details = normalizeNeedAnalysisDetails(body.details);
  const request_type: NeedAnalysisRequestType =
    body.request_type === "particulier" ? "particulier" : "entreprise";
  const context_problem = String(body.context_problem ?? "").trim();
  const expected_outcomes = String(body.expected_outcomes ?? "").trim();
  const disability_accommodations = String(body.disability_accommodations ?? "").trim();
  const decided_adaptations = String(body.decided_adaptations ?? "").trim();
  const audience = composeAudienceText(details, String(body.audience ?? ""), request_type);
  const constraints = composeConstraintsText(details, String(body.constraints ?? ""));
  const recommendations = normalizeRecommendations(body.recommendations);
  const accessibility_needed_raw = String(body.accessibility_needed ?? "").trim();
  const accessibility_needed =
    accessibility_needed_raw === "oui" || accessibility_needed_raw === "non"
      ? accessibility_needed_raw
      : null;

  return {
    details,
    request_type,
    exchange_date: body.exchange_date ? String(body.exchange_date).slice(0, 10) : null,
    exchange_mode: normalizeExchangeMode(body.exchange_mode) || null,
    interlocutor_name: String(body.interlocutor_name ?? "").trim() || null,
    interlocutor_role: String(body.interlocutor_role ?? "").trim() || null,
    conducted_by: body.conducted_by ? String(body.conducted_by) : null,
    accessibility_asked: Boolean(body.accessibility_asked),
    accessibility_needed,
    validated_by: body.validated_by ? String(body.validated_by) : null,
    client_validated_at: body.client_validated_at
      ? String(body.client_validated_at).slice(0, 10)
      : null,
    context_problem,
    expected_outcomes,
    audience,
    constraints,
    disability_accommodations,
    decided_adaptations,
    recommendations,
  };
}
