export type CareerProfile = {
  id: string;
  slug: string;
  title: string;
  sector: string;
  description: string;
  key_skills: string[];
  soft_skills: string[];
  behavioral_expectations: string[];
  recommended_badges: string[];
  typical_challenges: string[];
  success_factors: string[];
  main_missions: string[];
  useful_qualities: string[];
  recommended_formations: string[];
};

export const CAREER_PROFILES: CareerProfile[] = [
  {
    id: "commercial-immobilier",
    slug: "commercial-immobilier",
    title: "Commercial en immobilier",
    sector: "Immobilier",
    description:
      "Le commercial en immobilier accompagne des vendeurs, acheteurs ou investisseurs dans leurs projets immobiliers.",
    key_skills: [
      "prospection",
      "estimation",
      "négociation",
      "relation client",
      "argumentation",
      "suivi administratif",
      "connaissance marché",
      "closing",
    ],
    soft_skills: ["écoute active", "persévérance", "résilience", "communication", "organisation"],
    behavioral_expectations: ["posture conseil", "énergie commerciale", "confiance", "rigueur administrative"],
    recommended_badges: ["Profil comportemental EDGE", "Négociation commerciale"],
    typical_challenges: ["cycles de vente longs", "concurrence locale", "gestion du stress", "administratif"],
    success_factors: ["régularité de prospection", "écoute client", "connaissance du secteur"],
    main_missions: [
      "Prospecter et qualifier des mandats ou des acquéreurs",
      "Estimer et présenter des biens",
      "Négocier et conclure des transactions",
      "Assurer le suivi administratif et relationnel",
    ],
    useful_qualities: ["écoute", "persévérance", "confiance", "organisation", "résistance au stress"],
    recommended_formations: [],
  },
  {
    id: "negociateur-immobilier",
    slug: "negociateur-immobilier",
    title: "Négociateur immobilier",
    sector: "Immobilier",
    description:
      "Le négociateur immobilier pilote la vente ou la location d'un portefeuille de biens, de la mise en marché à la signature.",
    key_skills: ["négociation", "prospection", "estimation", "marketing terrain", "closing", "suivi dossier"],
    soft_skills: ["assertivité", "résilience", "organisation", "écoute active"],
    behavioral_expectations: ["orientation résultats", "autonomie", "rigueur"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["objectifs commerciaux", "marché volatil", "charge administrative"],
    success_factors: ["discipline commerciale", "maîtrise du discours", "réseau local"],
    main_missions: ["Développer un portefeuille de biens", "Mener les visites et négociations", "Sécuriser les signatures"],
    useful_qualities: ["détermination", "écoute", "organisation", "confiance"],
    recommended_formations: [],
  },
  {
    id: "charge-recrutement",
    slug: "charge-recrutement",
    title: "Chargé de recrutement",
    sector: "RH",
    description:
      "Le chargé de recrutement identifie, évalue et accompagne les candidats pour répondre aux besoins en talents des organisations.",
    key_skills: ["sourcing", "entretien", "évaluation", "rédaction d'offres", "relation candidats", "closing"],
    soft_skills: ["écoute active", "empathie", "communication", "organisation", "discernement"],
    behavioral_expectations: ["neutralité", "curiosité", "diplomatie"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["délais serrés", "volume de candidatures", "alignement managers"],
    success_factors: ["méthode d'évaluation", "réseau", "expérience candidat"],
    main_missions: ["Définir le besoin avec le manager", "Publier et sourcer", "Conduire les entretiens", "Présenter les finalistes"],
    useful_qualities: ["écoute", "persuasion", "organisation", "discrétion"],
    recommended_formations: [],
  },
  {
    id: "conseiller-commercial",
    slug: "conseiller-commercial",
    title: "Conseiller commercial",
    sector: "Commerce",
    description:
      "Le conseiller commercial accompagne les clients dans le choix d'une solution adaptée à leurs besoins, en combinant écoute et argumentation.",
    key_skills: ["prospection", "écoute active", "argumentation", "négociation", "fidélisation", "closing"],
    soft_skills: ["communication", "résilience", "organisation", "empathie"],
    behavioral_expectations: ["posture conseil", "orientation client", "énergie commerciale"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["objectifs", "concurrence", "gestion des refus"],
    success_factors: ["relation de confiance", "connaissance produit", "suivi client"],
    main_missions: ["Identifier les besoins clients", "Proposer des solutions", "Conclure et fidéliser"],
    useful_qualities: ["écoute", "persévérance", "confiance", "organisation"],
    recommended_formations: [],
  },
  {
    id: "responsable-communication",
    slug: "responsable-communication",
    title: "Responsable communication",
    sector: "Communication",
    description:
      "Le responsable communication définit et déploie la stratégie de marque, des messages et des contenus sur l'ensemble des canaux.",
    key_skills: ["stratégie éditoriale", "rédaction", "gestion de projet", "relations presse", "analyse", "coordination"],
    soft_skills: ["créativité", "organisation", "communication", "leadership collaboratif"],
    behavioral_expectations: ["vision", "rigueur", "diplomatie"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["multi-canal", "urgences médias", "alignement interne"],
    success_factors: ["cohérence de marque", "réseau", "capacité d'écoute"],
    main_missions: ["Piloter la stratégie de communication", "Coordonner les contenus", "Mesurer l'impact"],
    useful_qualities: ["écoute", "créativité", "organisation", "résistance au stress"],
    recommended_formations: [],
  },
  {
    id: "community-manager",
    slug: "community-manager",
    title: "Community manager",
    sector: "Communication",
    description:
      "Le community manager anime les communautés en ligne, produit des contenus et veille à l'image de marque sur les réseaux sociaux.",
    key_skills: ["création de contenu", "animation communauté", "veille", "reporting", "modération", "planning éditorial"],
    soft_skills: ["créativité", "réactivité", "communication", "empathie"],
    behavioral_expectations: ["ton de marque", "régularité", "diplomatie"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["réactivité 24/7", "bad buzz", "volume de contenu"],
    success_factors: ["connaissance des plateformes", "créativité", "analyse des performances"],
    main_missions: ["Produire et publier", "Animer la communauté", "Analyser les indicateurs"],
    useful_qualities: ["créativité", "écoute", "organisation", "résilience"],
    recommended_formations: [],
  },
  {
    id: "assistant-rh",
    slug: "assistant-rh",
    title: "Assistant RH",
    sector: "RH",
    description:
      "L'assistant RH soutient les équipes RH sur l'administration du personnel, le recrutement et la vie des collaborateurs.",
    key_skills: ["administration RH", "rédaction", "accueil", "organisation", "outils SIRH", "conformité"],
    soft_skills: ["discrétion", "écoute active", "rigueur", "communication"],
    behavioral_expectations: ["fiabilité", "diplomatie", "confidentialité"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["volume administratif", "demandes urgentes", "confidentialité"],
    success_factors: ["organisation", "relationnel", "maîtrise des process"],
    main_missions: ["Gérer l'administration du personnel", "Soutenir le recrutement", "Accompagner les collaborateurs"],
    useful_qualities: ["organisation", "écoute", "rigueur", "discrétion"],
    recommended_formations: [],
  },
  {
    id: "manager-equipe",
    slug: "manager-equipe",
    title: "Manager d'équipe",
    sector: "Management",
    description:
      "Le manager d'équipe pilote les performances collectives, développe les talents et garantit l'atteinte des objectifs.",
    key_skills: ["leadership", "délégation", "feedback", "organisation", "résolution de conflits", "pilotage"],
    soft_skills: ["écoute active", "assertivité", "empathie", "communication"],
    behavioral_expectations: ["exemplarité", "clarté", "équilibre ferme / bienveillant"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["turnover", "conflits", "pression des résultats"],
    success_factors: ["clarté des objectifs", "coaching", "culture d'équipe"],
    main_missions: ["Fixer et suivre les objectifs", "Développer les collaborateurs", "Résoudre les tensions"],
    useful_qualities: ["écoute", "assertivité", "organisation", "résilience"],
    recommended_formations: [],
  },
  {
    id: "coach-sportif",
    slug: "coach-sportif",
    title: "Coach sportif",
    sector: "Sport",
    description:
      "Le coach sportif conçoit et anime des séances pour aider ses clients à atteindre leurs objectifs de forme ou de performance.",
    key_skills: ["pédagogie", "programmation", "suivi client", "motivation", "sécurité", "vente de prestations"],
    soft_skills: ["énergie", "empathie", "communication", "organisation"],
    behavioral_expectations: ["exemplarité", "encouragement", "adaptation"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["fidélisation", "irrégularité clients", "concurrence"],
    success_factors: ["relation de confiance", "résultats visibles", "régularité"],
    main_missions: ["Évaluer le niveau", "Concevoir des programmes", "Animer et suivre les séances"],
    useful_qualities: ["énergie", "écoute", "persévérance", "organisation"],
    recommended_formations: [],
  },
  {
    id: "charge-developpement-club-sportif",
    slug: "charge-developpement-club-sportif",
    title: "Chargé de développement dans un club sportif",
    sector: "Sport",
    description:
      "Le chargé de développement structure la croissance commerciale et partenariale d'un club sportif.",
    key_skills: ["prospection", "partenariats", "négociation", "événementiel", "fidélisation", "reporting"],
    soft_skills: ["communication", "résilience", "organisation", "négociation"],
    behavioral_expectations: ["ambassadeur de marque", "énergie", "réseau"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["budgets limités", "saisonnalité", "image du club"],
    success_factors: ["réseau local", "propositions win-win", "régularité commerciale"],
    main_missions: ["Développer les partenariats", "Accroître les revenus", "Représenter le club"],
    useful_qualities: ["persuasion", "organisation", "énergie", "résilience"],
    recommended_formations: [],
  },
  {
    id: "responsable-partenariat-sportif",
    slug: "responsable-partenariat-sportif",
    title: "Responsable partenariat sportif",
    sector: "Sport",
    description:
      "Le responsable partenariat sportif conçoit et négocie des collaborations avec des sponsors et des acteurs locaux.",
    key_skills: ["négociation", "sponsoring", "stratégie", "relation partenaires", "événementiel", "reporting"],
    soft_skills: ["communication", "diplomatie", "organisation", "vision"],
    behavioral_expectations: ["représentation", "créativité commerciale", "fiabilité"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["cycles longs", "alignement image/marque", "ROI partenaires"],
    success_factors: ["portefeuille partenaires", "propositions sur-mesure", "suivi post-signature"],
    main_missions: ["Identifier des partenaires", "Négocier les contrats", "Activer les collaborations"],
    useful_qualities: ["négociation", "organisation", "réseau", "résilience"],
    recommended_formations: [],
  },
  {
    id: "charge-projet-evenementiel",
    slug: "charge-projet-evenementiel",
    title: "Chargé de projet événementiel",
    sector: "Événementiel",
    description:
      "Le chargé de projet événementiel conçoit, planifie et coordonne des événements professionnels ou grand public.",
    key_skills: ["gestion de projet", "coordination", "budget", "logistique", "relation prestataires", "communication"],
    soft_skills: ["organisation", "résilience", "communication", "créativité"],
    behavioral_expectations: ["calme sous pression", "rigueur", "sens du détail"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["imprévus", "délais courts", "multi-interlocuteurs"],
    success_factors: ["planification", "réseau prestataires", "gestion du stress"],
    main_missions: ["Cadrer le projet", "Coordonner les équipes", "Piloter le jour J"],
    useful_qualities: ["organisation", "résistance au stress", "communication", "rigueur"],
    recommended_formations: [],
  },
  {
    id: "commercial-b2b",
    slug: "commercial-b2b",
    title: "Commercial B2B",
    sector: "Commerce",
    description:
      "Le commercial B2B développe un portefeuille clients professionnels en combinant prospection, conseil et négociation.",
    key_skills: ["prospection", "négociation", "argumentation", "gestion de compte", "closing", "pipeline"],
    soft_skills: ["résilience", "organisation", "communication assertive", "écoute active"],
    behavioral_expectations: ["posture conseil", "persévérance", "orientation résultats"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["cycles longs", "concurrence", "objectifs"],
    success_factors: ["méthode commerciale", "connaissance secteur", "suivi CRM"],
    main_missions: ["Prospecter et qualifier", "Conduire les négociations", "Développer le portefeuille"],
    useful_qualities: ["persévérance", "organisation", "confiance", "résilience"],
    recommended_formations: [],
  },
  {
    id: "entrepreneur-freelance",
    slug: "entrepreneur-freelance",
    title: "Entrepreneur / freelance",
    sector: "Entrepreneuriat",
    description:
      "L'entrepreneur ou freelance structure son activité, développe sa clientèle et pilote l'ensemble de ses missions.",
    key_skills: ["prospection", "gestion", "négociation", "organisation", "marketing", "facturation"],
    soft_skills: ["autonomie", "résilience", "communication", "adaptabilité"],
    behavioral_expectations: ["initiative", "gestion de l'incertitude", "vision"],
    recommended_badges: ["Profil comportemental EDGE"],
    typical_challenges: ["irrégularité d'activité", "isolement", "charge mentale"],
    success_factors: ["offre claire", "réseau", "discipline commerciale"],
    main_missions: ["Développer la clientèle", "Livrer les prestations", "Piloter l'activité"],
    useful_qualities: ["autonomie", "organisation", "résilience", "confiance"],
    recommended_formations: [],
  },
];

export function getCareerProfileBySlug(slug: string): CareerProfile | undefined {
  return CAREER_PROFILES.find((p) => p.slug === slug);
}

export function searchCareerProfiles(query: string, limit = 12): CareerProfile[] {
  const q = query.trim().toLowerCase();
  if (!q) return CAREER_PROFILES.slice(0, limit);
  return CAREER_PROFILES.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.sector.toLowerCase().includes(q) ||
      p.slug.includes(q),
  ).slice(0, limit);
}
