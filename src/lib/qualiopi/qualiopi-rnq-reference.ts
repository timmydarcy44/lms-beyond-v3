/** Référentiel national qualité (Qualiopi) — Guide de lecture V.10 — 7 critères, 33 indicateurs. */

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
    title:
      "Les conditions d’information du public sur les prestations proposées, les délais pour y accéder et les résultats obtenus",
    indicators: [
      {
        id: 1,
        title: "Indicateur 1",
        summary:
          "Le prestataire diffuse une information accessible au public, détaillée et vérifiable sur les prestations proposées : prérequis, objectifs, type de reconnaissance, durée, modalités pédagogiques et de financements, délais d’accès, tarifs, contacts, méthodes mobilisées et modalités d’évaluation, accessibilité aux personnes en situation de handicap. Sa communication ne comporte aucune mention de nature à induire le public en erreur.",
        productHint: "Pages formations B2B / fiches catalogue",
      },
      {
        id: 2,
        title: "Indicateur 2",
        summary:
          "Le prestataire diffuse des indicateurs de résultats adaptés à la nature des prestations mises en œuvre et des publics accueillis en précisant de manière transparente leurs modalités de calcul ou en s’appuyant sur des dispositifs existants.",
        productHint: "Indicateurs Qualiopi sur les pages formation",
      },
      {
        id: 3,
        title: "Indicateur 3",
        summary:
          "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il informe sur les taux d’obtention des certifications préparées, les possibilités de valider un/ou des blocs de compétences, ainsi que sur les équivalences, passerelles, suites de parcours.",
      },
    ],
  },
  {
    id: 2,
    title:
      "L’identification précise des objectifs des prestations proposées et l’adaptation de ces prestations aux publics bénéficiaires lors de la conception des prestations",
    indicators: [
      {
        id: 4,
        title: "Indicateur 4",
        summary:
          "Le prestataire analyse le besoin du bénéficiaire en lien avec l’entreprise et/ou le financeur concerné(s).",
        productHint: "Pipeline B2B / diagnostics / positionnement",
      },
      {
        id: 5,
        title: "Indicateur 5",
        summary: "Le prestataire définit les objectifs opérationnels et évaluables de la prestation.",
        productHint: "Studio formations / objectifs pédagogiques",
      },
      {
        id: 6,
        title: "Indicateur 6",
        summary:
          "Le prestataire établit les contenus et les modalités de mise en œuvre de la prestation, adaptés aux objectifs définis et aux publics bénéficiaires.",
        productHint: "Fiches catalogue / parcours LMS",
      },
      {
        id: 7,
        title: "Indicateur 7",
        summary:
          "Lorsque le prestataire met en œuvre des prestations conduisant à une certification professionnelle, il s’assure de l’adéquation du ou des contenus de la prestation aux exigences de la certification visée.",
      },
      {
        id: 8,
        title: "Indicateur 8",
        summary:
          "Le prestataire détermine les procédures de positionnement et d’évaluation des acquis à l’entrée de la prestation.",
        productHint: "Diagnostics / positionnement entrée",
      },
    ],
  },
  {
    id: 3,
    title:
      "L’adaptation aux publics bénéficiaires des prestations et des modalités d’accueil, d’accompagnement, de suivi et d’évaluation mises en œuvre",
    indicators: [
      {
        id: 9,
        title: "Indicateur 9",
        summary: "Le prestataire informe les publics bénéficiaires des conditions de déroulement de la prestation.",
        productHint: "Pack convention / règlement / livret",
      },
      {
        id: 10,
        title: "Indicateur 10",
        summary:
          "Le prestataire met en œuvre et adapte la prestation, l’accompagnement et le suivi aux publics bénéficiaires.",
        productHint: "Livret d’accueil + aménagements handicap",
      },
      {
        id: 11,
        title: "Indicateur 11",
        summary: "Le prestataire évalue l’atteinte par les publics bénéficiaires des objectifs de la prestation.",
        productHint: "Évaluations / badges / clôture session",
      },
      {
        id: 12,
        title: "Indicateur 12",
        summary:
          "Le prestataire décrit et met en œuvre les mesures pour favoriser l’engagement des bénéficiaires et prévenir les ruptures de parcours. Il s’assure de la prévention et du traitement de toute situation de violence, dont les violences sexistes et sexuelles, de harcèlement ou de discrimination dans le cadre de leur formation.",
        productHint: "Engagement LMS / abandons / signalements",
      },
      {
        id: 13,
        title: "Indicateur 13",
        summary:
          "Pour les formations en alternance, le prestataire, en lien avec l’entreprise, anticipe avec l’apprenant les missions confiées et assure la coordination et la progressivité des apprentissages réalisés en centre de formation et en entreprise.",
      },
      {
        id: 14,
        title: "Indicateur 14",
        summary:
          "Le prestataire met en œuvre un accompagnement socio-professionnel, éducatif et relatif à l’exercice de la citoyenneté. Il dispose d’une procédure de traitement sans délai des situations de rupture liées à des difficultés, violences ou discriminations subies par l’apprenant.",
      },
      {
        id: 15,
        title: "Indicateur 15",
        summary:
          "Le prestataire informe les apprentis de leurs droits et devoirs ainsi que des règles applicables en matière de santé et de sécurité en milieu professionnel, et des dispositifs de signalement des situations de violences, harcèlement et discriminations.",
      },
      {
        id: 16,
        title: "Indicateur 16",
        summary:
          "Lorsque le prestataire met en œuvre des formations conduisant à une certification professionnelle, il s’assure que les conditions de présentation des bénéficiaires à la certification respectent les exigences formelles de l’autorité de certification.",
      },
    ],
  },
  {
    id: 4,
    title: "L’adéquation des moyens pédagogiques, techniques et d’encadrement aux prestations mises en œuvre",
    indicators: [
      {
        id: 17,
        title: "Indicateur 17",
        summary:
          "Le prestataire met à disposition ou s’assure de la mise à disposition des moyens humains et techniques adaptés et d’un environnement approprié (conditions, locaux, équipements, plateaux techniques…).",
        productHint: "Process docs → Moyens",
      },
      {
        id: 18,
        title: "Indicateur 18",
        summary:
          "Le prestataire mobilise et coordonne les différents intervenants internes et/ou externes (pédagogiques, administratifs, logistiques, commerciaux…).",
        productHint: "Sessions / formateurs / experts",
      },
      {
        id: 19,
        title: "Indicateur 19",
        summary:
          "Le prestataire met à disposition du bénéficiaire des ressources pédagogiques et permet à celui-ci de se les approprier. Lorsque des modules pédagogiques sont réalisés à distance, le prestataire vérifie l’effectivité de leur suivi par les apprenants. Au-delà d’un nombre d’intervenants par formation, le prestataire dispose d’un référent pédagogique par formation.",
        productHint: "Suivi LMS distanciel / multi-intervenants",
      },
      {
        id: 20,
        title: "Indicateur 20",
        summary:
          "Le prestataire dispose d’un personnel dédié à l’appui à la mobilité nationale et internationale, d’un référent handicap et d’un conseil de perfectionnement (spécifique apprentissage).",
      },
    ],
  },
  {
    id: 5,
    title:
      "La qualification et le développement des connaissances et compétences des personnels chargés de mettre en œuvre les prestations",
    indicators: [
      {
        id: 21,
        title: "Indicateur 21",
        summary:
          "Le prestataire détermine, mobilise et évalue les compétences des différents intervenants internes et/ou externes, adaptées aux prestations.",
        productHint: "Fiches experts validées",
      },
      {
        id: 22,
        title: "Indicateur 22",
        summary:
          "Le prestataire entretient et développe les compétences de ses salariés, adaptées aux prestations qu’il délivre.",
        productHint: "Plans formateurs",
      },
    ],
  },
  {
    id: 6,
    title: "L’inscription et l’investissement du prestataire dans son environnement professionnel",
    indicators: [
      {
        id: 23,
        title: "Indicateur 23",
        summary:
          "Le prestataire réalise une veille légale et réglementaire sur le champ de la formation professionnelle et en exploite les enseignements.",
        productHint: "Veilles → réglementaire",
      },
      {
        id: 24,
        title: "Indicateur 24",
        summary:
          "Le prestataire réalise une veille sur les évolutions des compétences, des métiers et des emplois dans ses secteurs d’intervention et en exploite les enseignements.",
        productHint: "Veilles → métier",
      },
      {
        id: 25,
        title: "Indicateur 25",
        summary:
          "Le prestataire réalise une veille sur les innovations pédagogiques et technologiques permettant une évolution de ses prestations et en exploite les enseignements.",
        productHint: "Veilles → pédagogie",
      },
      {
        id: 26,
        title: "Indicateur 26",
        summary:
          "Le prestataire mobilise les expertises, outils et réseaux nécessaires pour accueillir, accompagner/former ou orienter les publics en situation de handicap.",
        productHint: "Handicap → référente / annuaire partenaires",
      },
      {
        id: 27,
        title: "Indicateur 27",
        summary:
          "Lorsque le prestataire fait appel à la sous-traitance ou au portage salarial, il s’assure du respect de la conformité au présent référentiel et en assure la traçabilité dans les contrats de sous-traitance.",
        productHint: "Formateurs → statut emploi / contrats SST",
      },
      {
        id: 28,
        title: "Indicateur 28",
        summary:
          "Lorsque les prestations dispensées au bénéficiaire comprennent des périodes de formation en situation de travail, le prestataire mobilise son réseau de partenaires socio-économiques pour co-construire l’ingénierie de formation et favoriser l’accueil en entreprise.",
      },
      {
        id: 29,
        title: "Indicateur 29",
        summary:
          "Le prestataire développe des actions qui concourent à l’insertion professionnelle ou la poursuite d’étude par la voie de l’apprentissage ou par toute autre voie permettant de développer leurs connaissances et leurs compétences.",
      },
    ],
  },
  {
    id: 7,
    title:
      "Le recueil et la prise en compte des appréciations et des réclamations formulées par les parties prenantes aux prestations délivrées",
    indicators: [
      {
        id: 30,
        title: "Indicateur 30",
        summary:
          "Le prestataire recueille les appréciations des parties prenantes : bénéficiaires, financeurs (le cas échéant), équipes pédagogiques et entreprises concernées.",
        productHint: "Questionnaire satisfaction fin de session",
      },
      {
        id: 31,
        title: "Indicateur 31",
        summary:
          "Le prestataire met en œuvre des modalités de traitement des difficultés rencontrées par les parties prenantes, des réclamations exprimées par ces dernières, des aléas survenus en cours de prestation.",
        productHint: "Qualité → réclamations",
      },
      {
        id: 32,
        title: "Indicateur 32",
        summary:
          "Le prestataire met en œuvre des mesures d’amélioration continue à partir de l’analyse des appréciations et des réclamations, ainsi qu’une analyse des risques sur la qualité des formations délivrées.",
        productHint: "Risques + PAQ",
      },
      {
        id: 33,
        title: "Indicateur 33",
        summary:
          "Le prestataire met en place un dispositif d’évaluation des contenus et des enseignements par les apprenants, distinct du recueil général de satisfaction (spécifique apprentissage / CFA).",
      },
    ],
  },
];

export const QUALIOPI_INDICATOR_COUNT = QUALIOPI_RNQ_CRITERIA.reduce(
  (n, c) => n + c.indicators.length,
  0,
);
