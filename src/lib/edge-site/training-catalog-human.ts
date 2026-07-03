export type EdgeSpecialist = {
  id: string;
  name: string;
  specialty: string;
  photoUrl: string;
  missionsCount: number;
  companiesCount: number;
  rating: number;
  badges?: string[];
};

export type EdgeClientLogo = {
  name: string;
  initials: string;
};

export type EdgeTestimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  photoUrl: string;
};

export const EDGE_IMPACT_STATS = {
  collaboratorsTrained: "12 400+",
  certifications: "3 800+",
  satisfaction: "96 %",
  completionRate: "89 %",
} as const;

export const EDGE_TRUSTED_LOGOS: EdgeClientLogo[] = [
  { name: "Groupe Atlantique", initials: "GA" },
  { name: "Havre Industrie", initials: "HI" },
  { name: "Normandie Retail", initials: "NR" },
  { name: "TechMaritime", initials: "TM" },
  { name: "LogisCo", initials: "LC" },
  { name: "Energie Plus", initials: "EP" },
];

export const EDGE_SPECIALISTS: EdgeSpecialist[] = [
  {
    id: "jessica",
    name: "Jessica Contentin",
    specialty: "Neurosciences & comportement",
    photoUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop&crop=face",
    missionsCount: 214,
    companiesCount: 148,
    rating: 5,
    badges: ["Open Badge", "EDGE Certified"],
  },
  {
    id: "timmy",
    name: "Timmy Darcy",
    specialty: "IA & transformation digitale",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
    missionsCount: 186,
    companiesCount: 92,
    rating: 5,
    badges: ["Open Badges", "IA Strategy"],
  },
  {
    id: "marie",
    name: "Marie Lefort",
    specialty: "Leadership & management",
    photoUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop&crop=face",
    missionsCount: 167,
    companiesCount: 121,
    rating: 5,
    badges: ["EDGE Certified"],
  },
  {
    id: "karim",
    name: "Karim Benali",
    specialty: "Vente & négociation",
    photoUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face",
    missionsCount: 143,
    companiesCount: 78,
    rating: 4.9,
    badges: ["Sales Expert"],
  },
];

export const EDGE_TESTIMONIALS: EdgeTestimonial[] = [
  {
    id: "1",
    quote:
      "Nos managers ont enfin une méthode concrète pour accompagner leurs équipes. Les ateliers EDGE sont vivants, pas théoriques.",
    author: "Sophie Martin",
    role: "DRH",
    company: "Groupe Atlantique",
    photoUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&crop=face",
  },
  {
    id: "2",
    quote:
      "Le réseau de formateurs EDGE nous a permis de déployer l'IA sur 3 sites en 6 semaines. Résultats mesurables dès le premier mois.",
    author: "Thomas Renard",
    role: "Directeur formation",
    company: "TechMaritime",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&crop=face",
  },
  {
    id: "3",
    quote:
      "Ce qui nous a convaincus : des visages, des spécialistes identifiés, des preuves. On sait exactement qui intervient chez nous.",
    author: "Émilie Durand",
    role: "Responsable L&D",
    company: "Normandie Retail",
    photoUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face",
  },
];

export const EDGE_LIFESTYLE_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop",
    alt: "Atelier collaboratif en entreprise",
  },
  {
    url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&h=600&fit=crop",
    alt: "Session de coaching en petit groupe",
  },
  {
    url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop",
    alt: "Réunion stratégique entre managers",
  },
];
