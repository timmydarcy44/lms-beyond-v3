/**
 * Stratégie de Link Juice pour Jessica Contentin
 * Optimisation du maillage interne pour maximiser le référencement
 */

export interface LinkJuiceLink {
  url: string;
  anchor: string;
  context: string;
  priority: "high" | "medium" | "low";
  keywords: string[];
}

// Stratégie de link juice par page
export const LINK_JUICE_STRATEGY: Record<string, LinkJuiceLink[]> = {
  // Page d'accueil - distribue le link juice vers toutes les pages importantes
  home: [
    {
      url: "/specialites/tnd",
      anchor: "Accompagnement TND (troubles DYS, TDA-H)",
      context: "Spécialisé dans l'accompagnement des troubles du neurodéveloppement",
      priority: "high",
      keywords: ["troubles DYS", "TDA-H", "TND", "neurodéveloppement"],
    },
    {
      url: "/specialites/harcelement",
      anchor: "Harcèlement scolaire",
      context: "Accompagnement spécialisé pour les victimes de harcèlement",
      priority: "high",
      keywords: ["harcèlement scolaire", "victime harcèlement"],
    },
    {
      url: "/specialites/confiance-en-soi",
      anchor: "Confiance en soi",
      context: "Développement de l'estime de soi et de la confiance",
      priority: "high",
      keywords: ["confiance en soi", "estime de soi"],
    },
    {
      url: "/consultations",
      anchor: "Prendre rendez-vous",
      context: "Consultations psychopédagogiques à Bretteville sur Odon",
      priority: "high",
      keywords: ["consultation", "rendez-vous", "Bretteville sur Odon"],
    },
    {
      url: "/orientation",
      anchor: "Orientation scolaire et professionnelle",
      context: "Accompagnement à l'orientation avec test soft skills",
      priority: "medium",
      keywords: ["orientation scolaire", "Parcoursup", "soft skills"],
    },
    {
      url: "/ressources",
      anchor: "Ressources psychopédagogiques",
      context: "Contenus et outils accessibles partout en France",
      priority: "medium",
      keywords: ["ressources", "outils", "contenus"],
    },
  ],

  // Page TND - page la plus importante pour le SEO
  "specialites/tnd": [
    {
      url: "/",
      anchor: "Retour à l'accueil",
      context: "Jessica CONTENTIN - Psychopédagogue",
      priority: "low",
      keywords: ["psychopédagogue Caen"],
    },
    {
      url: "/specialites",
      anchor: "Toutes mes spécialités",
      context: "Découvrir tous les domaines d'accompagnement",
      priority: "medium",
      keywords: ["spécialités", "accompagnement"],
    },
    {
      url: "/specialites/harcelement",
      anchor: "Harcèlement scolaire",
      context: "Souvent lié aux troubles DYS et TDA-H",
      priority: "high",
      keywords: ["harcèlement", "difficultés scolaires"],
    },
    {
      url: "/specialites/confiance-en-soi",
      anchor: "Confiance en soi",
      context: "Essentiel pour les enfants avec troubles DYS",
      priority: "high",
      keywords: ["confiance en soi", "estime de soi"],
    },
    {
      url: "/specialites/strategie-apprentissage",
      anchor: "Stratégies d'apprentissage",
      context: "Méthodes adaptées aux troubles DYS",
      priority: "high",
      keywords: ["stratégies apprentissage", "méthodes DYS"],
    },
    {
      url: "/specialites/neuroeducation",
      anchor: "Neuroéducation",
      context: "Approche scientifique pour les troubles DYS",
      priority: "high",
      keywords: ["neuroéducation", "neurosciences"],
    },
    {
      url: "/ressources",
      anchor: "Ressources sur les troubles DYS",
      context: "Outils et contenus pour troubles DYS",
      priority: "high",
      keywords: ["ressources DYS", "outils DYS"],
    },
    {
      url: "/consultations",
      anchor: "Consultation spécialisée TND",
      context: "Prendre rendez-vous pour un accompagnement TND",
      priority: "high",
      keywords: ["consultation TND", "rendez-vous"],
    },
  ],

  // Page Harcèlement scolaire
  "specialites/harcelement": [
    {
      url: "/specialites/tnd",
      anchor: "Accompagnement TND",
      context: "Les troubles DYS peuvent favoriser le harcèlement",
      priority: "high",
      keywords: ["troubles DYS", "TND"],
    },
    {
      url: "/specialites/confiance-en-soi",
      anchor: "Reconstruction de la confiance en soi",
      context: "Essentiel après un harcèlement",
      priority: "high",
      keywords: ["confiance en soi", "reconstruction"],
    },
    {
      url: "/specialites/therapie",
      anchor: "Gestion des émotions",
      context: "Gestion des traumatismes liés au harcèlement",
      priority: "high",
      keywords: ["gestion des émotions", "traumatisme", "émotions"],
    },
    {
      url: "/consultations",
      anchor: "Consultation spécialisée harcèlement",
      context: "Prendre rendez-vous pour un accompagnement",
      priority: "high",
      keywords: ["consultation", "harcèlement"],
    },
    {
      url: "/ressources",
      anchor: "Ressources sur le harcèlement",
      context: "Outils et guides pour parents et enfants",
      priority: "medium",
      keywords: ["ressources", "guides"],
    },
  ],

  // Page Confiance en soi
  "specialites/confiance-en-soi": [
    {
      url: "/specialites/tnd",
      anchor: "Accompagnement TND",
      context: "Les troubles DYS impactent souvent la confiance",
      priority: "high",
      keywords: ["troubles DYS", "TND"],
    },
    {
      url: "/specialites/harcelement",
      anchor: "Harcèlement scolaire",
      context: "Le harcèlement détruit la confiance en soi",
      priority: "high",
      keywords: ["harcèlement", "victime"],
    },
    {
      url: "/specialites/gestion-stress",
      anchor: "Gestion du stress",
      context: "Le stress affecte la confiance en soi",
      priority: "medium",
      keywords: ["stress", "anxiété"],
    },
    {
      url: "/specialites/strategie-apprentissage",
      anchor: "Stratégies d'apprentissage",
      context: "La réussite scolaire renforce la confiance",
      priority: "medium",
      keywords: ["apprentissage", "réussite"],
    },
    {
      url: "/consultations",
      anchor: "Consultation confiance en soi",
      context: "Prendre rendez-vous",
      priority: "high",
      keywords: ["consultation", "rendez-vous"],
    },
  ],

  // Page Orientation
  "specialites/orientation": [
    {
      url: "/orientation",
      anchor: "Accompagnement orientation complet",
      context: "Processus d'orientation en 6 étapes",
      priority: "high",
      keywords: ["orientation", "Parcoursup"],
    },
    {
      url: "/specialites/confiance-en-soi",
      anchor: "Confiance en soi",
      context: "Essentielle pour faire des choix d'orientation",
      priority: "medium",
      keywords: ["confiance", "choix"],
    },
    {
      url: "/specialites/tests",
      anchor: "Tests de connaissance de soi",
      context: "Bilans pour mieux se connaître",
      priority: "high",
      keywords: ["tests", "bilans", "soft skills"],
    },
    {
      url: "/consultations",
      anchor: "Consultation orientation",
      context: "Prendre rendez-vous",
      priority: "high",
      keywords: ["consultation", "orientation"],
    },
  ],

  // Page Neuroéducation
  "specialites/neuroeducation": [
    {
      url: "/specialites/tnd",
      anchor: "Accompagnement TND",
      context: "La neuroéducation au service des troubles DYS",
      priority: "high",
      keywords: ["TND", "troubles DYS"],
    },
    {
      url: "/specialites/strategie-apprentissage",
      anchor: "Stratégies d'apprentissage",
      context: "Méthodes basées sur les neurosciences",
      priority: "high",
      keywords: ["stratégies", "apprentissage"],
    },
    {
      url: "/ressources",
      anchor: "Ressources neuroéducation",
      context: "Contenus basés sur les neurosciences",
      priority: "medium",
      keywords: ["ressources", "neurosciences"],
    },
    {
      url: "/consultations",
      anchor: "Consultation neuroéducation",
      context: "Prendre rendez-vous",
      priority: "high",
      keywords: ["consultation"],
    },
  ],

  // Page Stratégies d'apprentissage
  "specialites/strategie-apprentissage": [
    {
      url: "/specialites/tnd",
      anchor: "Accompagnement TND",
      context: "Stratégies adaptées aux troubles DYS",
      priority: "high",
      keywords: ["TND", "troubles DYS"],
    },
    {
      url: "/specialites/neuroeducation",
      anchor: "Neuroéducation",
      context: "Approche scientifique de l'apprentissage",
      priority: "high",
      keywords: ["neuroéducation", "neurosciences"],
    },
    {
      url: "/specialites/confiance-en-soi",
      anchor: "Confiance en soi",
      context: "La réussite renforce la confiance",
      priority: "medium",
      keywords: ["confiance", "réussite"],
    },
    {
      url: "/ressources",
      anchor: "Ressources d'apprentissage",
      context: "Outils et méthodes d'apprentissage",
      priority: "medium",
      keywords: ["ressources", "outils"],
    },
  ],
};

