/**
 * Configuration SEO pour le site Jessica Contentin
 * Stratégie de référencement naturel optimisée pour devenir leader
 */

// Mots-clés principaux (Primary Keywords)
export const PRIMARY_KEYWORDS = {
  psychopedagogue: [
    "psychopédagogue Fleury-sur-Orne",
    "psychopédagogue Caen",
    "psychopédagogue Normandie",
    "psychopédagogue certifiée neuroéducation",
    "psychopédagogue TND",
    "psychopédagogue troubles DYS",
    "psychopédagogue TDA-H",
  ],
  accompagnement: [
    "accompagnement scolaire Caen",
    "accompagnement TND Caen",
    "accompagnement troubles DYS",
    "accompagnement TDA-H Caen",
    "accompagnement harcèlement scolaire",
    "accompagnement phobie scolaire",
    "accompagnement orientation scolaire",
  ],
  troubles: [
    "troubles DYS Caen",
    "troubles du neurodéveloppement Caen",
    "TDA-H Caen",
    "dyslexie Caen",
    "dyspraxie Caen",
    "dyscalculie Caen",
    "troubles de l'apprentissage Caen",
  ],
  services: [
    "gestion des émotions Caen",
    "confiance en soi Caen",
    "orientation scolaire Caen",
    "harcèlement scolaire Caen",
    "phobie scolaire Caen",
    "neuroéducation Caen",
    "guidance parentale Caen",
  ],
  localisation: [
    "Fleury-sur-Orne",
    "Caen",
    "Normandie",
    "Calvados",
    "Région de Caen",
  ],
};

// Mots-clés secondaires (Long-tail keywords)
export const LONG_TAIL_KEYWORDS = [
  "psychopédagogue spécialisée troubles DYS Fleury-sur-Orne",
  "accompagnement enfant TDA-H Caen",
  "gestion émotions enfant Caen",
  "orientation scolaire post-bac Caen",
  "accompagnement harcèlement scolaire enfant Caen",
  "phobie scolaire accompagnement Caen",
  "neuroéducation apprentissage Caen",
  "confiance en soi adolescent Caen",
  "guidance parentale enfant TND",
  "bilan psychopédagogique Caen",
  "stratégies d'apprentissage personnalisées",
  "inclusion scolaire enfant DYS",
  "accompagnement scolarité en ligne",
  "thérapie psycho-émotionnelle Caen",
];

