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
  "Présentiel",
  "Distanciel",
  "Blended Learning",
  "Études de cas",
  "Jeux de rôle",
  "Mises en situation",
  "Co-développement",
  "Coaching",
  "Classe virtuelle",
  "Travaux collaboratifs",
  "Supports numériques",
  "IA Byound",
  "NEVO",
];

export function buildPedagogicalMethods(detail: TrainingCourseDetail): string[] {
  const fromCourse = detail.methodology.filter(Boolean);
  const merged = [...fromCourse];
  for (const method of DEFAULT_PEDAGOGICAL_METHODS) {
    if (!merged.some((m) => m.toLowerCase() === method.toLowerCase())) merged.push(method);
  }
  return merged;
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
  certification: string;
};

const EVALUATION_MODES = [
  "Évaluation pratique",
  "Cas pratique",
  "Mise en situation",
  "Quiz + exercice",
];

/** Tableau « Compétences développées » : compétence · niveau · évaluation · certification. */
export function buildSkillLevelRows(detail: TrainingCourseDetail): SkillLevelRow[] {
  return detail.competences.map((skill, index) => ({
    skill,
    level: index === 0 ? 5 : 4,
    evaluation: EVALUATION_MODES[index % EVALUATION_MODES.length],
    certification: "Badge Byound",
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

/** Bloc « Informations » enrichi conforme Qualiopi. */
export function buildQualiopiInfo(
  course: TrainingCoursePublic,
  detail: TrainingCourseDetail,
): QualiopiInfoItem[] {
  const modality =
    pedagogicalModalityLabel(course.pedagogical_modality) ||
    detail.formatsLabel ||
    null;
  const modalityDetail = String(course.pedagogical_modality_detail ?? "").trim();
  const modalites = [modality, modalityDetail].filter(Boolean).join(" — ") ||
    "À rédiger";
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
      value:
        "Formation accessible aux personnes en situation de handicap. Adaptations possibles sur demande.",
      wide: true,
    },
    { label: "Délais d'accès", value: "Accès sous 2 à 4 semaines après validation du diagnostic." },
    { label: "Contact référent", value: "Votre conseiller pédagogique Byound." },
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

export type QualityIndicator = {
  label: string;
  value: string | null;
  method: string;
};

/**
 * Indicateurs qualité. Jamais de valeur fictive.
 * Affiche toujours la méthode de calcul (globale ou surcharge fiche).
 */
export function buildQualityIndicators(input?: {
  ofSettingsMethod?: string | null;
  courseOverride?: string | null;
  /** Valeurs réelles si/quand disponibles — sinon null. */
  values?: Partial<Record<string, string | null>>;
}): {
  available: boolean;
  fallbackMessage: string;
  method: string;
  indicators: QualityIndicator[];
} {
  const method = resolveResultsMethod({
    ofSettingsMethod: input?.ofSettingsMethod,
    courseOverride: input?.courseOverride,
  });
  const values = input?.values ?? {};
  const indicators: QualityIndicator[] = [
    { label: "Taux de satisfaction", value: values.satisfaction ?? null, method },
    { label: "Taux de réussite", value: values.success ?? null, method },
    { label: "Taux d'abandon", value: values.dropout ?? null, method },
    { label: "Taux de recommandation", value: values.recommendation ?? null, method },
    { label: "Taux de complétion", value: values.completion ?? null, method },
  ];
  const available = indicators.some((i) => i.value != null);
  return {
    available,
    fallbackMessage: QUALIOPI_RESULTS_FALLBACK,
    method,
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
