/**
 * Contenu Qualiopi & diagnostic Byound pour la page formation B2B.
 * Dérive un contenu premium à partir des données existantes, avec des
 * fallbacks conformes Qualiopi lorsque la donnée n'est pas encore saisie.
 */

import type { TrainingCourseDetail } from "@/lib/training-courses/build-detail";
import type { TrainingCoursePublic } from "@/lib/training-courses/types";
import {
  QUALIOPI_RESULTS_FALLBACK,
  formatPublicTariffFaqAnswer,
  formatQualiopiTariff,
  pedagogicalModalityLabel,
  resolveResultsMethod,
} from "@/lib/training-courses/qualiopi-fiche";
import {
  resolveContactReferent,
  resolveHandicapReferent,
} from "@/lib/training-courses/public-referents";
import { buildPublicRecognition } from "@/lib/training-courses/public-recognition";
import type { TrainingCourseFaqItem } from "@/lib/training-courses/types";
import {
  QUALIOPI_ACCESSIBILITY_COPY,
  QUALIOPI_COMPLAINTS_COPY,
  QUALIOPI_FINANCING_FAQ_ANSWER,
  QUALIOPI_SUCCESS_RATE_METHOD_BASE,
  resolvePublicAccessDelaysCopy,
  resolvePublicFinancingCopy,
  resolveSuccessRateMethod,
  sanitizePublicBrandCopy,
} from "@/lib/qualiopi/public-copy";

export type DiagnosticStep = {
  title: string;
  description: string;
};

