/**
 * Contenu Qualiopi & diagnostic Byound pour la page formation B2B.
 * Dérive un contenu premium à partir des données existantes, avec des
 * fallbacks conformes Qualiopi lorsque la donnée n'est pas encore saisie.
 */

import type { TrainingCourseDetail } from "@/lib/training-courses/build-detail";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import {
  QUALIOPI_RESULTS_FALLBACK,
  formatQualiopiTariff,
  pedagogicalModalityLabel,
  recognitionTypeLabel,
  resolveResultsMethod,
} from "@/lib/training-courses/qualiopi-fiche";

export type DiagnosticStep = {
  title: string;
  description: string;
};

/** Frise « Chaque parcours débute par un diagnostic ». */
export const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    title: "Évaluation psychométrique",
    description: "Mesure des aptitudes et du potentiel du collaborateur.",
  },
  {
    title: "Analyse comportementale",
    description: "Compréhension des modes de fonctionnement et des postures.",
  },
  {
    title: "Évaluation des Soft Skills",
    description: "Cartographie des compétences relationnelles et transverses.",
  },
  {
    title: "Identification des écarts de compétences",
    description: "Comparaison entre le profil actuel et le niveau attendu.",
  },
  {
    title: "Recommandation automatique des formations",
    description: "Byound propose uniquement les formations réellement utiles.",
  },
  {
    title: "Parcours personnalisé",
    description: "Un plan de développement adapté à chaque collaborateur.",
  },
];

/** Frise « Et après ? » — la progression continue après la formation. */
export const AFTER_TRAINING_STEPS: DiagnosticStep[] = [
  { title: "Formation terminée", description: "Les acquis sont consolidés." },
  { title: "Open Badge", description: "Une preuve vérifiable des compétences." },
  { title: "Suivi des compétences", description: "Byound mesure la progression dans le temps." },
  { title: "Recommandations IA", description: "De nouvelles priorités sont identifiées." },
  { title: "Nouvelles formations suggérées", description: "Le parcours évolue avec le collaborateur." },
  { title: "Coaching si nécessaire", description: "Un accompagnement humain reste disponible." },
];

/** 4 badges du hero, sous le CTA. */
export const HERO_DIAGNOSTIC_BADGES = [
  "Diagnostic des compétences",
  "Analyse comportementale",
  "Soft Skills",
  "Personnalisation du parcours",
] as const;

/** Méthodes pédagogiques par défaut (fusionnées avec la méthodologie saisie). */
const DEFAULT_PEDAGOGICAL_METHODS = [
  "Apports courts",
  "Mises en situation",
  "Jeux de rôle",
  "Feedback entre pairs",
  "Co-développement",
  "Coaching",
  "Études de cas",
  "Supports numériques",
  "Plan de progression",
  "Re-test à deux mois",
  "LMS Byound",
  "Parcours neuroadapté",
  "Entretiens expérientiels",
  "Jeux interactifs",
];

const REMOVED_PEDAGOGICAL_METHODS = new Set(["classe virtuelle"]);

export function buildPedagogicalMethods(detail: TrainingCourseDetail): string[] {
  const fromCourse = detail.methodology.filter(Boolean);
  const merged = [...fromCourse];
  for (const method of DEFAULT_PEDAGOGICAL_METHODS) {
    if (!merged.some((m) => m.toLowerCase() === method.toLowerCase())) merged.push(method);
  }
  return merged.filter((m) => !REMOVED_PEDAGOGICAL_METHODS.has(m.toLowerCase()));
}

/** Modalités d'évaluation (obligatoire Qualiopi). */
export function buildEvaluationModalities(): string[] {
  return [
    "Positionnement initial Byound",
    "Quiz intermédiaires",
    "Cas pratiques",
    "Exercices",
    "Mise en situation",
    "Évaluation finale",
    "Validation des compétences",
    "Attribution d'un Open Badge Byound",
  ];
}

export type SkillLevelRow = {
  skill: string;
  /** Niveau attendu, 1 à 5 étoiles. */
  level: number;
  evaluation: string;
  /** Open Badge / reconnaissance (plus de libellé « certification »). */
  recognition: string;
};

const EVALUATION_MODES = [
  "Évaluation pratique",
  "Cas pratique",
  "Mise en situation",
  "Quiz + exercice",
];