// Configuration SEO par page
export const PAGE_SEO_CONFIG = {
  home: {
    title: "Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation | Fleury-sur-Orne, Caen",
    description: "Psychopédagogue certifiée en neuroéducation à Fleury-sur-Orne (Caen). Accompagnement personnalisé pour troubles DYS, TDA-H, harcèlement scolaire, phobie scolaire. Gestion des émotions, confiance en soi, orientation scolaire. Cabinet chaleureux et bienveillant.",
    keywords: [
      "psychopédagogue Fleury-sur-Orne",
      "psychopédagogue Caen",
      "troubles DYS Caen",
      "TDA-H Caen",
      "harcèlement scolaire Caen",
      "phobie scolaire Caen",
      "neuroéducation Caen",
      "accompagnement scolaire Caen",
      "gestion émotions Caen",
      "confiance en soi Caen",
    ],
    h1: "Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation",
    canonical: "https://jessicacontentin.fr",
  },
  "a-propos": {
    title: "À propos - Jessica CONTENTIN | Psychopédagogue certifiée neuroéducation | Caen",
    description: "Découvrez le parcours et l'expertise de Jessica CONTENTIN, psychopédagogue certifiée en neuroéducation à Fleury-sur-Orne. Master IAE Caen, Master MEEF INSPE, professeure certifiée depuis 2015. Spécialisée en troubles DYS, TDA-H, harcèlement et phobie scolaire.",
    keywords: [
      "psychopédagogue Caen parcours",
      "psychopédagogue neuroéducation formation",
      "Jessica CONTENTIN biographie",
      "psychopédagogue expérience Caen",
      "certification neuroéducation",
    ],
    h1: "À propos de Jessica CONTENTIN",
    canonical: "https://jessicacontentin.fr/a-propos",
  },
  specialites: {
    title: "Spécialités - Psychopédagogie | Troubles DYS, TDA-H, Harcèlement scolaire | Caen",
    description: "Découvrez toutes les spécialités de Jessica CONTENTIN : accompagnement TND (troubles DYS, TDA-H), harcèlement scolaire, phobie scolaire, gestion des émotions, confiance en soi, orientation scolaire, neuroéducation. Cabinet à Fleury-sur-Orne, Caen.",
    keywords: [
      "spécialités psychopédagogue Caen",
      "accompagnement TND Caen",
      "troubles DYS accompagnement",
      "harcèlement scolaire accompagnement",
      "phobie scolaire traitement",
      "gestion émotions enfant",
      "orientation scolaire professionnelle",
    ],
    h1: "Mes Spécialités en Psychopédagogie",
    canonical: "https://jessicacontentin.fr/specialites",
  },
  "specialites-confiance-en-soi": {
    title: "Gestion de la Confiance en Soi | Psychopédagogue Caen | Jessica CONTENTIN",
    description: "Accompagnement personnalisé pour développer la confiance en soi et l'estime de soi. Techniques de valorisation, renforcement de l'assertivité. Cabinet à Fleury-sur-Orne, Caen. Prenez rendez-vous.",
    keywords: [
      "confiance en soi Caen",
      "estime de soi enfant Caen",
      "développement confiance en soi",
      "assertivité Caen",
      "valorisation personnelle",
    ],
    h1: "Gestion de la Confiance en Soi",
    canonical: "https://jessicacontentin.fr/specialites/confiance-en-soi",
  },
  "specialites-tnd": {
    title: "Accompagnement TND | Troubles DYS et TDA-H | Psychopédagogue Caen",
    description: "Accompagnement spécialisé pour troubles du neurodéveloppement (DYS, TDA-H) à Caen. Stratégies d'apprentissage personnalisées, soutien inclusion scolaire, collaboration équipes éducatives. Cabinet Jessica CONTENTIN, Fleury-sur-Orne.",
    keywords: [
      "accompagnement TND Caen",
      "troubles DYS Caen",
      "TDA-H accompagnement Caen",
      "dyslexie Caen",
      "dyspraxie Caen",
      "dyscalculie Caen",
      "troubles neurodéveloppement Caen",
      "inclusion scolaire DYS",
    ],
    h1: "Accompagnement des Troubles du Neurodéveloppement (TND)",
    canonical: "https://jessicacontentin.fr/specialites/tnd",
  },
  "specialites-harcelement": {
    title: "Harcèlement Scolaire | Accompagnement et Soutien | Psychopédagogue Caen",
    description: "Accompagnement bienveillant pour enfants et adolescents confrontés au harcèlement scolaire. Écoute, soutien psychologique, stratégies de protection. Collaboration avec l'école et la famille. Cabinet à Fleury-sur-Orne, Caen.",
    keywords: [
      "harcèlement scolaire Caen",
      "accompagnement harcèlement scolaire",
      "victime harcèlement scolaire",
      "soutien harcèlement enfant",
      "prévention harcèlement scolaire",
    ],
    h1: "Accompagnement face au Harcèlement Scolaire",
    canonical: "https://jessicacontentin.fr/specialites/harcelement",
  },
  consultations: {
    title: "Consultations | Tarifs et Modalités | Psychopédagogue Fleury-sur-Orne",
    description: "Consultations psychopédagogiques à Fleury-sur-Orne (Caen). Tarifs : première consultation 90€, suivi 70€. Enfants, adolescents, adultes, parents. Cabinet chaleureux avec coin enfant. Prenez rendez-vous en ligne.",
    keywords: [
      "consultation psychopédagogue Caen",
      "tarif psychopédagogue Fleury-sur-Orne",
      "rendez-vous psychopédagogue",
      "cabinet psychopédagogie Caen",
      "consultation enfant Caen",
      "consultation adolescent Caen",
    ],
    h1: "Consultations Psychopédagogiques",
    canonical: "https://jessicacontentin.fr/consultations",
  },
  orientation: {
    title: "Orientation Scolaire et Professionnelle | Parcoursup | Psychopédagogue Caen",
    description: "Accompagnement à l'orientation scolaire et professionnelle à Caen. Test soft skills, travail sur perspectives métiers, rédaction projet orientation, aide Parcoursup, CV et lettre de motivation. Cabinet Jessica CONTENTIN.",
    keywords: [
      "orientation scolaire Caen",
      "orientation professionnelle Caen",
      "accompagnement Parcoursup",
      "bilan orientation Caen",
      "test soft skills orientation",
      "projet orientation scolaire",
      "choix métier Caen",
    ],
    h1: "Accompagnement à l'Orientation Scolaire et Professionnelle",
    canonical: "https://jessicacontentin.fr/orientation",
  },
  ressources: {
    title: "Ressources Psychopédagogiques | Articles et Outils | Jessica CONTENTIN",
    description: "Ressources et outils psychopédagogiques pour parents, enfants et professionnels. Articles sur troubles DYS, TDA-H, gestion émotions, confiance en soi, orientation scolaire. Contenus accessibles partout en France.",
    keywords: [
      "ressources psychopédagogie",
      "articles troubles DYS",
      "outils apprentissage",
      "ressources parents TND",
      "guides psychopédagogie",
      "ressources psychopédagogie France",
      "contenus TND en ligne",
      "formations psychopédagogie",
    ],
    h1: "Ressources Psychopédagogiques",
    canonical: "https://jessicacontentin.fr/ressources",
    // Note: Rayonnement national pour les ressources (pas de géolocalisation)
  },
};