// Fonction pour obtenir les liens optimisés pour une page
export function getLinkJuiceLinks(page: string): LinkJuiceLink[] {
  return LINK_JUICE_STRATEGY[page] || [];
}

// Fonction pour obtenir les liens prioritaires (high priority)
export function getHighPriorityLinks(page: string): LinkJuiceLink[] {
  return getLinkJuiceLinks(page).filter(link => link.priority === "high");
}

// Configuration SEO avancée par spécialité
export const SPECIALITY_SEO_CONFIG: Record<string, {
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  contentSections: {
    title: string;
    content: string;
    keywords: string[];
  }[];
}> = {
  "tnd": {
    title: "TDAH, TSA, Troubles DYS et Haut Potentiel — Accompagnement Caen",
    description: "Accompagnement spécialisé des troubles du neurodéveloppement à Caen : TDAH, TSA, DYS, HPI. Stratégies adaptées à l'école, à la maison et au quotidien.",
    h1: "TDAH, TSA, troubles DYS et Haut Potentiel",
    keywords: [
      "accompagnement TND Caen",
      "troubles DYS Caen",
      "TDA-H Caen",
      "dyslexie Caen",
      "dyspraxie Caen",
      "dyscalculie Caen",
      "troubles neurodéveloppement Caen",
      "inclusion scolaire DYS",
      "psychopédagogue TND",
      "CRA Basse-Normandie",
      "MDPH Calvados",
      "haut potentiel Caen",
    ],
    contentSections: [
      {
        title: "Une approche globale centrée sur le fonctionnement de l'enfant",
        content: "Les troubles du neurodéveloppement (TDAH, TSA, troubles DYS, Haut Potentiel, TOP...) peuvent avoir un impact sur les apprentissages, l'organisation, l'attention, la gestion des émotions, les interactions sociales ou encore l'autonomie au quotidien.\n\nChaque enfant présente un profil unique. Mon accompagnement vise à mieux comprendre son fonctionnement cognitif, émotionnel et comportemental afin d'identifier les leviers les plus adaptés à ses besoins.",
        keywords: ["TND", "neurodéveloppement", "fonctionnement"],
      },
      {
        title: "Mon expertise",
        content: "Professeure certifiée dans le domaine de la santé, psychopédagogue certifiée en neuroéducation et titulaire de deux Masters universitaires, j'ai développé une expertise spécifique dans la compréhension des troubles du neurodéveloppement.\n\nMon parcours au sein du Centre Ressources Autisme (CRA) de Basse-Normandie, complété par mon expérience à la Maison Départementale des Personnes Handicapées (MDPH) du Calvados ainsi que par mes travaux de recherche consacrés aux troubles du spectre de l'autisme, m'a permis d'acquérir une connaissance approfondie des parcours diagnostiques, des dispositifs d'accompagnement et des besoins spécifiques des enfants, adolescents et familles concernés.",
        keywords: ["expertise", "CRA", "MDPH"],
      },
      {
        title: "J'interviens notamment pour",
        content: "<strong>Comprendre son fonctionnement</strong> — Identifier les forces, les fragilités et les besoins spécifiques de l'enfant.<br/><br/><strong>Développer des stratégies adaptées</strong> — Mettre en place des outils concrets favorisant les apprentissages, l'organisation et l'autonomie.<br/><br/><strong>Favoriser son épanouissement scolaire et quotidien</strong> — Renforcer la confiance en soi, la motivation et le bien-être dans les différents environnements de vie.<br/><br/><strong>Soutenir l'inclusion scolaire</strong> — Faciliter la mise en place d'aménagements adaptés lorsque cela est nécessaire.<br/><br/><strong>Accompagner les familles</strong> — Apporter des repères concrets et des stratégies adaptées au quotidien.<br/><br/><strong>Collaborer avec les professionnels</strong> — Favoriser la coordination avec les équipes éducatives et les professionnels intervenant auprès de l'enfant.",
        keywords: ["stratégies", "inclusion scolaire", "familles"],
      },
      {
        title: "Un accompagnement complémentaire aux professionnels de santé",
        content: "Mon accompagnement ne se substitue pas aux bilans ou aux prises en charge réalisés par les professionnels de santé.\n\nIl s'inscrit dans une démarche complémentaire visant à aider l'enfant, sa famille et son environnement à mieux comprendre son fonctionnement et à mettre en place des stratégies favorisant les apprentissages, l'autonomie et le bien-être au quotidien.",
        keywords: ["complémentaire", "professionnels de santé"],
      },
      {
        title: "Pour quels profils ?",
        content: "• TDAH (avec ou sans hyperactivité)<br/>• Troubles DYS (dyslexie, dysorthographie, dyscalculie, dyspraxie...)<br/>• TSA (Trouble du Spectre de l'Autisme)<br/>• Haut Potentiel Intellectuel (HPI)<br/>• Difficultés attentionnelles et exécutives<br/>• Difficultés d'organisation et de planification<br/>• Difficultés émotionnelles associées<br/>• Estime de soi fragilisée<br/>• Difficultés scolaires liées au fonctionnement cognitif",
        keywords: ["TDAH", "DYS", "TSA", "HPI"],
      },
      {
        title: "Objectifs de l'accompagnement",
        content: "✓ Mieux comprendre son fonctionnement<br/>✓ Développer des stratégies adaptées<br/>✓ Renforcer son autonomie<br/>✓ Favoriser les apprentissages<br/>✓ Améliorer le bien-être au quotidien<br/>✓ Soutenir la réussite scolaire",
        keywords: ["objectifs", "autonomie", "réussite scolaire"],
      },
    ],
  },
  "harcelement": {
    title: "Harcèlement scolaire — Accompagnement Caen",
    description: "Accompagnement pour enfants et adolescents victimes de harcèlement scolaire ou de cyberharcèlement à Caen. Protection, reconstruction et soutien aux familles.",
    h1: "Harcèlement scolaire",
    keywords: [
      "harcèlement scolaire Caen",
      "accompagnement harcèlement scolaire",
      "victime harcèlement scolaire",
      "soutien harcèlement enfant",
      "cyberharcèlement",
      "psychopédagogue harcèlement",
      "phobie scolaire",
    ],
    contentSections: [
      {
        title: "Une approche centrée sur la protection et la reconstruction",
        content: "Le harcèlement scolaire peut avoir des conséquences importantes sur le bien-être émotionnel, la confiance en soi, les apprentissages et la scolarité.\n\nMon accompagnement vise à offrir un espace sécurisant permettant à l'enfant ou à l'adolescent d'exprimer ce qu'il vit, de retrouver progressivement confiance en lui et de développer des stratégies adaptées pour faire face à la situation.",
        keywords: ["protection", "reconstruction", "bien-être"],
      },
      {
        title: "Mon rôle dans l'accompagnement",
        content: "<strong>Comprendre la situation</strong> — Identifier les mécanismes du harcèlement, leurs impacts et les facteurs de vulnérabilité éventuels.<br/><br/><strong>Renforcer les ressources de l'enfant</strong> — Travailler la confiance en soi, l'affirmation de soi et le sentiment de sécurité.<br/><br/><strong>Construire des stratégies de protection</strong> — Développer des outils concrets pour faire face aux situations difficiles et retrouver un sentiment de contrôle.<br/><br/><strong>Accompagner les familles</strong> — Apporter des repères et des conseils pour soutenir efficacement leur enfant.<br/><br/><strong>Favoriser le dialogue avec l'école</strong> — Lorsque cela est pertinent, contribuer à une meilleure compréhension de la situation avec les différents acteurs éducatifs.<br/><br/><strong>Prévenir les conséquences sur la scolarité</strong> — Limiter l'impact du harcèlement sur les apprentissages, la motivation et l'engagement scolaire.",
        keywords: ["stratégies", "familles", "école"],
      },
      {
        title: "Comprendre le harcèlement scolaire",
        content: "Le harcèlement scolaire désigne des comportements répétés visant à isoler, humilier, intimider ou fragiliser une personne. Il peut prendre différentes formes :\n\n• harcèlement verbal ;<br/>• harcèlement psychologique ;<br/>• harcèlement physique ;<br/>• harcèlement relationnel ;<br/>• cyberharcèlement.\n\nSes conséquences peuvent être importantes : anxiété, perte de confiance en soi, isolement, difficultés scolaires, phobie scolaire ou décrochage.\n\nUne prise en charge précoce permet souvent de limiter ces conséquences et d'aider l'enfant à retrouver progressivement un équilibre.",
        keywords: ["cyberharcèlement", "phobie scolaire", "conséquences"],
      },
      {
        title: "Pour quels besoins ?",
        content: "✓ Harcèlement scolaire<br/>✓ Cyberharcèlement<br/>✓ Isolement social<br/>✓ Difficultés relationnelles<br/>✓ Perte de confiance en soi<br/>✓ Anxiété liée à l'école<br/>✓ Refus ou phobie scolaire<br/>✓ Reconstruction après une situation de harcèlement",
        keywords: ["besoins", "cyberharcèlement", "reconstruction"],
      },
      {
        title: "Une démarche complémentaire",
        content: "Mon accompagnement ne se substitue pas à l'intervention des établissements scolaires, des professionnels de santé ou des dispositifs spécialisés.\n\nIl s'inscrit dans une démarche complémentaire visant à soutenir l'enfant, sa famille et son environnement afin de favoriser sa reconstruction émotionnelle, son bien-être et la poursuite de sa scolarité dans les meilleures conditions possibles.",
        keywords: ["complémentaire", "reconstruction émotionnelle"],
      },
    ],
  },
  "confiance-en-soi": {
    title: "Confiance en soi & Neuroéducation : Estime de soi à Caen",
    description: "Accompagnement pour développer la confiance en soi et l'estime de soi à Caen. Techniques de valorisation, renforcement assertivité. Pour enfants, adolescents et adultes. Cabinet Bretteville sur Odon.",
    h1: "Gestion de la Confiance en Soi - Développement de l'Estime de Soi",
    keywords: [
      "confiance en soi Caen",
      "estime de soi enfant Caen",
      "développement confiance en soi",
      "assertivité Caen",
      "valorisation personnelle",
      "psychopédagogue confiance",
    ],
    contentSections: [
      {
        title: "Pourquoi la confiance en soi est-elle essentielle ?",
        content: "La confiance en soi est un pilier fondamental de l'épanouissement personnel, scolaire et professionnel. Elle influence notre capacité à prendre des décisions, à faire face aux défis, à exprimer nos besoins et à construire des relations saines. Un manque de confiance en soi peut impacter négativement les apprentissages, les relations sociales et le bien-être général.",
        keywords: ["confiance en soi", "estime de soi", "épanouissement"],
      },
      {
        title: "Comment développer la confiance en soi ?",
        content: "Mon accompagnement pour développer la confiance en soi s'articule autour de plusieurs axes : l'identification et la valorisation des forces, le développement de l'assertivité, l'amélioration de l'image de soi, la gestion des pensées limitantes et la consolidation de l'autonomie. Chaque parcours est personnalisé selon les besoins et les objectifs de la personne.",
        keywords: ["développement", "assertivité", "autonomie"],
      },
    ],
  },
  "gestion-stress": {
    title: "Gestion du stress & Neuroéducation : Apaiser le mental à Caen",
    description: "Accompagnement pour mieux gérer le stress au quotidien à Caen. Techniques de relaxation, gestion du temps, stratégies d'adaptation. Pour enfants, adolescents et adultes. Cabinet Bretteville sur Odon.",
    h1: "Gestion du Stress - Techniques et Stratégies d'Adaptation",
    keywords: [
      "gestion stress Caen",
      "techniques relaxation Caen",
      "stress enfant Caen",
      "anxiété scolaire",
      "gestion temps",
      "psychopédagogue stress",
    ],
    contentSections: [
      {
        title: "Comprendre le stress",
        content: "Le stress est une réaction naturelle de l'organisme face à une situation perçue comme menaçante. Il peut être bénéfique à court terme (motivation, performance) mais devient problématique lorsqu'il est chronique. Chez les enfants et adolescents, le stress peut se manifester par des difficultés de concentration, des troubles du sommeil, de l'irritabilité ou des somatisations.",
        keywords: ["stress", "anxiété", "troubles"],
      },
      {
        title: "Techniques de gestion du stress",
        content: "Mon accompagnement pour la gestion du stress inclut l'apprentissage de techniques de relaxation (respiration, méditation, visualisation), la gestion du temps et de l'organisation, le développement de stratégies d'adaptation et la compréhension des mécanismes du stress. L'objectif est de retrouver sérénité et équilibre dans la vie quotidienne.",
        keywords: ["relaxation", "techniques", "équilibre"],
      },
    ],
  },
  "guidance-parentale": {
    title: "Guidance parentale & Neuroéducation : Comprendre pour apaiser",
    description: "Guidance parentale à Caen : comprendre son enfant, stratégies éducatives adaptées, gestion des émotions et du quotidien familial. Cabinet Bretteville sur Odon.",
    h1: "Guidance parentale — Comprendre son enfant pour mieux l'accompagner",
    keywords: [
      "guidance parentale Caen",
      "accompagnement parents Caen",
      "conseils éducatifs",
      "gestion conflits familiaux",
      "relation parent-enfant",
      "psychopédagogue parents",
    ],
    contentSections: [
      {
        title: "Un espace d'écoute, de réflexion et de soutien",
        content: "Être parent peut parfois susciter des questionnements, un sentiment d'épuisement ou l'impression de ne plus savoir comment réagir face à certaines situations.\n\nLa guidance parentale permet de prendre du recul, d'analyser les difficultés rencontrées et de construire ensemble des réponses adaptées au fonctionnement de l'enfant et aux réalités du quotidien familial.",
        keywords: ["guidance parentale", "écoute", "soutien"],
      },
      {
        title: "Une approche fondée sur la compréhension du fonctionnement de l'enfant",
        content: "Chaque enfant possède son propre mode de fonctionnement, ses besoins, ses forces et ses fragilités.\n\nMon accompagnement s'appuie sur les connaissances actuelles issues des neurosciences, de la psychopédagogie et de la neuroéducation afin d'aider les parents à mieux comprendre les comportements de leur enfant et à développer des stratégies éducatives cohérentes, bienveillantes et efficaces.",
        keywords: ["neurosciences", "psychopédagogie", "neuroéducation"],
      },
      {
        title: "Les situations fréquemment accompagnées",
        content: "<strong>Difficultés émotionnelles</strong> — Colères, hypersensibilité, anxiété, frustration, gestion des émotions.<br/><br/><strong>Oppositions et conflits</strong> — Refus, négociation permanente, difficultés à respecter les consignes ou les limites.<br/><br/><strong>Troubles du neurodéveloppement</strong> — TDAH, TSA, troubles DYS, Haut Potentiel, difficultés attentionnelles ou exécutives.<br/><br/><strong>Difficultés scolaires</strong> — Organisation, devoirs, motivation, méthodologie, confiance en soi.<br/><br/><strong>Relations familiales</strong> — Tensions parent-enfant, conflits répétés, difficultés de communication.<br/><br/><strong>Épuisement parental</strong> — Sentiment d'impuissance, fatigue éducative, perte de repères.",
        keywords: ["TDAH", "TSA", "conflits", "émotions"],
      },
      {
        title: "Ce que nous travaillons ensemble",
        content: "<strong>Comprendre les comportements</strong> — Identifier les facteurs qui influencent les réactions de l'enfant et leurs fonctions.<br/><br/><strong>Adapter les réponses éducatives</strong> — Mettre en place des stratégies concrètes adaptées à l'âge, au profil et aux besoins de l'enfant.<br/><br/><strong>Poser un cadre sécurisant</strong> — Développer des repères clairs, cohérents et rassurants.<br/><br/><strong>Favoriser la coopération</strong> — Renforcer la communication et la relation parent-enfant.<br/><br/><strong>Soutenir l'autonomie</strong> — Accompagner progressivement l'enfant vers davantage d'indépendance et de responsabilité.<br/><br/><strong>Préserver l'équilibre familial</strong> — Retrouver davantage de sérénité dans le quotidien.",
        keywords: ["stratégies éducatives", "cadre", "autonomie"],
      },
      {
        title: "Une approche individualisée",
        content: "Chaque famille est unique.\n\nLes conseils proposés tiennent compte de votre contexte familial, de vos valeurs éducatives, du fonctionnement de votre enfant et des difficultés rencontrées.\n\nL'objectif n'est pas d'appliquer une méthode toute faite mais de co-construire des stratégies adaptées à votre réalité quotidienne.",
        keywords: ["individualisé", "famille"],
      },
      {
        title: "Les objectifs de la guidance parentale",
        content: "✓ Mieux comprendre son enfant<br/>✓ Retrouver des repères éducatifs clairs<br/>✓ Réduire les conflits du quotidien<br/>✓ Développer des stratégies adaptées<br/>✓ Favoriser l'autonomie de l'enfant<br/>✓ Retrouver davantage de sérénité familiale",
        keywords: ["objectifs", "sérénité"],
      },
    ],
  },
  "tests": {
    title: "Bilan de compétences & Tests Neuroéducatifs : Profil d'apprentissage",
    description: "Bilans psychopédagogiques approfondis à Caen pour mieux se connaître et identifier ses forces. Évaluations, recommandations personnalisées. Cabinet Bretteville sur Odon.",
    h1: "Tests de Connaissance de Soi - Bilans Psychopédagogiques",
    keywords: [
      "tests connaissance de soi Caen",
      "bilans psychopédagogiques Caen",
      "évaluations psychopédagogie",
      "tests soft skills",
      "bilan orientation",
      "psychopédagogue tests",
    ],
    contentSections: [
      {
        title: "Pourquoi faire un bilan psychopédagogique ?",
        content: "Un bilan psychopédagogique permet de mieux comprendre ses compétences, ses forces, ses axes d'amélioration et ses besoins spécifiques. Il peut être utile pour l'orientation scolaire et professionnelle, la compréhension des difficultés d'apprentissage, le développement personnel ou la préparation à des choix importants. Les résultats permettent d'orienter le parcours et de développer son potentiel.",
        keywords: ["bilan", "évaluation", "compétences"],
      },
      {
        title: "Types de bilans proposés",
        content: "Je propose différents types de bilans selon les besoins : bilans de connaissance de soi, tests de soft skills, bilans d'orientation, évaluations des compétences d'apprentissage. Chaque bilan est personnalisé et adapté à la situation. Les résultats sont présentés de manière claire et constructive, avec des recommandations personnalisées pour orienter le parcours.",
        keywords: ["soft skills", "orientation", "compétences"],
      },
    ],
  },
  "therapie": {
    title: "Accompagnement psycho-émotionnel & Neuroéducation à Caen",
    description: "Accompagnement pour la gestion des émotions à Caen. Techniques de régulation émotionnelle, gestion anxiété, travail sur traumatismes. Cabinet Bretteville sur Odon.",
    h1: "Accompagnement Psycho-émotionnel - Gestion des Émotions et Résilience",
    keywords: [
      "accompagnement psycho-émotionnel Caen",
      "gestion émotions Caen",
      "régulation émotionnelle",
      "gestion anxiété",
      "traumatismes",
      "psychopédagogue gestion émotions",
    ],
    contentSections: [
      {
        title: "Comprendre l'accompagnement psycho-émotionnel",
        content: "L'accompagnement psycho-émotionnel vise à mieux comprendre et gérer ses émotions pour développer sa résilience et retrouver un équilibre émotionnel. Il peut être utile pour gérer l'anxiété, le stress, les traumatismes, les difficultés relationnelles ou les troubles de l'humeur. L'approche intègre les dimensions cognitive, émotionnelle et comportementale.",
        keywords: ["accompagnement", "émotions", "résilience"],
      },
      {
        title: "Mon approche d'accompagnement",
        content: "Mon accompagnement psycho-émotionnel inclut l'apprentissage de techniques de régulation émotionnelle, la gestion de l'anxiété, le travail sur les traumatismes, le développement de la résilience et l'amélioration de la compréhension de soi. Chaque parcours est personnalisé selon les besoins et les objectifs de la personne, dans un cadre bienveillant et sécurisant.",
        keywords: ["régulation", "anxiété", "traumatismes"],
      },
    ],
  },
  "neuroeducation": {
    title: "Neuroéducation à Caen — Apprendre à apprendre",
    description: "Neuroéducation à Caen : comprendre comment le cerveau apprend pour développer des méthodes efficaces, renforcer l'autonomie et retrouver confiance dans ses apprentissages.",
    h1: "Apprendre à apprendre grâce à la Neuroéducation",
    keywords: [
      "neuroéducation Caen",
      "neurosciences apprentissage",
      "fonctionnement cerveau",
      "stratégies apprentissage",
      "psychopédagogue neuroéducation",
      "sciences cognitives",
      "méthodes de travail",
    ],
    contentSections: [
      {
        title: "Qu'est-ce que la neuroéducation ?",
        content: "La neuroéducation est une discipline qui s'appuie sur les connaissances issues des neurosciences, de la psychologie cognitive et des sciences de l'éducation afin de mieux comprendre les mécanismes impliqués dans les apprentissages.\n\nSon objectif n'est pas d'apprendre davantage, mais d'apprendre plus efficacement en tenant compte du fonctionnement du cerveau, de l'attention, de la mémoire, de la motivation et des émotions.",
        keywords: ["neuroéducation", "neurosciences", "apprentissage"],
      },
      {
        title: "Une approche centrée sur le fonctionnement de l'apprenant",
        content: "Chaque élève possède son propre profil cognitif, ses habitudes d'apprentissage, ses points forts et ses difficultés.\n\nMon accompagnement vise à identifier les stratégies les plus adaptées afin de permettre à chacun de développer des méthodes de travail efficaces, durables et transférables dans son quotidien scolaire.",
        keywords: ["profil cognitif", "méthodes de travail"],
      },
      {
        title: "Ce que nous travaillons ensemble",
        content: "<strong>Comprendre comment le cerveau apprend</strong> — Découvrir les mécanismes de l'attention, de la mémoire, de la motivation et de la consolidation des connaissances.<br/><br/><strong>Développer des méthodes efficaces</strong> — Mettre en place des stratégies adaptées pour apprendre, mémoriser et réviser plus efficacement.<br/><br/><strong>Renforcer les fonctions exécutives</strong> — Travailler l'organisation, la planification, l'inhibition, la flexibilité cognitive et la gestion du temps.<br/><br/><strong>Optimiser la mémorisation</strong> — Utiliser des techniques validées scientifiquement pour favoriser l'ancrage durable des connaissances.<br/><br/><strong>Développer son autonomie</strong> — Apprendre à devenir acteur de ses apprentissages et à construire sa propre méthode de travail.<br/><br/><strong>Retrouver confiance dans ses capacités</strong> — Mieux comprendre son fonctionnement pour retrouver un sentiment d'efficacité et de réussite.",
        keywords: ["mémorisation", "fonctions exécutives", "autonomie"],
      },
      {
        title: "Pour quels profils ?",
        content: "• Élèves rencontrant des difficultés d'apprentissage<br/>• Collégiens et lycéens souhaitant améliorer leurs méthodes de travail<br/>• Étudiants préparant des examens ou concours<br/>• Jeunes présentant des difficultés attentionnelles<br/>• TDAH, troubles DYS, HPI ou TSA<br/>• Élèves ayant le sentiment de beaucoup travailler sans obtenir les résultats attendus",
        keywords: ["élèves", "étudiants", "TDAH"],
      },
      {
        title: "Pourquoi la neuroéducation ?",
        content: "Parce qu'il ne suffit pas toujours de travailler davantage.\n\nComprendre comment fonctionne son cerveau permet souvent de gagner en efficacité, de réduire la charge mentale liée aux apprentissages et de retrouver davantage de confiance dans ses capacités.\n\nLa neuroéducation offre des repères concrets, fondés sur les connaissances scientifiques actuelles, pour apprendre de manière plus sereine et plus efficace.",
        keywords: ["efficacité", "confiance", "apprentissages"],
      },
      {
        title: "Les objectifs de l'accompagnement",
        content: "✓ Mieux comprendre son fonctionnement cognitif<br/>✓ Développer des méthodes de travail adaptées<br/>✓ Renforcer les capacités attentionnelles<br/>✓ Améliorer la mémorisation<br/>✓ Développer son autonomie<br/>✓ Retrouver confiance dans ses apprentissages",
        keywords: ["objectifs", "mémorisation", "autonomie"],
      },
    ],
  },
  "strategie-apprentissage": {
    title: "Stratégies d'apprentissage & Neuroéducation : Méthodes personnalisées",
    description: "Développement de méthodes et techniques d'apprentissage personnalisées à Caen. Organisation du travail, mémorisation, concentration, gestion du temps. Cabinet Bretteville sur Odon.",
    h1: "Stratégies d'Apprentissage - Méthodes Personnalisées pour la Réussite",
    keywords: [
      "stratégies apprentissage Caen",
      "méthodes apprentissage",
      "organisation travail",
      "mémorisation",
      "concentration",
      "psychopédagogue méthodes",
    ],
    contentSections: [
      {
        title: "Pourquoi développer des stratégies d'apprentissage ?",
        content: "Chaque personne apprend différemment. Développer des stratégies d'apprentissage adaptées à son profil permet d'améliorer ses performances, de gagner en autonomie et de retrouver confiance en ses capacités. Les stratégies d'apprentissage incluent l'organisation du travail, les techniques de mémorisation, la gestion de la concentration, la planification et la gestion du temps.",
        keywords: ["stratégies", "apprentissage", "autonomie"],
      },
      {
        title: "Mon accompagnement en stratégies d'apprentissage",
        content: "Mon accompagnement pour développer des stratégies d'apprentissage personnalisées inclut l'identification du profil d'apprentissage, l'apprentissage de techniques de mémorisation, le développement de l'organisation et de la planification, l'amélioration de la concentration et la gestion du temps. L'objectif est de développer l'autonomie et d'améliorer les performances scolaires ou professionnelles.",
        keywords: ["profil", "mémorisation", "organisation"],
      },
    ],
  },
  "orientation-professionnelle": {
    title: "Bilan d'orientation & Neuroéducation : Projets d'avenir à Caen",
    description: "Accompagnement à l'orientation scolaire et professionnelle à Caen. Analyse du profil, exploration métiers, Parcoursup, CV et lettre de motivation. Cabinet Bretteville sur Odon.",
    h1: "Orientation professionnelle — Clarifier son projet",
    keywords: [
      "orientation scolaire Caen",
      "orientation professionnelle Caen",
      "accompagnement Parcoursup",
      "bilan orientation",
      "test soft skills",
      "psychopédagogue orientation",
    ],
    contentSections: [
      {
        title: "Pourquoi un accompagnement à l'orientation ?",
        content: "L'orientation scolaire et professionnelle constitue une étape importante du parcours d'un jeune ou d'un étudiant. Face à la diversité des formations, des métiers et des possibilités d'évolution, il peut être difficile d'identifier une voie cohérente avec ses compétences, ses aspirations et son fonctionnement.\n\nMon accompagnement vise à favoriser une meilleure connaissance de soi, à clarifier les perspectives d'avenir et à construire un projet réaliste, motivant et durable.",
        keywords: ["orientation", "projet", "connaissance de soi"],
      },
      {
        title: "Mon accompagnement à l'orientation",
        content: "Mon accompagnement repose sur une démarche structurée et individualisée permettant d'explorer les centres d'intérêt, les compétences, les aptitudes, les valeurs et les aspirations de chacun.\n\nSelon les besoins, il peut inclure :<br/><br/>• l'analyse du profil et du fonctionnement personnel ;<br/>• l'identification des compétences et des ressources ;<br/>• l'exploration des métiers, secteurs et formations ;<br/>• la construction d'un projet d'orientation cohérent ;<br/>• l'accompagnement Parcoursup et aux candidatures ;<br/>• l'aide à la rédaction du CV, de la lettre de motivation et des dossiers de sélection ;<br/>• l'accompagnement à la prise de décision.\n\nL'objectif est de permettre à chacun d'avancer avec davantage de clarté, de confiance et de sérénité dans ses choix d'orientation.",
        keywords: ["Parcoursup", "CV", "projet"],
      },
      {
        title: "Les étapes de l'accompagnement",
        content: "<strong>Analyse du profil, des motivations et des centres d'intérêt</strong><br/><br/><strong>Identification des compétences, ressources et points d'appui</strong><br/><br/><strong>Exploration des métiers et des environnements professionnels adaptés</strong><br/><br/><strong>Construction d'un projet d'orientation cohérent et individualisé</strong><br/><br/><strong>Accompagnement Parcoursup et stratégie de candidature</strong><br/><br/><strong>Valorisation du parcours, du CV et des candidatures</strong><br/><br/><strong>Analyse des formations et des débouchés</strong><br/><br/><strong>Prise de décision et sécurisation du projet</strong>",
        keywords: ["étapes", "méthodologie"],
      },
    ],
  },
};

