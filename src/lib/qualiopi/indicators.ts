/**
 * Référentiel Qualiopi — constante unique (32 indicateurs, 7 critères).
 * Intitulés courts pour l’UI ; summary = rédaction guide (à valider).
 */

export type QualiopiActivityKey =
  | "of"
  | "cfa"
  | "vae"
  | "bilan"
  | "certifying"
  | "pfst";

export type QualiopiIndicatorDef = {
  id: number;
  criterionId: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  shortTitle: string;
  summary: string;
  /**
   * null = commun à tous les prestataires du profil.
   * sinon : applicable si au moins une activité listée est active.
   */
  requiredActivities: QualiopiActivityKey[] | null;
  /** Tag UI (ex. CFA) quand l’indicateur est propre à l’apprentissage. */
  scopeTag?: "CFA" | "Certifiant" | "PFST" | "VAE";
};

export const QUALIOPI_CRITERION_NAMES: Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string> = {
  1: "Information du public",
  2: "Objectifs et adaptation des prestations",
  3: "Accueil, suivi et évaluation",
  4: "Moyens pédagogiques et techniques",
  5: "Qualification des personnels",
  6: "Environnement professionnel",
  7: "Appréciations et réclamations",
};

export const QUALIOPI_INDICATORS: QualiopiIndicatorDef[] = [
  {
    id: 1,
    criterionId: 1,
    shortTitle: "Information publique accessible et vérifiable",
    summary:
      "Le prestataire diffuse une information accessible, détaillée et vérifiable sur les prestations (prérequis, objectifs, durée, modalités, tarifs, accessibilité handicap…), sans mention trompeuse.",
    requiredActivities: null,
  },
  {
    id: 2,
    criterionId: 1,
    shortTitle: "Indicateurs de résultats diffusés",
    summary:
      "Le prestataire diffuse des indicateurs de résultats adaptés, avec modalités de calcul transparentes.",
    requiredActivities: null,
  },
  {
    id: 3,
    criterionId: 1,
    shortTitle: "Taux d’obtention des certifications",
    summary:
      "Pour les prestations conduisant à une certification professionnelle : taux d’obtention, blocs, équivalences, passerelles, débouchés.",
    requiredActivities: ["certifying"],
    scopeTag: "Certifiant",
  },
  {
    id: 4,
    criterionId: 2,
    shortTitle: "Analyse du besoin",
    summary: "Le prestataire analyse le besoin du bénéficiaire en lien avec l’entreprise et/ou le financeur.",
    requiredActivities: null,
  },
  {
    id: 5,
    criterionId: 2,
    shortTitle: "Objectifs opérationnels et évaluables",
    summary: "Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",
    requiredActivities: null,
  },
  {
    id: 6,
    criterionId: 2,
    shortTitle: "Contenus et modalités adaptés",
    summary:
      "Le prestataire établit les contenus et modalités de mise en œuvre adaptés aux objectifs et aux publics.",
    requiredActivities: null,
  },
  {
    id: 7,
    criterionId: 2,
    shortTitle: "Adéquation aux exigences de certification",
    summary:
      "Pour une certification professionnelle : adéquation des contenus aux exigences de la certification visée.",
    requiredActivities: ["certifying"],
    scopeTag: "Certifiant",
  },
  {
    id: 8,
    criterionId: 2,
    shortTitle: "Positionnement et évaluation à l’entrée",
    summary:
      "Le prestataire détermine les procédures de positionnement et d’évaluation des acquis à l’entrée.",
    requiredActivities: null,
  },
  {
    id: 9,
    criterionId: 3,
    shortTitle: "Information sur le déroulement",
    summary: "Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.",
    requiredActivities: null,
  },
  {
    id: 10,
    criterionId: 3,
    shortTitle: "Mise en œuvre et adaptation aux publics",
    summary:
      "Le prestataire met en œuvre et adapte la prestation, l’accompagnement et le suivi aux publics bénéficiaires.",
    requiredActivities: null,
  },
  {
    id: 11,
    criterionId: 3,
    shortTitle: "Évaluation de l’atteinte des objectifs",
    summary: "Le prestataire évalue l’atteinte par les publics bénéficiaires des objectifs de la prestation.",
    requiredActivities: null,
  },
  {
    id: 12,
    criterionId: 3,
    shortTitle: "Engagement, ruptures et signalements VHD",
    summary:
      "Mesures d’engagement et de prévention des ruptures ; prévention et traitement des violences, harcèlement et discriminations.",
    requiredActivities: null,
  },
  {
    id: 13,
    criterionId: 3,
    shortTitle: "Alternance centre / entreprise",
    summary:
      "Pour l’alternance : anticipation des missions et coordination des apprentissages centre / entreprise.",
    requiredActivities: ["cfa"],
    scopeTag: "CFA",
  },
  {
    id: 14,
    criterionId: 3,
    shortTitle: "Accompagnement socio-professionnel",
    summary:
      "Accompagnement socio-professionnel, éducatif et citoyenneté ; traitement sans délai des ruptures liées à des difficultés ou discriminations.",
    requiredActivities: ["cfa"],
    scopeTag: "CFA",
  },
  {
    id: 15,
    criterionId: 3,
    shortTitle: "Droits et devoirs des apprentis",
    summary:
      "Information des apprentis sur leurs droits/devoirs, santé-sécurité, signalements et médiateur de l’apprentissage.",
    requiredActivities: ["cfa"],
    scopeTag: "CFA",
  },
  {
    id: 16,
    criterionId: 3,
    shortTitle: "Présentation à la certification",
    summary:
      "Conditions de présentation à la certification conformes aux exigences de l’autorité de certification.",
    requiredActivities: ["certifying"],
    scopeTag: "Certifiant",
  },
  {
    id: 17,
    criterionId: 4,
    shortTitle: "Moyens humains et techniques",
    summary: "Moyens humains et techniques adaptés et environnement approprié.",
    requiredActivities: null,
  },
  {
    id: 18,
    criterionId: 4,
    shortTitle: "Coordination des intervenants",
    summary: "Mobilisation et coordination des intervenants internes et/ou externes.",
    requiredActivities: null,
  },
  {
    id: 19,
    criterionId: 4,
    shortTitle: "Ressources et suivi distanciel",
    summary:
      "Ressources pédagogiques ; vérification du suivi à distance ; référent pédagogique au-delà d’un seuil d’intervenants.",
    requiredActivities: null,
  },
  {
    id: 20,
    criterionId: 4,
    shortTitle: "Mobilité, handicap et gouvernance CFA",
    summary:
      "Personnel mobilité, référent handicap, conseil de perfectionnement et pilotage de la formation (apprentissage).",
    requiredActivities: ["cfa"],
    scopeTag: "CFA",
  },
  {
    id: 21,
    criterionId: 5,
    shortTitle: "Compétences des intervenants",
    summary: "Détermination, mobilisation et évaluation des compétences des intervenants.",
    requiredActivities: null,
  },
  {
    id: 22,
    criterionId: 5,
    shortTitle: "Développement des compétences des salariés",
    summary: "Entretien et développement des compétences des salariés adaptés aux prestations.",
    requiredActivities: null,
  },
  {
    id: 23,
    criterionId: 6,
    shortTitle: "Veille légale et réglementaire",
    summary: "Veille légale et réglementaire sur la formation professionnelle, exploitée.",
    requiredActivities: null,
  },
  {
    id: 24,
    criterionId: 6,
    shortTitle: "Veille compétences et métiers",
    summary: "Veille sur les évolutions des compétences, métiers et emplois, exploitée.",
    requiredActivities: null,
  },
  {
    id: 25,
    criterionId: 6,
    shortTitle: "Veille innovations pédagogiques",
    summary: "Veille sur les innovations pédagogiques et technologiques, exploitée.",
    requiredActivities: null,
  },
  {
    id: 26,
    criterionId: 6,
    shortTitle: "Accueil et orientation handicap",
    summary:
      "Mobilisation des expertises, outils et réseaux pour accueillir, accompagner ou orienter les publics en situation de handicap.",
    requiredActivities: null,
  },
  {
    id: 27,
    criterionId: 6,
    shortTitle: "Sous-traitance et portage salarial",
    summary:
      "Conformité au référentiel et traçabilité dans les contrats de sous-traitance / portage.",
    requiredActivities: null,
  },
  {
    id: 28,
    criterionId: 6,
    shortTitle: "PFST et partenaires entreprise",
    summary:
      "Périodes de formation en situation de travail : réseau de partenaires et ingénierie co-construite.",
    requiredActivities: ["pfst"],
    scopeTag: "PFST",
  },
  {
    id: 29,
    criterionId: 6,
    shortTitle: "Insertion et poursuite d’études",
    summary:
      "Actions concourant à l’insertion professionnelle ou la poursuite d’études (apprentissage).",
    requiredActivities: ["cfa"],
    scopeTag: "CFA",
  },
  {
    id: 30,
    criterionId: 7,
    shortTitle: "Recueil des appréciations",
    summary:
      "Recueil des appréciations des parties prenantes (bénéficiaires, financeurs, équipes, entreprises).",
    requiredActivities: null,
  },
  {
    id: 31,
    criterionId: 7,
    shortTitle: "Traitement des réclamations",
    summary: "Modalités de traitement des difficultés, réclamations et aléas en cours de prestation.",
    requiredActivities: null,
  },
  {
    id: 32,
    criterionId: 7,
    shortTitle: "Amélioration continue et analyse des risques",
    summary:
      "Mesures d’amélioration continue à partir des appréciations et réclamations, et analyse des risques qualité.",
    requiredActivities: null,
  },
];

export const QUALIOPI_INDICATOR_COUNT = QUALIOPI_INDICATORS.length; // 32

export function indicatorsByCriterion(criterionId: number) {
  return QUALIOPI_INDICATORS.filter((i) => i.criterionId === criterionId);
}

export function indicatorById(id: number) {
  return QUALIOPI_INDICATORS.find((i) => i.id === id) ?? null;
}
