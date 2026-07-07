/**
 * Contenu Qualiopi & diagnostic EDGE pour la page formation B2B.
 * Dérive un contenu premium à partir des données existantes, avec des
 * fallbacks conformes Qualiopi lorsque la donnée n'est pas encore saisie.
 */

import type { TrainingCourseDetail } from "@/lib/training-courses/build-detail";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";

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
    description: "EDGE propose uniquement les formations réellement utiles.",
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
  { title: "Suivi des compétences", description: "EDGE mesure la progression dans le temps." },
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
  "IA EDGE",
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
    "Positionnement initial EDGE",
    "Quiz intermédiaires",
    "Cas pratiques",
    "Exercices",
    "Mise en situation",
    "Évaluation finale",
    "Validation des compétences",
    "Attribution d'un Open Badge EDGE",
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
    certification: "Badge EDGE",
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
  const modalites = detail.formatsLabel || "Présentiel · Distanciel · Blended";
  const publicConcerne = detail.audience.length
    ? detail.audience.join(" · ")
    : "Collaborateurs et managers concernés par la montée en compétences.";

  return [
    { label: "Public concerné", value: publicConcerne, wide: true },
    { label: "Prérequis", value: course.prerequisites || "Aucun prérequis spécifique." },
    { label: "Durée", value: course.duration || "Sur mesure selon le diagnostic." },
    { label: "Modalités", value: modalites },
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
    { label: "Contact référent", value: "Votre conseiller pédagogique EDGE." },
    {
      label: "Référent handicap",
      value: "referent-handicap@edgebs.fr — étude personnalisée de chaque situation.",
      wide: true,
    },
  ];
}

export type QualityIndicator = {
  label: string;
  value: string | null;
};

/**
 * Indicateurs qualité. Renvoie `available: false` tant qu'aucun volume
 * statistiquement représentatif n'est disponible.
 */
export function buildQualityIndicators(): {
  available: boolean;
  fallbackMessage: string;
  indicators: QualityIndicator[];
} {
  const indicators: QualityIndicator[] = [
    { label: "Taux de satisfaction", value: null },
    { label: "Taux de réussite", value: null },
    { label: "Taux de recommandation", value: null },
    { label: "Taux de complétion", value: null },
    { label: "Apprenants formés", value: null },
  ];
  const available = indicators.some((i) => i.value != null);
  return {
    available,
    fallbackMessage:
      "Les indicateurs seront publiés dès qu'un volume statistiquement représentatif sera atteint.",
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
      fonction: trainer.specialty || "Formateur expert EDGE",
      expertises: expertises.length ? expertises : ["Pédagogie", "Accompagnement professionnel"],
      years: "10+ ans d'expérience",
      certifications: ["Formateur certifié EDGE"],
      openBadges: ["Open Badge EDGE"],
      domaines: domain ? [domain] : ["Développement des compétences"],
    };
  });
}
