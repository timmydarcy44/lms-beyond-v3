export type EnterpriseEmployee = {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  rqth: boolean;
  contract: string;
  engagement: number;
  careAlert: boolean;
  avatar: string;
  disc: { D: number; I: number; S: number; C: number };
  idmcHistory: Array<{ month: string; score: number }>;
  observations: Array<{
    author: string;
    date: string;
    sentiment: "Positif" | "Neutre" | "Alerte";
    message: string;
  }>;
  stressWeekly: number[];
  engagementWeekly: number[];
};

export const enterpriseEmployees: EnterpriseEmployee[] = [
  {
    id: "e-01",
    name: "Camille Morel",
    role: "Chef de projet digital",
    department: "Marketing",
    salary: 42000,
    rqth: true,
    contract: "Alternance",
    engagement: 86,
    careAlert: false,
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    disc: { D: 62, I: 78, S: 70, C: 55 },
    idmcHistory: [
      { month: "Oct", score: 62 },
      { month: "Nov", score: 64 },
      { month: "Déc", score: 65 },
      { month: "Jan", score: 66 },
      { month: "Fév", score: 68 },
      { month: "Mar", score: 69 },
      { month: "Avr", score: 70 },
      { month: "Mai", score: 71 },
      { month: "Juin", score: 72 },
      { month: "Juil", score: 73 },
      { month: "Août", score: 74 },
      { month: "Sep", score: 75 },
    ],
    observations: [
      {
        author: "S. Marin (Manager)",
        date: "2024-05-12",
        sentiment: "Positif",
        message: "Autonomie en hausse, excellente coordination avec l'équipe CRM.",
      },
      {
        author: "P. Lopez (RH)",
        date: "2024-02-08",
        sentiment: "Neutre",
        message: "Objectifs atteints, besoin d'accélérer sur la planification.",
      },
    ],
    stressWeekly: [62, 58, 55],
    engagementWeekly: [78, 81, 84],
  },
  {
    id: "e-02",
    name: "Mathieu Lemaire",
    role: "Analyste RH",
    department: "RH",
    salary: 38000,
    rqth: false,
    contract: "CDI",
    engagement: 72,
    careAlert: true,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    disc: { D: 48, I: 52, S: 82, C: 76 },
    idmcHistory: [
      { month: "Oct", score: 58 },
      { month: "Nov", score: 57 },
      { month: "Déc", score: 56 },
      { month: "Jan", score: 55 },
      { month: "Fév", score: 54 },
      { month: "Mar", score: 53 },
      { month: "Avr", score: 52 },
      { month: "Mai", score: 51 },
      { month: "Juin", score: 50 },
      { month: "Juil", score: 49 },
      { month: "Août", score: 48 },
      { month: "Sep", score: 47 },
    ],
    observations: [
      {
        author: "C. Durant (Manager)",
        date: "2024-06-15",
        sentiment: "Alerte",
        message: "Charge mentale élevée. À suivre avec point hebdo.",
      },
      {
        author: "Equipe RH",
        date: "2024-03-22",
        sentiment: "Neutre",
        message: "Rigueur excellente, mais communication interne à renforcer.",
      },
    ],
    stressWeekly: [88, 85, 90],
    engagementWeekly: [38, 35, 32],
  },
  {
    id: "e-03",
    name: "Sara Benali",
    role: "Responsable ventes",
    department: "Sales",
    salary: 52000,
    rqth: false,
    contract: "CDI",
    engagement: 91,
    careAlert: false,
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    disc: { D: 80, I: 74, S: 60, C: 44 },
    idmcHistory: [
      { month: "Oct", score: 74 },
      { month: "Nov", score: 75 },
      { month: "Déc", score: 76 },
      { month: "Jan", score: 77 },
      { month: "Fév", score: 78 },
      { month: "Mar", score: 79 },
      { month: "Avr", score: 80 },
      { month: "Mai", score: 81 },
      { month: "Juin", score: 82 },
      { month: "Juil", score: 83 },
      { month: "Août", score: 84 },
      { month: "Sep", score: 85 },
    ],
    observations: [
      {
        author: "N. Besson (Manager)",
        date: "2024-04-02",
        sentiment: "Positif",
        message: "Excellente dynamique de vente, leadership naturel.",
      },
    ],
    stressWeekly: [52, 49, 50],
    engagementWeekly: [90, 92, 91],
  },
  {
    id: "e-04",
    name: "Louis Bertrand",
    role: "Ingénieur data",
    department: "Tech",
    salary: 60000,
    rqth: true,
    contract: "CDD",
    engagement: 66,
    careAlert: true,
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    disc: { D: 55, I: 42, S: 66, C: 88 },
    idmcHistory: [
      { month: "Oct", score: 63 },
      { month: "Nov", score: 64 },
      { month: "Déc", score: 64 },
      { month: "Jan", score: 65 },
      { month: "Fév", score: 66 },
      { month: "Mar", score: 66 },
      { month: "Avr", score: 67 },
      { month: "Mai", score: 68 },
      { month: "Juin", score: 68 },
      { month: "Juil", score: 69 },
      { month: "Août", score: 69 },
      { month: "Sep", score: 70 },
    ],
    observations: [
      {
        author: "S. Vidal (Tech Lead)",
        date: "2024-01-18",
        sentiment: "Neutre",
        message: "Très fiable, attention à l'équilibre charge/récupération.",
      },
    ],
    stressWeekly: [84, 82, 86],
    engagementWeekly: [42, 39, 37],
  },
  {
    id: "e-05",
    name: "Inès Duarte",
    role: "Office manager",
    department: "Ops",
    salary: 34000,
    rqth: false,
    contract: "Stage",
    engagement: 79,
    careAlert: false,
    avatar:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=80",
    disc: { D: 40, I: 68, S: 82, C: 58 },
    idmcHistory: [
      { month: "Oct", score: 70 },
      { month: "Nov", score: 71 },
      { month: "Déc", score: 71 },
      { month: "Jan", score: 72 },
      { month: "Fév", score: 72 },
      { month: "Mar", score: 73 },
      { month: "Avr", score: 74 },
      { month: "Mai", score: 74 },
      { month: "Juin", score: 75 },
      { month: "Juil", score: 75 },
      { month: "Août", score: 76 },
      { month: "Sep", score: 76 },
    ],
    observations: [
      {
        author: "D. Moreau (Manager)",
        date: "2024-05-30",
        sentiment: "Positif",
        message: "Organisation solide, posture très rassurante pour l'équipe.",
      },
    ],
    stressWeekly: [58, 54, 56],
    engagementWeekly: [77, 79, 78],
  },
];