/** Tableau « Compétences développées » : compétence · niveau · évaluation · reconnaissance. */
export function buildSkillLevelRows(detail: TrainingCourseDetail): SkillLevelRow[] {
  return detail.competences.map((skill, index) => ({
    skill,
    level: index === 0 ? 5 : 4,
    evaluation: EVALUATION_MODES[index % EVALUATION_MODES.length],
    recognition: "Open Badge Byound",
  }));
}

export type PedagogicalObjectivesBlock = {
  intro: string;
  objectives: string[];
};

/** Objectifs pédagogiques formulés en compétences observables. */
export function buildPedagogicalObjectives(detail: TrainingCourseDetail): PedagogicalObjectivesBlock {
  return {
    intro: "À l'issue de cette formation, le participant sera capable de :",
    objectives: detail.objectives,
  };
}

export type QualiopiInfoItem = {
  label: string;
  value: string;
  wide?: boolean;
};

const DEFAULT_ACCESSIBILITY =
  "Formation accessible aux personnes en situation de handicap. Adaptations possibles sur demande, en lien si besoin avec nos partenaires (Agefiph, Cap Emploi).";

const DEFAULT_COMPLAINTS =
  "Pour toute réclamation : jessica.contentin@byound.fr — réponse sous 15 jours ouvrés.";

/** Bloc « Informations » enrichi conforme Qualiopi. */
export function buildQualiopiInfo(
  course: TrainingCoursePublic,
  detail: TrainingCourseDetail,
): QualiopiInfoItem[] {
  const modalityDetail = String(course.pedagogical_modality_detail ?? "").trim();
  const modalityShort =
    pedagogicalModalityLabel(course.pedagogical_modality) ||
    detail.formatsLabel ||
    null;
  // Champ « Modalités pédagogiques » = détail saisi ; sinon libellé court / formats.
  const modalites = modalityDetail || modalityShort || "À rédiger";
  const recognition = recognitionTypeLabel(course.recognition_type);
  const recognitionDetail = String(course.recognition_detail ?? "").trim();
  const recognitionValue = recognition
    ? [recognition, recognitionDetail].filter(Boolean).join(" — ")
    : "À rédiger";
  const publicConcerne = detail.audience.length
    ? detail.audience.join(" · ")
    : "Collaborateurs et managers concernés par la montée en compétences.";
  const updatedAt = course.updated_at
    ? new Date(course.updated_at).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const contactReferent =
    String(course.contact_referent ?? "").trim() ||
    (course.slug === "communiquer-avec-impact"
      ? "Jessica Contentin — jessica.contentin@byound.fr"
      : "") ||
    "Votre conseiller pédagogique Byound.";

  return [
    { label: "Public concerné", value: publicConcerne, wide: true },
    { label: "Prérequis", value: course.prerequisites || "Aucun prérequis spécifique." },
    { label: "Durée", value: course.duration || "Sur mesure selon le diagnostic." },
    { label: "Modalités pédagogiques", value: modalites, wide: true },
    { label: "Type de reconnaissance", value: recognitionValue, wide: true },
    {
      label: "Modalités de financement",
      value: String(course.financing_modalities ?? "").trim() || "À rédiger",
      wide: true,
    },
    { label: "Tarif", value: formatQualiopiTariff(course) },
    {
      label: "Effectif",
      value: `Jusqu'à ${detail.maxIntraParticipants} participants (intra).`,
    },
    {
      label: "Accessibilité handicap",
      value: DEFAULT_ACCESSIBILITY,
      wide: true,
    },
    { label: "Délais d'accès", value: "Accès sous 2 à 4 semaines après validation du diagnostic." },
    { label: "Contact référent", value: contactReferent, wide: true },
    {
      label: "Réclamations",
      value: DEFAULT_COMPLAINTS,
      wide: true,
    },
    {
      label: "Référent handicap",
      value: "referent-handicap@byound.fr — étude personnalisée de chaque situation.",
      wide: true,
    },
    ...(updatedAt
      ? [{ label: "Dernière mise à jour de la fiche", value: updatedAt }]
      : []),
  ];
}

export type QualityIndicatorKey =
  | "satisfaction"
  | "success"
  | "dropout"
  | "recommendation"
  | "completion";

/** Données publiées par indicateur (nullable tant que pas de sessions). */
export type QualityIndicatorStat = {
  value: number | null;
  period?: string | null;
  respondents?: number | null;
};

export type QualityIndicator = {
  key: QualityIndicatorKey;
  label: string;
  /** Affichage (ex. « 92 % — 25 répondants — Sessions 2027 ») ou null → « — ». */
  value: string | null;
  method: string;
};

