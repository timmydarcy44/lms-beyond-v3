export type PartnerClub = {
  id: string;
  name: string;
  initials: string;
  logoUrl?: string;
  gradientFrom: string;
  gradientTo: string;
};

export type PartnerProfile = {
  name: string;
  initials: string;
  pack: "Bronze" | "Argent" | "Or";
  isBeyondClient: boolean;
  contractAmountHt: number;
};

export type PartnerPrestation = {
  id: string;
  title: string;
  value: number;
  status: "Actif" | "À venir";
  category: "terrain" | "digital" | "social";
};

export type PartnerNews = {
  id: string;
  date: string;
  title: string;
  excerpt: string;
};

export type PartnerEvent = {
  id: string;
  title: string;
  benefit: string;
  date: string;
  countdown: string;
};

export const partenaireClub: PartnerClub = {
  id: "sudc",
  name: "SU Dives Cabourg",
  initials: "SD",
  logoUrl:
    "https://fqqqejpakbccwvrlolpc.supabase.co/storage/v1/object/public/Beyond%20Network/Logo_SU_Dives_Cabourg_-_2024.svg",
  gradientFrom: "#C8102E",
  gradientTo: "#1B2A4A",
};

export const partenaireProfile: PartnerProfile = {
  name: "Brasserie du Port",
  initials: "BP",
  pack: "Argent",
  isBeyondClient: false,
  contractAmountHt: 5000,
};

export const partenairePrestations: PartnerPrestation[] = [
  {
    id: "panneau-3x1",
    title: "Panneau bord terrain 3m x 1m",
    value: 2500,
    status: "Actif",
    category: "terrain",
  },
  {
    id: "logo-site",
    title: "Logo espace partenaire site web",
    value: 2000,
    status: "Actif",
    category: "digital",
  },
  {
    id: "pack-matchday",
    title: "Pack match day réseaux sociaux",
    value: 3000,
    status: "À venir",
    category: "social",
  },
];

export const partenaireNews: PartnerNews[] = [
  {
    id: "news-1",
    date: "08/03/2026",
    title: "Victoire face à Caen en N3",
    excerpt: "Le club s'impose 2-1 et conforte sa place sur le podium.",
  },
  {
    id: "news-2",
    date: "01/03/2026",
    title: "Nouveau partenariat média local",
    excerpt: "Un partenariat stratégique pour renforcer la visibilité du club.",
  },
  {
    id: "news-3",
    date: "23/02/2026",
    title: "Stage de cohésion pour l'équipe première",
    excerpt: "Un stage intensif pour préparer la fin de saison.",
  },
];

export const partenaireEvents: PartnerEvent[] = [
  {
    id: "event-1",
    title: "Match du 15/03 vs Caen",
    benefit: "2 invitations incluses",
    date: "15/03/2026",
    countdown: "dans 12 jours",
  },
  {
    id: "event-2",
    title: "Soirée partenaires 28/03",
    benefit: "Votre table réservée",
    date: "28/03/2026",
    countdown: "dans 25 jours",
  },
];
