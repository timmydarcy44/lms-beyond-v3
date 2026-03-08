export const mockAlternants = [
  {
    id: "1",
    first_name: "Anaïs",
    last_name: "Dupont",
    email: "anais.dupont@gmail.com",
    phone: "06 12 34 56 78",
    ecole: "ESCOM Paris",
    contrat_type: "Apprentissage",
    rythme_alternance: "3 semaines entreprise / 1 semaine école",
    date_debut: "01/09/2024",
    date_fin: "31/08/2026",
    missions_total: 8,
    missions_validees: 5,
    statut: "en_cours",
  },
  {
    id: "2",
    first_name: "Maxime",
    last_name: "Leroy",
    email: "maxime.leroy@gmail.com",
    phone: "06 98 76 54 32",
    ecole: "IUT Lyon",
    contrat_type: "Professionnalisation",
    rythme_alternance: "4 jours entreprise / 1 jour école",
    date_debut: "01/09/2024",
    date_fin: "31/08/2025",
    missions_total: 10,
    missions_validees: 3,
    statut: "en_retard",
  },
  {
    id: "3",
    first_name: "Louise",
    last_name: "Martin",
    email: "louise.martin@gmail.com",
    phone: "06 11 22 33 44",
    ecole: "CFA Normandie",
    contrat_type: "Apprentissage",
    rythme_alternance: "2 semaines entreprise / 2 semaines école",
    date_debut: "01/09/2024",
    date_fin: "31/08/2026",
    missions_total: 6,
    missions_validees: 6,
    statut: "a_jour",
  },
];

export const mockAlerts = [
  "Évaluation Anaïs Dupont à remplir avant le 08/03",
  "Mission de Maxime Leroy en retard",
];

export const mockPendingMissions = [
  {
    id: "m1",
    learner: "Anaïs Dupont",
    title: "Prospection clients premium",
    dueDate: "08/03",
  },
  {
    id: "m2",
    learner: "Maxime Leroy",
    title: "Audit merchandising",
    dueDate: "10/03",
  },
  {
    id: "m3",
    learner: "Louise Martin",
    title: "Préparation support keynote",
    dueDate: "12/03",
  },
];

export const mockTodos = [
  { id: "t1", label: "Préparer la réunion hebdo" },
  { id: "t2", label: "Relire le rapport de suivi" },
  { id: "t3", label: "Planifier l'évaluation d'Anaïs" },
];

export const mockMissions = [
  {
    id: "mission-1",
    title: "Prospection clients premium",
    description: "Identifier et contacter 10 prospects qualifiés.",
    status: "EN_COURS",
  },
  {
    id: "mission-2",
    title: "Audit merchandising",
    description: "Analyser la présentation en magasin et proposer des améliorations.",
    status: "A_FAIRE",
  },
  {
    id: "mission-3",
    title: "Préparation support keynote",
    description: "Réaliser une présentation synthétique pour la direction.",
    status: "VALIDEE",
  },
  {
    id: "mission-4",
    title: "Débrief visite terrain",
    description: "Faire un compte-rendu des observations terrain.",
    status: "EN_ATTENTE",
  },
  {
    id: "mission-5",
    title: "Simulation rendez-vous",
    description: "Simuler un rendez-vous client et identifier les axes d'amélioration.",
    status: "VALIDEE",
  },
];

export const mockEvaluations = [
  {
    id: "eval-1",
    title: "Bilan mensuel mars",
    status: "A_REMPLIR",
    dueDate: "08/03",
  },
  {
    id: "eval-2",
    title: "Check-in management",
    status: "EN_RETARD",
    dueDate: "10/03",
  },
  {
    id: "eval-3",
    title: "Autonomie & missions",
    status: "A_REMPLIR",
    dueDate: "15/03",
  },
];

export const mockTimeline = [
  {
    id: "h1",
    label: "Mission validée - Prospection clients",
    dateLabel: "il y a 2 jours",
  },
  {
    id: "h2",
    label: "Évaluation envoyée - Bilan janvier",
    dateLabel: "il y a 3 semaines",
  },
  {
    id: "h3",
    label: "Mission invalidée - Visite fournisseur",
    dateLabel: "il y a 1 mois",
  },
];