/** Méthodes de calcul — identiques pour toutes les fiches (composant commun). */
export const QUALITY_INDICATOR_METHODS: Record<QualityIndicatorKey, string> = {
  satisfaction:
    "Questionnaire de fin de formation : % de répondants satisfaits ou très satisfaits.",
  success: "% de participants ayant obtenu l'Open Badge Byound.",
  dropout: "% de participants n'ayant pas terminé la formation.",
  recommendation: "% de répondants qui recommanderaient la formation.",
  completion: "% d'heures réalisées sur le nombre d'heures prévues.",
};

const QUALITY_INDICATOR_LABELS: Record<QualityIndicatorKey, string> = {
  satisfaction: "Taux de satisfaction",
  success: "Taux de réussite",
  dropout: "Taux d'abandon",
  recommendation: "Taux de recommandation",
  completion: "Taux de complétion",
};

export function formatQualityIndicatorDisplay(stat?: QualityIndicatorStat | null): string | null {
  if (!stat || stat.value == null || !Number.isFinite(stat.value)) return null;
  const parts = [`${Math.round(stat.value)} %`];
  if (stat.respondents != null && Number.isFinite(stat.respondents)) {
    parts.push(`${Math.round(stat.respondents)} répondants`);
  }
  if (stat.period && String(stat.period).trim()) {
    parts.push(String(stat.period).trim());
  }
  return parts.join(" — ");
}

/**
 * Indicateurs qualité. Jamais de valeur fictive.
 * Chaque carte a sa propre méthode de calcul (composant commun).
 */
export function buildQualityIndicators(input?: {
  ofSettingsMethod?: string | null;
  courseOverride?: string | null;
  /** Stats réelles par indicateur — sinon null / « — ». */
  stats?: Partial<Record<QualityIndicatorKey, QualityIndicatorStat | null>> | null;
  /** @deprecated Preférer `stats`. */
  values?: Partial<Record<string, string | null>>;
}): {
  available: boolean;
  fallbackMessage: string;
  method: string;
  indicators: QualityIndicator[];
} {
  const legacyMethod = resolveResultsMethod({
    ofSettingsMethod: input?.ofSettingsMethod,
    courseOverride: input?.courseOverride,
  });
  const stats = input?.stats ?? {};
  const legacyValues = input?.values ?? {};
  const keys = Object.keys(QUALITY_INDICATOR_METHODS) as QualityIndicatorKey[];
  const indicators: QualityIndicator[] = keys.map((key) => {
    const fromStats = formatQualityIndicatorDisplay(stats[key] ?? null);
    const fromLegacy =
      typeof legacyValues[key] === "string" && legacyValues[key]
        ? String(legacyValues[key])
        : null;
    return {
      key,
      label: QUALITY_INDICATOR_LABELS[key],
      value: fromStats ?? fromLegacy,
      method: QUALITY_INDICATOR_METHODS[key],
    };
  });
  const available = indicators.some((i) => i.value != null);
  return {
    available,
    fallbackMessage: QUALIOPI_RESULTS_FALLBACK,
    method: legacyMethod,
    indicators,
  };
}

export type EnrichedInstructor = {
  id: string;
  name: string;
  role: "primary" | "contributor";
  photoUrl: string;
  fonction: string;
  expertises: string[];
  years: string;
  certifications: string[];
  openBadges: string[];
  domaines: string[];
};

/** Enrichit un intervenant avec des informations Qualiopi (fallbacks inclus). */
export function enrichInstructors(
  detail: TrainingCourseDetail,
  course: TrainingCoursePublic,
): EnrichedInstructor[] {
  const domain = course.domain?.trim();
  return detail.trainers.map((trainer) => {
    const expertises = trainer.specialty
      ? trainer.specialty.split(/[·,/]/).map((s) => s.trim()).filter(Boolean)
      : [];
    return {
      id: trainer.id,
      name: trainer.name,
      role: trainer.role,
      photoUrl: trainer.photoUrl,
      fonction: trainer.specialty || "Formateur expert Byound",
      expertises: expertises.length ? expertises : ["Pédagogie", "Accompagnement professionnel"],
      years: "10+ ans d'expérience",
      certifications: ["Formateur certifié Byound"],
      openBadges: ["Open Badge Byound"],
      domaines: domain ? [domain] : ["Développement des compétences"],
    };
  });
}
