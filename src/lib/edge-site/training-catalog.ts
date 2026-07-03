export type TrainingFormat = "presentiel" | "distanciel" | "blended";

export type TrainingLevel = 1 | 2 | 3 | 4 | 5;

export type TrainingBadge = {
  id: string;
  name: string;
};

export type TrainingModule = {
  id: string;
  code: string;
  domainId: string;
  title: string;
  level: TrainingLevel;
  objectives: string[];
  deliverables: string[];
  badgeId: string;
  formats: TrainingFormat[];
};

export type TrainingDomain = {
  id: string;
  title: string;
  summary: string;
  themeLabel: string;
  badgeId: string;
};

export const EDGE_TRAINING_LEVELS: { level: TrainingLevel; label: string }[] = [
  { level: 1, label: "Fondamentaux" },
  { level: 2, label: "Praticien" },
  { level: 3, label: "Confirmé" },
  { level: 4, label: "Expert" },
  { level: 5, label: "Stratège" },
];

export const EDGE_TRAINING_BADGES: TrainingBadge[] = [
  { id: "ia-strategy", name: "IA Strategy Expert" },
  { id: "commercial-automation", name: "Commercial Automation Expert" },
  { id: "behavioral-intelligence", name: "Behavioral Intelligence Expert" },
  { id: "communication-strategist", name: "Stratège Communication Expert" },
  { id: "leader-expert", name: "Leader Expert" },
  { id: "negotiation-expert", name: "Négociation Expert" },
  { id: "sales-expert", name: "Sales Performance Expert" },
  { id: "soft-skills-expert", name: "Soft Skills Expert" },
  { id: "hr-expert", name: "RH & Talents Expert" },
  { id: "trainer-expert", name: "Trainer Expert" },
  { id: "project-expert", name: "Project Expert" },
  { id: "productivity-expert", name: "Productivity Expert" },
];

export const EDGE_TRAINING_DOMAINS: TrainingDomain[] = [
  {
    id: "intelligence-artificielle",
    title: "Intelligence Artificielle",
    summary: "Comprendre, utiliser et déployer l'IA dans les pratiques professionnelles.",
    themeLabel: "IA & transformation",
    badgeId: "ia-strategy",
  },
  {
    id: "automatisation-ia-commerciale",
    title: "Automatisation & IA commerciale",
    summary: "Automatiser la prospection, le CRM, le reporting et la relation client.",
    themeLabel: "Performance commerciale",
    badgeId: "commercial-automation",
  },
  {
    id: "analyse-comportementale",
    title: "Analyse comportementale",
    summary: "Comprendre les comportements pour mieux communiquer, vendre et manager.",
    themeLabel: "Comportement & relation",
    badgeId: "behavioral-intelligence",
  },
  {
    id: "communication-storytelling",
    title: "Communication & Storytelling",
    summary: "Structurer ses messages, prendre la parole et influencer avec clarté.",
    themeLabel: "Communication",
    badgeId: "communication-strategist",
  },
  {
    id: "leadership-management",
    title: "Leadership & Management",
    summary: "Développer son leadership, manager les profils différents et conduire le changement.",
    themeLabel: "Management",
    badgeId: "leader-expert",
  },
  {
    id: "negociation-influence",
    title: "Négociation & Influence",
    summary: "Préparer, mener et conclure des négociations à fort enjeu.",
    themeLabel: "Influence",
    badgeId: "negotiation-expert",
  },
  {
    id: "vente-prospection",
    title: "Vente & Prospection",
    summary: "Structurer un pipe, qualifier les opportunités et conclure avec méthode.",
    themeLabel: "Vente",
    badgeId: "sales-expert",
  },
  {
    id: "soft-skills",
    title: "Soft skills",
    summary: "Renforcer l'intelligence émotionnelle, la résilience et la collaboration.",
    themeLabel: "Savoir-être",
    badgeId: "soft-skills-expert",
  },
  {
    id: "ressources-humaines",
    title: "Ressources Humaines",
    summary: "Recruter, développer et fidéliser les talents avec des pratiques modernes.",
    themeLabel: "RH",
    badgeId: "hr-expert",
  },
  {
    id: "formation-formateurs",
    title: "Formation de formateurs",
    summary: "Concevoir, animer et évaluer des parcours pédagogiques exigeants.",
    themeLabel: "Pédagogie",
    badgeId: "trainer-expert",
  },
  {
    id: "gestion-projet",
    title: "Gestion de projet",
    summary: "Piloter des projets complexes avec méthode, agilité et visibilité.",
    themeLabel: "Projet",
    badgeId: "project-expert",
  },
  {
    id: "productivite-organisation",
    title: "Productivité & organisation",
    summary: "Gagner en efficacité individuelle et collective au quotidien.",
    themeLabel: "Organisation",
    badgeId: "productivity-expert",
  },
];