/** Frise « Chaque parcours débute par un diagnostic ». */
export const DIAGNOSTIC_STEPS: DiagnosticStep[] = [
  {
    title: "Évaluation des aptitudes",
    description: "Repérage des aptitudes et des leviers de progression du collaborateur.",
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

/** Méthodes pédagogiques = uniquement la méthodologie saisie en CMS (/super). Pas de liste mock. */
export function buildPedagogicalMethods(detail: TrainingCourseDetail): string[] {
  return detail.methodology
    .map((m) => sanitizePublicBrandCopy(String(m ?? "").trim()))
    .filter(Boolean);
}

/**
 * FAQ publique : tarif / prise en charge dérivés des champs fiche ;
 * marque Beyond → Byound ; jamais OPCO / Qualiopi / facturation par collaborateur.
 */
export function resolvePublicFaqItems(
  course: TrainingCoursePublic,
  faq: TrainingCourseFaqItem[] | null | undefined,
): TrainingCourseFaqItem[] {
  const items = Array.isArray(faq) ? faq : [];
  return items.map((item) => {
    const q = sanitizePublicBrandCopy(String(item.q ?? "").trim());
    let a = sanitizePublicBrandCopy(String(item.a ?? "").trim());
    if (/quel est le tarif\b/i.test(q) || /facturé par collaborateur|abonnement\s+byound/i.test(a)) {
      a = formatPublicTariffFaqAnswer(course);
    } else if (
      /prise en charge|comment (la |le )?financ/i.test(q) ||
      /\bopco\b|\bqualiopi\b/i.test(a)
    ) {
      a = QUALIOPI_FINANCING_FAQ_ANSWER;
    }
    return { q, a };
  });
}

/**
 * Modalités d'évaluation — pas de liste mock.
 * Tant qu’aucun champ CMS dédié n’existe, on n’affiche rien sur le front.
 */
export function buildEvaluationModalities(_detail?: TrainingCourseDetail): string[] {
  return [];
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
export function buildSkillLevelRows(
  detail: TrainingCourseDetail,
  recognitionLabel?: string | null,
): SkillLevelRow[] {
  const recognition =
    String(recognitionLabel ?? "").trim() ||
    (detail.badgeLabel ? detail.badgeLabel : "Attestation de fin de formation");
  return detail.competences.map((skill, index) => ({
    skill,
    level: index === 0 ? 5 : 4,
    evaluation: EVALUATION_MODES[index % EVALUATION_MODES.length],
    recognition,
  }));
}

export type PedagogicalObjectivesBlock = {
  intro: string;
  objectives: string[];
};

const ISSUE_PREFIX_RE =
  /^à l['’]issue de (cette |la )?formation[,:\s]*/i;
const CAPABLE_PREFIX_RE =
  /^(le |la |l['’])?(participant(e)?|stagiaire) sera capable de\s*/i;

/** Objectifs pédagogiques — intro unique, sans doublon sur chaque item. */
export function buildPedagogicalObjectives(detail: TrainingCourseDetail): PedagogicalObjectivesBlock {
  const objectives = detail.objectives
    .map((raw) => {
      let o = String(raw ?? "").trim();
      o = o.replace(ISSUE_PREFIX_RE, "").replace(CAPABLE_PREFIX_RE, "").trim();
      // Capitalise la première lettre après nettoyage.
      if (o && o[0] === o[0].toLowerCase()) {
        o = o.charAt(0).toUpperCase() + o.slice(1);
      }
      return o;
    })
    .filter(Boolean);
  return {
    intro: "À l'issue de cette formation, le participant sera capable de :",
    objectives,
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
  opts?: { qualiopiCertified?: boolean; showOpcoPublic?: boolean },
): QualiopiInfoItem[] {
  const modalityDetail = String(course.pedagogical_modality_detail ?? "").trim();
  const modalityShort =
    pedagogicalModalityLabel(course.pedagogical_modality) ||
    detail.formatsLabel ||
    null;
  // Champ « Modalités pédagogiques » = détail saisi ; sinon libellé court / formats.
  const modalites = modalityDetail || modalityShort || "À rédiger";
  const recognition = buildPublicRecognition(course, {
    badgeMetaName: detail.badgeLabel,
  });
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
  const contactReferent = resolveContactReferent(course.contact_referent);
  const handicapReferent = resolveHandicapReferent(course.handicap_referent);
  const financing = resolvePublicFinancingCopy(course.financing_modalities, {
    showOpcoPublic: opts?.showOpcoPublic === true,
    qualiopiCertified: Boolean(opts?.qualiopiCertified),
  });

  return [
    { label: "Public concerné", value: publicConcerne, wide: true },
    { label: "Prérequis", value: course.prerequisites || "Aucun prérequis spécifique." },
    { label: "Durée", value: course.duration || "Sur mesure selon le diagnostic." },
    { label: "Modalités pédagogiques", value: modalites, wide: true },
    { label: "Type de reconnaissance", value: recognition.text, wide: true },
    {
      label: "Modalités de financement",
      value: financing,
      wide: true,
    },
    { label: "Tarif", value: formatQualiopiTariff(course) },
    {
      label: "Effectif",
      value: `Jusqu'à ${detail.maxIntraParticipants} participants (intra).`,
    },
    {
      label: "Accessibilité handicap",
      value: QUALIOPI_ACCESSIBILITY_COPY,
      wide: true,
    },
    {
      label: "Délais d'accès",
      value: resolvePublicAccessDelaysCopy(course.pedagogical_modality),
      wide: true,
    },
    { label: "Contact référent", value: contactReferent, wide: true },
    {
      label: "Réclamations",
      value: QUALIOPI_COMPLAINTS_COPY,
      wide: true,
    },
    {
      label: "Référent handicap",
      value: handicapReferent,
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
  success: QUALIOPI_SUCCESS_RATE_METHOD_BASE,
  dropout: "% de participants n'ayant pas terminé la formation.",
  recommendation: "% de répondants qui recommanderaient la formation.",
  completion: "% d'heures réalisées sur le nombre d'heures prévues.",
};

export function qualityIndicatorMethods(hasOpenBadge: boolean): Record<QualityIndicatorKey, string> {
  return {
    ...QUALITY_INDICATOR_METHODS,
    success: resolveSuccessRateMethod(hasOpenBadge),
  };
}

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
  /** Si false : aucune mention Open Badge dans la méthode « taux de réussite ». */
  hasOpenBadge?: boolean;
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
  const methods = qualityIndicatorMethods(Boolean(input?.hasOpenBadge));
  const keys = Object.keys(methods) as QualityIndicatorKey[];
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
      method: methods[key],
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
      // Pas de mock Open Badge : uniquement si des badges réels sont saisis plus tard.
      openBadges: [],
      domaines: domain ? [domain] : ["Développement des compétences"],
    };
  });
}