// Maillage interne - Structure de liens entre pages
export const INTERNAL_LINKING = {
  home: [
    { url: "/a-propos", anchor: "Découvrir mon parcours", context: "psychopédagogue certifiée" },
    { url: "/specialites", anchor: "Mes spécialités", context: "accompagnement personnalisé" },
    { url: "/specialites/tnd", anchor: "Accompagnement TND", context: "troubles DYS et TDA-H" },
    { url: "/specialites/harcelement", anchor: "Harcèlement scolaire", context: "accompagnement bienveillant" },
    { url: "/consultations", anchor: "Prendre rendez-vous", context: "consultations personnalisées" },
    { url: "/orientation", anchor: "Orientation scolaire", context: "accompagnement orientation" },
  ],
  "a-propos": [
    { url: "/", anchor: "Retour à l'accueil", context: "Jessica CONTENTIN" },
    { url: "/specialites", anchor: "Découvrir mes spécialités", context: "accompagnement psychopédagogique" },
    { url: "/specialites/tnd", anchor: "Accompagnement TND", context: "troubles du neurodéveloppement" },
    { url: "/consultations", anchor: "Prendre rendez-vous", context: "consultations" },
  ],
  specialites: [
    { url: "/", anchor: "Accueil", context: "Jessica CONTENTIN" },
    { url: "/a-propos", anchor: "Mon parcours", context: "psychopédagogue" },
    { url: "/consultations", anchor: "Consultations", context: "prendre rendez-vous" },
    { url: "/orientation", anchor: "Orientation scolaire", context: "accompagnement orientation" },
  ],
  consultations: [
    { url: "/", anchor: "Accueil", context: "Jessica CONTENTIN" },
    { url: "/specialites", anchor: "Mes spécialités", context: "accompagnement" },
    { url: "/specialites/tnd", anchor: "Accompagnement TND", context: "troubles DYS" },
    { url: "/a-propos", anchor: "Mon parcours", context: "psychopédagogue" },
  ],
  orientation: [
    { url: "/", anchor: "Accueil", context: "Jessica CONTENTIN" },
    { url: "/specialites", anchor: "Toutes mes spécialités", context: "accompagnement" },
    { url: "/specialites/confiance-en-soi", anchor: "Confiance en soi", context: "développement personnel" },
    { url: "/consultations", anchor: "Prendre rendez-vous", context: "consultation orientation" },
  ],
};