function m(
  code: string,
  domainId: string,
  title: string,
  level: TrainingLevel,
  objectives: string[],
  deliverables: string[],
  badgeId: string,
  formats: TrainingFormat[] = ["presentiel", "distanciel", "blended"],
): TrainingModule {
  return { id: code.toLowerCase(), code, domainId, title, level, objectives, deliverables, badgeId, formats };
}

export const EDGE_TRAINING_MODULES: TrainingModule[] = [
  // Intelligence Artificielle (8)
  m("IA-01", "intelligence-artificielle", "Comprendre l'IA : ce que c'est, ce que ce n'est pas", 1, ["Démystifier l'IA", "Identifier les cas d'usage métier"], ["Cartographie des usages IA"], "ia-strategy"),
  m("IA-02", "intelligence-artificielle", "Les outils IA du quotidien au travail", 2, ["Sélectionner les bons outils", "Intégrer l'IA dans ses rituels"], ["Kit d'outils IA personnalisé"], "ia-strategy"),
  m("IA-03", "intelligence-artificielle", "Écrire de bons prompts", 2, ["Structurer des prompts efficaces", "Itérer avec méthode"], ["Bibliothèque de prompts métier"], "ia-strategy"),
  m("IA-04", "intelligence-artificielle", "IA générative en équipe", 3, ["Collaborer avec l'IA", "Partager les bonnes pratiques"], ["Charte d'usage IA d'équipe"], "ia-strategy"),
  m("IA-05", "intelligence-artificielle", "Automatiser des tâches avec l'IA", 3, ["Identifier les tâches automatisables", "Concevoir des workflows"], ["Workflow IA documenté"], "ia-strategy"),
  m("IA-06", "intelligence-artificielle", "Éthique et conformité de l'IA", 3, ["Anticiper les risques", "Cadrer un usage responsable"], ["Checklist conformité IA"], "ia-strategy"),
  m("IA-07", "intelligence-artificielle", "Travailler avec l'IA en mode collaboratif", 4, ["Co-construire avec l'IA", "Valider les outputs"], ["Protocole de validation IA"], "ia-strategy"),
  m("IA-08", "intelligence-artificielle", "Construire une stratégie de transformation IA", 5, ["Prioriser les chantiers", "Déployer à l'échelle"], ["Roadmap transformation IA"], "ia-strategy", ["presentiel", "blended"]),

  // Automatisation & IA commerciale (7)
  m("AUTO-01", "automatisation-ia-commerciale", "Introduction à l'automatisation commerciale", 1, ["Cartographier les process", "Identifier les gains rapides"], ["Carte des process commerciaux"], "commercial-automation"),
  m("AUTO-02", "automatisation-ia-commerciale", "Utiliser l'IA pour la prospection commerciale", 2, ["Qualifier les comptes", "Personnaliser à l'échelle"], ["Séquences de prospection IA"], "commercial-automation"),
  m("AUTO-03", "automatisation-ia-commerciale", "Automatiser son CRM et son reporting", 2, ["Structurer le pipeline", "Automatiser les relances"], ["CRM configuré + reporting"], "commercial-automation"),
  m("AUTO-04", "automatisation-ia-commerciale", "Construire un workflow automatisé no-code", 3, ["Modéliser un workflow", "Tester et itérer"], ["Workflow no-code opérationnel"], "commercial-automation"),
  m("AUTO-05", "automatisation-ia-commerciale", "Scoring et priorisation des leads", 3, ["Définir des critères de scoring", "Prioriser les actions"], ["Modèle de scoring leads"], "commercial-automation"),
  m("AUTO-06", "automatisation-ia-commerciale", "Piloter la performance commerciale avec l'IA", 4, ["Lire les signaux faibles", "Décider avec les données"], ["Dashboard commercial IA"], "commercial-automation"),
  m("AUTO-07", "automatisation-ia-commerciale", "Déployer une stratégie d'automatisation à l'échelle", 5, ["Industrialiser les workflows", "Former les équipes"], ["Plan de déploiement commercial"], "commercial-automation", ["blended", "presentiel"]),

  // Analyse comportementale (8)
  m("COMPORT-01", "analyse-comportementale", "Fondements de l'analyse comportementale", 1, ["Comprendre les modèles", "Observer sans juger"], ["Grille d'observation comportementale"], "behavioral-intelligence"),
  m("COMPORT-02", "analyse-comportementale", "Se connaître : identifier son profil", 2, ["Identifier ses préférences", "Adapter son style"], ["Profil comportemental personnel"], "behavioral-intelligence"),
  m("COMPORT-03", "analyse-comportementale", "Lire le comportement de ses interlocuteurs", 2, ["Décoder les signaux", "Ajuster sa posture"], ["Fiche lecture comportementale"], "behavioral-intelligence"),
  m("COMPORT-04", "analyse-comportementale", "Adapter sa communication selon le profil", 3, ["Personnaliser le message", "Créer de l'alignement"], ["Scripts adaptés par profil"], "behavioral-intelligence"),
  m("COMPORT-05", "analyse-comportementale", "Analyse comportementale appliquée à la vente", 3, ["Adapter le discours commercial", "Lever les résistances"], ["Grille vente comportementale"], "behavioral-intelligence"),
  m("COMPORT-06", "analyse-comportementale", "Analyse comportementale appliquée au management", 4, ["Manager les différences", "Prévenir les conflits"], ["Plan management situationnel"], "behavioral-intelligence"),
  m("COMPORT-07", "analyse-comportementale", "Comportement sous stress et situations difficiles", 4, ["Gérer le stress relationnel", "Rester centré"], ["Protocole gestion du stress"], "behavioral-intelligence"),
  m("COMPORT-08", "analyse-comportementale", "Animer un entretien comportemental", 5, ["Structurer l'entretien", "Objectiver les observations"], ["Trame d'entretien expert"], "behavioral-intelligence"),

  // Communication & Storytelling (8)
  m("COMM-01", "communication-storytelling", "Fondamentaux de la communication interpersonnelle", 1, ["Clarifier son message", "Écouter activement"], ["Message clé personnel"], "communication-strategist"),
  m("COMM-02", "communication-storytelling", "Structurer un discours impactant", 2, ["Construire une trame", "Captiver dès les premières secondes"], ["Structure de discours"], "communication-strategist"),
  m("COMM-03", "communication-storytelling", "Prise de parole en public : présence", 2, ["Maîtriser sa présence", "Gérer le trac"], ["Plan de prise de parole"], "communication-strategist"),
  m("COMM-04", "communication-storytelling", "Convaincre par l'argumentation", 3, ["Construire un argumentaire", "Répondre aux objections"], ["Argumentaire structuré"], "communication-strategist"),
  m("COMM-05", "communication-storytelling", "Prise de parole en public : structure et impact", 3, ["Structurer un pitch", "Engager l'audience"], ["Pitch enregistré / slides"], "communication-strategist"),
  m("COMM-06", "communication-storytelling", "Storytelling professionnel", 4, ["Raconter une histoire métier", "Créer de l'émotion utile"], ["Storytelling corporate"], "communication-strategist"),
  m("COMM-07", "communication-storytelling", "Communiquer en situation de crise", 4, ["Anticiper les crises", "Répondre avec méthode"], ["Plan de communication crise"], "communication-strategist"),
  m("COMM-08", "communication-storytelling", "Communication stratégique et influence organisationnelle", 5, ["Influencer les décisions", "Aligner les parties prenantes"], ["Stratégie d'influence"], "communication-strategist", ["presentiel", "blended"]),

  // Leadership & Management (7)
  m("LEAD-01", "leadership-management", "C'est quoi un leader ? Mythes et réalités", 1, ["Définir le leadership", "Identifier ses leviers"], ["Auto-diagnostic leadership"], "leader-expert"),
  m("LEAD-02", "leadership-management", "Identifier et affirmer son style de leadership", 2, ["Connaître son style", "L'affirmer avec authenticité"], ["Profil de leadership"], "leader-expert"),
  m("LEAD-03", "leadership-management", "Fixer des objectifs et déléguer efficacement", 2, ["Fixer des objectifs clairs", "Déléguer avec confiance"], ["Cahier des charges délégation"], "leader-expert"),
  m("LEAD-04", "leadership-management", "Manager des profils différents", 3, ["Adapter son management", "Pratiquer le situationnel"], ["Grille management situationnel"], "leader-expert"),
  m("LEAD-05", "leadership-management", "Donner du sens : aligner équipe et mission", 3, ["Créer du sens", "Mobiliser autour d'un cap"], ["Récit managérial d'équipe"], "leader-expert"),
  m("LEAD-06", "leadership-management", "Conduire le changement", 4, ["Anticiper les résistances", "Embarquer les équipes"], ["Plan de conduite du changement"], "leader-expert"),
  m("LEAD-07", "leadership-management", "Leadership éthique et responsabilité", 5, ["Décider avec éthique", "Incarner les valeurs"], ["Charte de leadership"], "leader-expert", ["presentiel", "blended"]),

  // Négociation & Influence (7)
  m("NEGO-01", "negociation-influence", "Les bases de la négociation", 1, ["Distinguer positions et intérêts", "Préparer un premier cadre"], ["Fiche de préparation NEGO"], "negotiation-expert"),
  m("NEGO-02", "negociation-influence", "Préparer une négociation : BATNA", 2, ["Calculer sa BATNA", "Définir ses limites"], ["Grille BATNA complète"], "negotiation-expert"),
  m("NEGO-03", "negociation-influence", "Assertivité : s'affirmer sans s'imposer", 2, ["S'affirmer avec respect", "Gérer les tensions"], ["Scripts assertifs"], "negotiation-expert"),
  m("NEGO-04", "negociation-influence", "Négocier en situation de tension", 3, ["Désamorcer les conflits", "Trouver des issues"], ["Protocole négociation tendue"], "negotiation-expert"),
  m("NEGO-05", "negociation-influence", "Gérer les objections avec calme", 3, ["Identifier les objections", "Y répondre avec méthode"], ["Banque de réponses"], "negotiation-expert"),
  m("NEGO-06", "negociation-influence", "Négociation complexe : multi-parties", 4, ["Cartographier les acteurs", "Construire des alliances"], ["Carte des parties prenantes"], "negotiation-expert"),
  m("NEGO-07", "negociation-influence", "Négociation stratégique organisationnelle", 5, ["Négocier à haut enjeu", "Sécuriser les accords"], ["Accord-cadre négocié"], "negotiation-expert", ["presentiel", "blended"]),

  // Vente & Prospection (7)
  m("VENTE-01", "vente-prospection", "Les fondamentaux de la vente consultative", 1, ["Comprendre le cycle de vente", "Qualifier un besoin"], ["Grille de qualification"], "sales-expert"),
  m("VENTE-02", "vente-prospection", "Construire un pipe commercial fiable", 2, ["Structurer le pipe", "Prioriser les comptes"], ["Pipeline documenté"], "sales-expert"),
  m("VENTE-03", "vente-prospection", "Prospection multicanale efficace", 2, ["Combiner canaux", "Personnaliser les approches"], ["Séquence multicanale"], "sales-expert"),
  m("VENTE-04", "vente-prospection", "Conduire un rendez-vous de découverte", 3, ["Poser les bonnes questions", "Synthétiser les enjeux"], ["Trame entretien découverte"], "sales-expert"),
  m("VENTE-05", "vente-prospection", "Traiter les objections et conclure", 3, ["Lever les freins", "Conclure avec méthode"], ["Scripts de closing"], "sales-expert"),
  m("VENTE-06", "vente-prospection", "Account management et fidélisation", 4, ["Développer les comptes", "Anticiper les renouvellements"], ["Plan de compte"], "sales-expert"),
  m("VENTE-07", "vente-prospection", "Piloter sa performance commerciale", 4, ["Suivre ses KPI", "Ajuster sa stratégie"], ["Tableau de bord commercial"], "sales-expert"),

  // Soft skills (6)
  m("SOFT-01", "soft-skills", "Comprendre ses émotions", 1, ["Nommer ses émotions", "Réguler ses réactions"], ["Journal émotionnel"], "soft-skills-expert"),
  m("SOFT-02", "soft-skills", "Intelligence émotionnelle au travail", 2, ["Lire les émotions des autres", "Adapter sa réponse"], ["Plan développement IE"], "soft-skills-expert"),
  m("SOFT-03", "soft-skills", "Gestion du stress et de la charge", 2, ["Identifier ses signaux", "Installer des routines"], ["Rituel anti-stress"], "soft-skills-expert"),
  m("SOFT-04", "soft-skills", "Développer son empathie professionnelle", 3, ["Pratiquer l'écoute empathique", "Créer de la confiance"], ["Fiche entretien empathique"], "soft-skills-expert"),
  m("SOFT-05", "soft-skills", "Résilience : rebondir face à l'échec", 3, ["Analyser un échec", "Rebondir avec méthode"], ["Plan de résilience"], "soft-skills-expert"),
  m("SOFT-06", "soft-skills", "Collaboration et intelligence collective", 4, ["Co-construire en équipe", "Faciliter la coopération"], ["Charte de collaboration"], "soft-skills-expert"),

  // RH (7)
  m("RH-01", "ressources-humaines", "Fondamentaux du recrutement efficace", 1, ["Définir un besoin", "Rédiger une fiche de poste"], ["Fiche de poste opérationnelle"], "hr-expert"),
  m("RH-02", "ressources-humaines", "Sourcing et attractivité des talents", 2, ["Diversifier les canaux", "Renforcer la marque employeur"], ["Plan de sourcing"], "hr-expert"),
  m("RH-03", "ressources-humaines", "Conduire un entretien de recrutement", 2, ["Structurer l'entretien", "Évaluer avec objectivité"], ["Grille d'entretien"], "hr-expert"),
  m("RH-04", "ressources-humaines", "Onboarding et intégration", 3, ["Structurer l'accueil", "Sécuriser les 90 premiers jours"], ["Parcours d'onboarding"], "hr-expert"),
  m("RH-05", "ressources-humaines", "Développement des talents", 3, ["Identifier les potentiels", "Construire des plans"], ["Plan de développement"], "hr-expert"),
  m("RH-06", "ressources-humaines", "GPEC et mobilité interne", 4, ["Cartographier les compétences", "Anticiper les besoins"], ["Carte des compétences RH"], "hr-expert"),
  m("RH-07", "ressources-humaines", "Piloter la performance RH", 4, ["Suivre les indicateurs RH", "Arbitrer les priorités"], ["Dashboard RH"], "hr-expert"),

  // Formation de formateurs (6)
  m("FORM-01", "formation-formateurs", "Ingénierie pédagogique : les fondamentaux", 1, ["Analyser un besoin", "Définir des objectifs"], ["Fiche ingénierie pédagogique"], "trainer-expert"),
  m("FORM-02", "formation-formateurs", "Concevoir un parcours blended", 2, ["Mixer les formats", "Séquencer les apprentissages"], ["Architecture de parcours"], "trainer-expert"),
  m("FORM-03", "formation-formateurs", "Animer avec impact", 2, ["Engager les apprenants", "Gérer la dynamique de groupe"], ["Scénario de session"], "trainer-expert"),
  m("FORM-04", "formation-formateurs", "Évaluer les acquis et certifier", 3, ["Concevoir des évaluations", "Délivrer des badges"], ["Grille d'évaluation"], "trainer-expert"),
  m("FORM-05", "formation-formateurs", "Produire des supports digitaux", 3, ["Créer des contenus clairs", "Utiliser le digital avec méthode"], ["Module e-learning"], "trainer-expert"),
  m("FORM-06", "formation-formateurs", "Devenir formateur certifié EDGE", 4, ["Répondre aux standards EDGE", "Préparer sa certification"], ["Portfolio formateur"], "trainer-expert", ["blended", "presentiel"]),

  // Gestion de projet (6)
  m("PROJ-01", "gestion-projet", "Initier et cadrer un projet", 1, ["Définir le périmètre", "Identifier les parties prenantes"], ["Note de cadrage"], "project-expert"),
  m("PROJ-02", "gestion-projet", "Planifier et organiser un projet", 2, ["Construire un planning", "Allouer les ressources"], ["Planning projet"], "project-expert"),
  m("PROJ-03", "gestion-projet", "Méthodes agiles : Scrum & Kanban", 2, ["Comprendre l'agile", "Mettre en place un board"], ["Board Kanban opérationnel"], "project-expert"),
  m("PROJ-04", "gestion-projet", "Piloter les risques et les dépendances", 3, ["Cartographier les risques", "Mettre des plans B"], ["Registre des risques"], "project-expert"),
  m("PROJ-05", "gestion-projet", "Animer une équipe projet", 3, ["Coordonner les contributeurs", "Tenir les rituels"], ["Rituels projet"], "project-expert"),
  m("PROJ-06", "gestion-projet", "Clôturer et capitaliser un projet", 4, ["Clôturer proprement", "Diffuser les apprentissages"], ["Bilan de projet"], "project-expert"),

  // Productivité (6)
  m("PROD-01", "productivite-organisation", "Organiser son temps et ses priorités", 1, ["Prioriser avec méthode", "Protéger son temps"], ["Matrice de priorités"], "productivity-expert"),
  m("PROD-02", "productivite-organisation", "Gestion de l'information et des outils", 2, ["Structurer ses outils", "Réduire le bruit"], ["Système d'organisation personnel"], "productivity-expert"),
  m("PROD-03", "productivite-organisation", "Productivité digitale", 2, ["Automatiser les tâches répétitives", "Gagner en fluidité"], ["Stack productivité"], "productivity-expert"),
  m("PROD-04", "productivite-organisation", "Conduire des réunions efficaces", 3, ["Préparer et animer", "Décider et suivre"], ["Trame de réunion"], "productivity-expert"),
  m("PROD-05", "productivite-organisation", "Travail en mode projet transverse", 3, ["Coordonner sans autorité hiérarchique", "Avancer collectivement"], ["Plan de coordination"], "productivity-expert"),
  m("PROD-06", "productivite-organisation", "Culture de la performance durable", 4, ["Installer des rituels", "Mesurer sans surcharge"], ["Tableau de bord productivité"], "productivity-expert"),
];

