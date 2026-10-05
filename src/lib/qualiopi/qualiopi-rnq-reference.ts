/** Référentiel national qualité (Qualiopi) — 7 critères, 32 indicateurs. */

export type QualiopiIndicator = {
  id: number;
  title: string;
  summary: string;
  /** Lien ou ancre produit Byound (optionnel). */
  productHint?: string;
};

export type QualiopiCriterion = {
  id: number;
  title: string;
  indicators: QualiopiIndicator[];
};

export const QUALIOPI_RNQ_CRITERIA: QualiopiCriterion[] = [
  {
    id: 1,
    title: "Les conditions d’information du public sur les prestations proposées, les délais pour y accéder et les résultats obtenus",
    indicators: [
      {
        id: 1,
        title: "Indicateur 1",
        summary:
          "Le public dispose d’une information accessible, détaillée et vérifiable (prérequis, objectifs, durée, modalités et délais d’accès, tarifs, contacts, méthodes, accessibilité aux personnes handicapées).",
        productHint: "Pages formations B2B / fiches catalogue",
      },
      {
        id: 2,
        title: "Indicateur 2",
        summary:
          "Des indicateurs de résultats adaptés à la nature des prestations et des publics sont définis, collectés et communiqués.",
        productHint: "Indicateurs Qualiopi sur les pages formation",
      },
      {
        id: 3,
        title: "Indicateur 3",
        summary:
          "Pour les certifications professionnelles : taux d’obtention, équivalences, passerelles, débouchés.",
      },
    ],
  },
  {
    id: 2,
    title: "L’identification précise des objectifs des prestations proposées et l’adaptation aux publics bénéficiaires",
    indicators: [
      {
        id: 4,
        title: "Indicateur 4",
        summary: "Les objectifs opérationnels et évaluables des prestations sont définis.",
        productHint: "Studio formations / objectifs pédagogiques",
      },
      {
        id: 5,
        title: "Indicateur 5",
        summary: "Les contenus et modalités sont adaptés aux publics visés.",
      },
      {
        id: 6,
        title: "Indicateur 6",
        summary: "Les prestations sont conçues en fonction des besoins identifiés.",
        productHint: "Diagnostics Byound / positionnement",
      },
      {
        id: 7,
        title: "Indicateur 7",
        summary: "Pour les certifications : adéquation aux répertoires nationaux (RNCP, RS).",
      },
      {
        id: 8,
        title: "Indicateur 8",
        summary: "Les modalités d’évaluation des acquis sont définies.",
        productHint: "Modalités d’évaluation (Qualiopi content formations)",
      },
    ],
  },
  {
    id: 3,
    title: "L’adaptation aux publics des prestations et des modalités d’accueil, d’accompagnement, de suivi et d’évaluation",
    indicators: [
      { id: 9, title: "Indicateur 9", summary: "Information sur les conditions de déroulement de la prestation." },
      {
        id: 10,
        title: "Indicateur 10",
        summary: "Mise en œuvre de l’accueil et de l’accompagnement.",
        productHint: "Livret d’accueil (coffre Qualiopi)",
      },
      {
        id: 11,
        title: "Indicateur 11",
        summary: "Suivi de la progression des bénéficiaires.",
        productHint: "LMS / progression apprenant",
      },
      {
        id: 12,
        title: "Indicateur 12",
        summary: "Accompagnement vers la certification ou l’emploi.",
      },
      { id: 13, title: "Indicateur 13", summary: "Adaptation des parcours et individualisation." },
      { id: 14, title: "Indicateur 14", summary: "Mobilisation des ressources pédagogiques nécessaires." },
      {
        id: 15,
        title: "Indicateur 15",
        summary: "Suivi de la réalisation des prestations (feuilles d’émargement, assiduité…).",
        productHint: "Émargements horodatés (section ci-dessous)",
      },
      {
        id: 16,
        title: "Indicateur 16",
        summary: "Évaluation des acquis en fin de prestation.",
        productHint: "Open Badges / validations",
      },
    ],
  },
  {
    id: 4,
    title: "L’adéquation des moyens pédagogiques, techniques et d’encadrement",
    indicators: [
      { id: 17, title: "Indicateur 17", summary: "Moyens humains et techniques adaptés (locaux, outils numériques…)." },
      { id: 18, title: "Indicateur 18", summary: "Coordination des intervenants internes et externes." },
      { id: 19, title: "Indicateur 19", summary: "Ressources pédagogiques et documentaires mises à disposition." },
      {
        id: 20,
        title: "Indicateur 20",
        summary: "Apprentissage : appui mobilité et handicap.",
      },
    ],
  },
  {
    id: 5,
    title: "La qualification et le développement des compétences des personnels",
    indicators: [
      { id: 21, title: "Indicateur 21", summary: "Compétences requises définies et qualification des intervenants vérifiée." },
      { id: 22, title: "Indicateur 22", summary: "Plan de développement des compétences des salariés." },
    ],
  },
  {
    id: 6,
    title: "L’inscription et l’investissement du prestataire dans son environnement professionnel",
    indicators: [
      { id: 23, title: "Indicateur 23", summary: "Veille légale et réglementaire." },
      { id: 24, title: "Indicateur 24", summary: "Veille compétences, métiers et emplois." },
      { id: 25, title: "Indicateur 25", summary: "Veille innovations pédagogiques et technologiques." },
      { id: 26, title: "Indicateur 26", summary: "Réseaux et experts pour l’accueil du handicap." },
      { id: 27, title: "Indicateur 27", summary: "Gestion de la sous-traitance." },
      { id: 28, title: "Indicateur 28", summary: "Apprentissage : coordination CFA — entreprise — apprenti." },
      { id: 29, title: "Indicateur 29", summary: "Promotion de l’alternance." },
    ],
  },
  {
    id: 7,
    title: "Le recueil et la prise en compte des appréciations et des réclamations",
    indicators: [
      {
        id: 30,
        title: "Indicateur 30",
        summary: "Recueil des appréciations (bénéficiaires, financeurs, équipes, entreprises).",
        productHint: "Questionnaire satisfaction fin de session",
      },
      { id: 31, title: "Indicateur 31", summary: "Processus de traitement des réclamations." },
      {
        id: 32,
        title: "Indicateur 32",
        summary: "Actions d’amélioration continue suite aux retours et réclamations.",
      },
    ],
  },
];

export const QUALIOPI_INDICATOR_COUNT = QUALIOPI_RNQ_CRITERIA.reduce(
  (n, c) => n + c.indicators.length,
  0,
);
