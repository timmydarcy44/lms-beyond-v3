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
      context: "Consultations psychopédagogiques à Fleury-sur-Orne",
      priority: "high",
      keywords: ["consultation", "rendez-vous", "Fleury-sur-Orne"],
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
      anchor: "Thérapie psycho-émotionnelle",
      context: "Gestion des traumatismes liés au harcèlement",
      priority: "high",
      keywords: ["thérapie", "traumatisme", "émotions"],
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
    title: "Accompagnement TND | Troubles DYS et TDA-H | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement spécialisé pour troubles du neurodéveloppement (DYS, TDA-H, TSA, HPI, TOP) à Caen. Expertise CRA Basse-Normandie et MDPH. Stratégies d'apprentissage personnalisées, inclusion scolaire. Cabinet Fleury-sur-Orne.",
    h1: "Accompagnement des Troubles du Neurodéveloppement (TND) - Troubles DYS, TDA-H, TSA, HPI, TOP",
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
    ],
    contentSections: [
      {
        title: "Qu'est-ce que l'accompagnement TND ?",
        content: "L'accompagnement des Troubles du Neurodéveloppement (TND) concerne les enfants et adolescents présentant des troubles DYS (dyslexie, dyspraxie, dyscalculie, dysorthographie), un TDA-H (Trouble Déficit de l'Attention avec ou sans Hyperactivité), un TSA (Trouble du Spectre de l'Autisme), un HPI (Haut Potentiel Intellectuel) ou un TOP (Trouble Oppositionnel avec Provocation). Mon expérience de 2 ans au CRA de Basse-Normandie et à la MDPH du Calvados m'a permis de développer une expertise approfondie dans la compréhension des diagnostics TND et l'accompagnement des familles.",
        keywords: ["TND", "troubles DYS", "TDA-H", "diagnostic"],
      },
      {
        title: "Pourquoi choisir un accompagnement spécialisé TND ?",
        content: "Les troubles du neurodéveloppement nécessitent une approche adaptée et personnalisée. Chaque enfant est unique et nécessite des stratégies d'apprentissage spécifiques. Mon accompagnement intègre les dimensions cognitive, émotionnelle et comportementale, en collaboration étroite avec les équipes éducatives pour favoriser l'inclusion scolaire et la réussite de chaque jeune.",
        keywords: ["accompagnement spécialisé", "stratégies d'apprentissage", "inclusion scolaire"],
      },
    ],
  },
  "harcelement": {
    title: "Harcèlement Scolaire | Accompagnement et Soutien | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement bienveillant pour enfants et adolescents victimes de harcèlement scolaire à Caen. Écoute, soutien psychologique, stratégies de protection. Collaboration école et famille. Cabinet Fleury-sur-Orne.",
    h1: "Accompagnement face au Harcèlement Scolaire - Soutien et Protection",
    keywords: [
      "harcèlement scolaire Caen",
      "accompagnement harcèlement scolaire",
      "victime harcèlement scolaire",
      "soutien harcèlement enfant",
      "prévention harcèlement scolaire",
      "psychopédagogue harcèlement",
      "traumatisme harcèlement",
    ],
    contentSections: [
      {
        title: "Comprendre le harcèlement scolaire",
        content: "Le harcèlement scolaire est un phénomène répandu qui touche de nombreux enfants et adolescents. Il peut prendre différentes formes : verbale, physique, psychologique ou numérique (cyberharcèlement). Les conséquences peuvent être graves : perte de confiance en soi, troubles anxieux, dépression, phobie scolaire, voire décrochage scolaire. Un accompagnement précoce et adapté est essentiel pour aider la victime à se reconstruire.",
        keywords: ["harcèlement scolaire", "cyberharcèlement", "victime"],
      },
      {
        title: "Mon approche face au harcèlement",
        content: "Mon accompagnement face au harcèlement scolaire est basé sur l'écoute, la bienveillance et la sécurité. Je travaille en collaboration étroite avec l'école, la famille et les professionnels de santé pour mettre en place des stratégies de protection et de reconstruction. L'objectif est de redonner confiance à l'enfant, de l'aider à exprimer ses émotions et de développer des outils pour faire face à cette situation difficile.",
        keywords: ["accompagnement", "reconstruction", "confiance en soi"],
      },
    ],
  },
  "confiance-en-soi": {
    title: "Confiance en Soi | Estime de Soi | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement pour développer la confiance en soi et l'estime de soi à Caen. Techniques de valorisation, renforcement assertivité. Pour enfants, adolescents et adultes. Cabinet Fleury-sur-Orne.",
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
    title: "Gestion du Stress | Techniques de Relaxation | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement pour mieux gérer le stress au quotidien à Caen. Techniques de relaxation, gestion du temps, stratégies d'adaptation. Pour enfants, adolescents et adultes. Cabinet Fleury-sur-Orne.",
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
    title: "Guidance Parentale | Accompagnement Parents | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Soutien et conseils pour les parents dans leur rôle éducatif à Caen. Stratégies éducatives adaptées, gestion conflits familiaux, renforcement lien parent-enfant. Cabinet Fleury-sur-Orne.",
    h1: "Guidance Parentale - Accompagnement et Soutien pour les Parents",
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
        title: "Pourquoi la guidance parentale ?",
        content: "Être parent est un rôle complexe qui peut être source de questionnements, de doutes et de difficultés. Chaque enfant est unique et nécessite une approche adaptée. La guidance parentale offre un espace d'écoute et de conseils pour accompagner les parents dans leur rôle éducatif, les aider à comprendre les besoins de leur enfant et à développer des stratégies éducatives adaptées.",
        keywords: ["guidance parentale", "parents", "éducation"],
      },
      {
        title: "Mon approche de la guidance parentale",
        content: "Mon accompagnement en guidance parentale s'articule autour de plusieurs axes : l'écoute et la compréhension des difficultés rencontrées, le développement de stratégies éducatives adaptées, la gestion des conflits familiaux, le renforcement du lien parent-enfant et la valorisation des compétences parentales. L'objectif est de créer un environnement familial épanouissant pour tous.",
        keywords: ["stratégies", "conflits", "lien parent-enfant"],
      },
    ],
  },
  "tests": {
    title: "Tests de Connaissance de Soi | Bilans Psychopédagogiques | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Bilans psychopédagogiques approfondis à Caen pour mieux se connaître et identifier ses forces. Évaluations, recommandations personnalisées. Cabinet Fleury-sur-Orne.",
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
    title: "Thérapie Psycho-émotionnelle | Gestion des Émotions | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement thérapeutique pour la gestion des émotions à Caen. Techniques de régulation émotionnelle, gestion anxiété, travail sur traumatismes. Cabinet Fleury-sur-Orne.",
    h1: "Thérapie Psycho-émotionnelle - Gestion des Émotions et Résilience",
    keywords: [
      "thérapie psycho-émotionnelle Caen",
      "gestion émotions Caen",
      "régulation émotionnelle",
      "gestion anxiété",
      "traumatismes",
      "psychopédagogue thérapie",
    ],
    contentSections: [
      {
        title: "Comprendre la thérapie psycho-émotionnelle",
        content: "La thérapie psycho-émotionnelle vise à mieux comprendre et gérer ses émotions pour développer sa résilience et retrouver un équilibre émotionnel. Elle peut être utile pour gérer l'anxiété, le stress, les traumatismes, les difficultés relationnelles ou les troubles de l'humeur. L'approche intègre les dimensions cognitive, émotionnelle et comportementale.",
        keywords: ["thérapie", "émotions", "résilience"],
      },
      {
        title: "Mon approche thérapeutique",
        content: "Mon accompagnement en thérapie psycho-émotionnelle inclut l'apprentissage de techniques de régulation émotionnelle, la gestion de l'anxiété, le travail sur les traumatismes, le développement de la résilience et l'amélioration de la compréhension de soi. Chaque parcours est personnalisé selon les besoins et les objectifs de la personne, dans un cadre bienveillant et sécurisant.",
        keywords: ["régulation", "anxiété", "traumatismes"],
      },
    ],
  },
  "neuroeducation": {
    title: "Neuroéducation | Neurosciences et Apprentissage | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Approche basée sur les neurosciences pour optimiser les apprentissages à Caen. Comprendre le fonctionnement du cerveau, stratégies d'apprentissage efficaces. Cabinet Fleury-sur-Orne.",
    h1: "Neuroéducation - Optimiser les Apprentissages grâce aux Neurosciences",
    keywords: [
      "neuroéducation Caen",
      "neurosciences apprentissage",
      "fonctionnement cerveau",
      "stratégies apprentissage",
      "psychopédagogue neuroéducation",
      "sciences cognitives",
    ],
    contentSections: [
      {
        title: "Qu'est-ce que la neuroéducation ?",
        content: "La neuroéducation est une approche qui s'appuie sur les dernières découvertes en neurosciences pour comprendre comment fonctionne le cerveau et optimiser les processus d'apprentissage. Elle permet de développer des stratégies d'apprentissage efficaces et adaptées à chacun, en tenant compte des mécanismes cérébraux impliqués dans l'apprentissage, la mémorisation et la compréhension.",
        keywords: ["neuroéducation", "neurosciences", "apprentissage"],
      },
      {
        title: "Applications de la neuroéducation",
        content: "La neuroéducation permet de mieux comprendre les difficultés d'apprentissage, de développer des méthodes d'apprentissage adaptées, d'optimiser la mémorisation et la compréhension, et de favoriser la réussite scolaire. Mon accompagnement intègre ces connaissances pour proposer des stratégies d'apprentissage personnalisées et efficaces.",
        keywords: ["méthodes", "mémorisation", "réussite"],
      },
    ],
  },
  "strategie-apprentissage": {
    title: "Stratégies d'Apprentissage | Méthodes Personnalisées | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Développement de méthodes et techniques d'apprentissage personnalisées à Caen. Organisation du travail, mémorisation, concentration, gestion du temps. Cabinet Fleury-sur-Orne.",
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
  "orientation": {
    title: "Orientation Scolaire et Professionnelle | Parcoursup | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement à l'orientation scolaire et professionnelle à Caen. Test soft skills, exploration métiers, aide Parcoursup, CV et lettre de motivation. Cabinet Fleury-sur-Orne.",
    h1: "Orientation Scolaire et Professionnelle - Accompagnement Complet",
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
        content: "L'orientation scolaire et professionnelle est un moment clé qui peut être source de stress et de questionnements. Un accompagnement personnalisé permet d'identifier ses intérêts, ses compétences et ses aspirations, d'explorer les métiers et les formations, et de faire des choix éclairés. L'objectif est de construire un projet d'avenir qui correspond à la personne.",
        keywords: ["orientation", "choix", "projet"],
      },
      {
        title: "Mon processus d'accompagnement orientation",
        content: "Mon accompagnement à l'orientation s'articule en plusieurs étapes : bilan d'orientation avec test de soft skills, exploration des métiers et des formations, travail sur les perspectives métiers, rédaction du projet d'orientation, aide à la rédaction du CV et de la lettre de motivation, et accompagnement dans les démarches (Parcoursup, candidatures, etc.).",
        keywords: ["bilan", "soft skills", "Parcoursup"],
      },
    ],
  },
};