export const EDGE_CATALOG_STATS = {
  domains: EDGE_TRAINING_DOMAINS.length,
  modules: EDGE_TRAINING_MODULES.length,
  parcours: 13,
  levels: EDGE_TRAINING_LEVELS.length,
};

export function getTrainingDomain(id: string): TrainingDomain | undefined {
  return EDGE_TRAINING_DOMAINS.find((d) => d.id === id);
}

export function getModulesByDomain(domainId: string): TrainingModule[] {
  return EDGE_TRAINING_MODULES.filter((mod) => mod.domainId === domainId);
}

export function getModuleById(id: string): TrainingModule | undefined {
  return EDGE_TRAINING_MODULES.find((mod) => mod.id === id || mod.code.toLowerCase() === id);
}

export function searchTrainingCatalog(query: string): {
  domains: TrainingDomain[];
  modules: TrainingModule[];
} {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { domains: EDGE_TRAINING_DOMAINS, modules: EDGE_TRAINING_MODULES };
  }
  const domains = EDGE_TRAINING_DOMAINS.filter(
    (d) =>
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.themeLabel.toLowerCase().includes(q),
  );
  const modules = EDGE_TRAINING_MODULES.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q) ||
      m.objectives.some((o) => o.toLowerCase().includes(q)) ||
      getTrainingDomain(m.domainId)?.title.toLowerCase().includes(q),
  );
  return { domains, modules };
}

export function getBadgeById(badgeId: string): TrainingBadge | undefined {
  return EDGE_TRAINING_BADGES.find((b) => b.id === badgeId);
}

export function getLevelLabel(level: TrainingLevel): string {
  return EDGE_TRAINING_LEVELS.find((l) => l.level === level)?.label ?? `Niveau ${level}`;
}

export function formatTrainingFormats(formats: TrainingFormat[]): string {
  const labels: Record<TrainingFormat, string> = {
    presentiel: "Présentiel",
    distanciel: "Distanciel",
    blended: "Blended",
  };
  return formats.map((f) => labels[f]).join(" · ");
}