// Schema.org structured data
export const STRUCTURED_DATA = {
  organization: {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "Jessica CONTENTIN - Psychopédagogue",
    "description": "Psychopédagogue certifiée en neuroéducation. Accompagnement personnalisé pour troubles DYS, TDA-H, harcèlement scolaire, phobie scolaire.",
    "url": "https://jessicacontentin.fr",
    "logo": "https://jessicacontentin.fr/logo.png",
    "image": "https://jessicacontentin.fr/jessica-contentin.jpg",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "41 C",
      "addressLocality": "Fleury-sur-Orne",
      "postalCode": "14123",
      "addressRegion": "Normandie",
      "addressCountry": "FR",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "49.1478",
      "longitude": "-0.3756",
    },
    "telephone": "+33683477174",
    "email": "contentin.cabinet@gmail.com",
    "priceRange": "€€",
    "areaServed": {
      "@type": "City",
      "name": "Caen",
    },
    "serviceType": [
      "Psychopédagogie",
      "Accompagnement TND",
      "Neuroéducation",
      "Orientation scolaire",
      "Gestion des émotions",
    ],
  },
  person: {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Jessica CONTENTIN",
    "jobTitle": "Psychopédagogue certifiée en neuroéducation",
    "description": "Psychopédagogue certifiée en neuroéducation, spécialisée dans l'accompagnement des troubles du neurodéveloppement (DYS, TDA-H), harcèlement scolaire et phobie scolaire.",
    "url": "https://jessicacontentin.fr",
    "image": "https://jessicacontentin.fr/jessica-contentin.jpg",
    "email": "contentin.cabinet@gmail.com",
    "telephone": "+33683477174",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Fleury-sur-Orne",
      "addressRegion": "Normandie",
      "postalCode": "14123",
      "addressCountry": "FR",
    },
    "alumniOf": [
      {
        "@type": "EducationalOrganization",
        "name": "IAE de Caen",
      },
      {
        "@type": "EducationalOrganization",
        "name": "INSPE",
      },
    ],
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Certification",
        "name": "Certification en neuroéducation",
      },
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "Diplôme",
        "name": "CAPES",
      },
    ],
  },
  localBusiness: {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Cabinet de Psychopédagogie Jessica CONTENTIN",
    "description": "Cabinet de psychopédagogie spécialisé dans l'accompagnement des troubles du neurodéveloppement, harcèlement scolaire et phobie scolaire.",
    "url": "https://jessicacontentin.fr",
    "telephone": "+33683477174",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "41 C",
      "addressLocality": "Fleury-sur-Orne",
      "postalCode": "14123",
      "addressRegion": "Normandie",
      "addressCountry": "FR",
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "49.1478",
      "longitude": "-0.3756",
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:30",
        "closes": "18:00",
      },
    ],
    "priceRange": "€€",
  },
};

// Fonction pour générer les métadonnées SEO
export function generateSEOMetadata(page: keyof typeof PAGE_SEO_CONFIG) {
  const config = PAGE_SEO_CONFIG[page];
  if (!config) return {};

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords.join(", "),
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.canonical,
      siteName: "Jessica CONTENTIN - Psychopédagogue",
      locale: "fr_FR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.title,
      description: config.description,
    },
    alternates: {
      canonical: config.canonical,
    },
  };
}

