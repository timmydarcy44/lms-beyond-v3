export const MOS = {
  red: "#C8102E",
  redDark: "#8B0000",
  white: "#FFFFFF",
  gray: "#F5F5F5",
  black: "#111111",
} as const;

export const NAV_LEFT = [
  { label: "Notre Club", href: "#adn" },
  { label: "Nos Équipes", href: "#chiffres" },
  { label: "Nos Actualités", href: "#actualites" },
] as const;

export const NAV_RIGHT = [
  { label: "Les 100", href: "#les-100" },
  { label: "Santé-Vous Mieux Sport", href: "#adn" },
] as const;

export const CONTACT_LINK = {
  href: "#contact",
  label: "Nous contacter",
} as const;

export const PARTNER_CTA = {
  label: "Espace partenaire",
  href: "/dashboard/partenaire",
} as const;

export const BOUTIQUE_LINK = {
  label: "Boutique",
  href: "/mos/boutique",
} as const;

export type MatchStatus = "TERMINÉ" | "À VENIR" | "EN DIRECT";

export type CalendarMatch = {
  id: string;
  category: "MASC" | "FEM";
  categoryLabel: string;
  status: MatchStatus;
  competition: string;
  home: { name: string; score?: number; initials?: string };
  away: { name: string; score?: number; initials?: string };
  date: string;
  kickoff: string;
  venue: string;
  dateLabel: string;
  presentation: string;
  ticketPrice?: number;
};

export const CALENDAR_MATCHES: CalendarMatch[] = [
  {
    id: "1",
    category: "MASC",
    categoryLabel: "R1",
    status: "TERMINÉ",
    competition: "R1 Normandie",
    home: { name: "MOS Caen", score: 2 },
    away: { name: "FC Hérouville", score: 1, initials: "FH" },
    date: "08/03",
    kickoff: "15h00",
    venue: "Stade Joseph Déterville",
    dateLabel: "Samedi 8 Mars",
    presentation:
      "Victoire importante pour les Rouge et Blanc face à un adversaire direct du haut de tableau. Une performance collective solide et une efficacité récompensée.",
    ticketPrice: 8,
  },
  {
    id: "2",
    category: "FEM",
    categoryLabel: "R1",
    status: "TERMINÉ",
    competition: "R1 Féminine",
    home: { name: "MOS Caen", score: 3 },
    away: { name: "Caen FC", score: 0, initials: "CFC" },
    date: "01/03",
    kickoff: "14h30",
    venue: "Stade Joseph Déterville",
    dateLabel: "Samedi 1 Mars",
    presentation:
      "Large succès des féminines MOS qui confirment leur dynamique en championnat. Domination du début à la fin devant les supporters maladrins.",
    ticketPrice: 5,
  },
  {
    id: "3",
    category: "MASC",
    categoryLabel: "R1",
    status: "TERMINÉ",
    competition: "R1 Normandie",
    home: { name: "MOS Caen", score: 1 },
    away: { name: "AS Lisieux", score: 1, initials: "ASL" },
    date: "23/02",
    kickoff: "15h00",
    venue: "Stade Joseph Déterville",
    dateLabel: "Dimanche 23 Février",
    presentation:
      "Match équilibré entre deux formations ambitieuses. La MOS pousse jusqu'au bout mais doit se contenter du partage des points.",
    ticketPrice: 8,
  },
  {
    id: "4",
    category: "FEM",
    categoryLabel: "R1",
    status: "À VENIR",
    competition: "R1 Féminine",
    home: { name: "MOS Caen", initials: "MOS" },
    away: { name: "FC Rouen", initials: "FCR" },
    date: "15/03",
    kickoff: "15h00",
    venue: "Stade Joseph Déterville",
    dateLabel: "Samedi 15 Mars",
    presentation:
      "Choc au sommet en R1 Féminine. Les Rouge et Blanc reçoivent Rouen pour un match décisif dans la course au maintien et à la montée.",
    ticketPrice: 5,
  },
  {
    id: "5",
    category: "MASC",
    categoryLabel: "R1",
    status: "À VENIR",
    competition: "R1 Normandie",
    home: { name: "US Bayeux", initials: "USB" },
    away: { name: "MOS Caen", initials: "MOS" },
    date: "22/03",
    kickoff: "15h00",
    venue: "Stade de Bayeux",
    dateLabel: "Samedi 22 Mars",
    presentation:
      "Déplacement crucial en R1 Normandie. La MOS se déplace à Bayeux pour un choc entre deux équipes en forme. Enjeu total au classement.",
    ticketPrice: 10,
  },
  {
    id: "6",
    category: "FEM",
    categoryLabel: "R1",
    status: "TERMINÉ",
    competition: "R1 Féminine",
    home: { name: "MOS Caen", score: 2 },
    away: { name: "Le Havre AC", score: 2, initials: "HAC" },
    date: "16/02",
    kickoff: "14h30",
    venue: "Stade Joseph Déterville",
    dateLabel: "Dimanche 16 Février",
    presentation:
      "Match spectaculaire entre la MOS et Le Havre AC. Les Maladrins arrachent le point du nul dans un duel riche en occasions.",
    ticketPrice: 5,
  },
];

export function getCalendarMatch(id: string): CalendarMatch | undefined {
  return CALENDAR_MATCHES.find((m) => m.id === id);
}

export function getCalendarMatchIds(): string[] {
  return CALENDAR_MATCHES.map((m) => m.id);
}

export const NEWS = [
  {
    id: "1",
    category: "Sénior",
    title: "Victoire éclatante face au FC Hérouville",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    href: "#",
  },
  {
    id: "2",
    category: "Formation",
    title: "Les U15 accèdent au championnat régional",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&q=80",
    href: "#",
  },
  {
    id: "3",
    category: "Club",
    title: "La MOS lance sa campagne de recrutement 2026",
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80",
    href: "#",
  },
  {
    id: "4",
    category: "Partenaires",
    title: "E.Leclerc renouvelle son soutien aux équipes",
    image: "https://images.unsplash.com/photo-1459865264687-595d653de993?w=800&q=80",
    href: "#",
  },
] as const;

export const PARTNERS = [
  { name: "E.Leclerc", logo: "/mos/partners/leclerc.svg" },
  { name: "Crédit Agricole", logo: "/mos/partners/credit-agricole.svg" },
  { name: "Allianz", logo: "/mos/partners/allianz.svg" },
  { name: "Domino's", logo: "/mos/partners/dominos.svg" },
  { name: "Calvados", logo: "/mos/partners/calvados.svg" },
  { name: "Keolis", logo: "/mos/partners/keolis.svg" },
] as const;

export const ADN_CARDS = [
  {
    id: "inclusion",
    tag: "Santé-Vous Mieux Sport",
    title: "Inclusion & Santé-Vous Mieux Sport",
    text: "Rendre le football accessible à tous, quel que soit le parcours ou la situation.",
    image: "/mos/adn-inclusion.png",
  },
  {
    id: "formation",
    tag: "École de foot",
    title: "Formation des jeunes",
    text: "De l'école de foot aux équipes jeunes, accompagner chaque joueur dans sa progression.",
    image: "/mos/adn-formation.jpg",
  },
  {
    id: "famille",
    tag: "Depuis 1965",
    title: "Club familial",
    text: "La Maladrerie fait vivre le football à Caen dans un esprit convivial et exigeant.",
    image: "/mos/adn-famille.jpg",
  },
  {
    id: "quartier",
    tag: "Caen",
    title: "Ancré dans le quartier",
    text: "Un ancrage territorial fort, des partenaires locaux et une identité rouge et blanche.",
    image: "/mos/lifestyle-1.png",
  },
] as const;

export const TEAMS_MEGA_MENU = {
  columns: [
    {
      title: "Équipes séniors",
      teams: [
        { label: "Seniors R1", href: "#chiffres" },
        { label: "Seniors R2", href: "#chiffres" },
        { label: "Seniors C", href: "#chiffres" },
        { label: "Vétérans A", href: "#chiffres" },
      ],
    },
    {
      title: "Équipes féminines",
      teams: [
        { label: "Seniors R1", href: "#chiffres" },
        { label: "Seniors D1", href: "#chiffres" },
        { label: "U15 F", href: "#chiffres" },
      ],
    },
    {
      title: "Formations",
      teams: [
        { label: "U18 R1", href: "#chiffres" },
        { label: "U16 R1", href: "#chiffres" },
        { label: "U15 R1", href: "#chiffres" },
        { label: "U15 D1", href: "#chiffres" },
        { label: "U14 R1", href: "#chiffres" },
      ],
    },
    {
      title: "Académie",
      teams: [
        { label: "U13 A", href: "#chiffres" },
        { label: "U13 B", href: "#chiffres" },
        { label: "U13 C", href: "#chiffres" },
        { label: "U12 A", href: "#chiffres" },
        { label: "U12 B", href: "#chiffres" },
        { label: "Babies", href: "#chiffres" },
      ],
    },
  ],
  news: [
    {
      id: "recrute",
      category: "Régional 1 | Sénior A",
      date: "12 mai 2026",
      excerpt: "Tu veux t'investir dans un club familial, ambitieux et engagé, la MOS recrute…",
      image: "/mos/teams-news-recrute.jpg",
      href: "#actualites",
    },
    {
      id: "stages",
      category: "Régional 1 | Sénior A",
      date: "1 avril 2026",
      excerpt: "La MOS organise ses stages vacances pour les enfants de 6 à 14 ans.",
      image: "/mos/teams-news-stages.jpg",
      href: "#actualites",
    },
  ],
} as const;

export const STATS = [
  { value: 500, suffix: "+", label: "Licenciés" },
  { value: 20, suffix: "+", label: "Équipes" },
  { value: 100, suffix: "+", label: "Partenaires" },
  { value: 1965, suffix: "", label: "Année de création" },
] as const;

export const LIFESTYLE = [
  {
    title: "Caen 1965",
    caption: "Sweats CAEN · Rouge & blanc, partout en ville",
    image: "/mos/lifestyle-caen-1.png",
    span: "wide" as const,
  },
  {
    title: "Ici c'est la MOS",
    caption: "T-shirt lifestyle · L'identité Maladrerie au quotidien",
    image: "/mos/lifestyle-caen-2.png",
    span: "tall" as const,
  },
] as const;

export const FOOTER_LINKS = {
  Club: [
    { label: "Notre histoire", href: "#adn" },
    { label: "Nos équipes", href: "#chiffres" },
    { label: "Les 100", href: "#les-100" },
  ],
  Actualités: [
    { label: "Dernières news", href: "#actualites" },
    { label: "Calendrier", href: "#" },
    { label: "Résultats", href: "#" },
  ],
  Partenaires: [
    { label: "Les 100", href: "#les-100" },
    { label: "Devenir partenaire", href: "#contact" },
    { label: "Nos soutiens", href: "#les-100" },
  ],
  Contact: [
    { label: "Nous écrire", href: "#contact" },
    { label: "Stade", href: "#" },
    { label: "Boutique", href: "/mos/boutique" },
  ],
} as const;

export const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "Facebook", href: "https://facebook.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "YouTube", href: "https://youtube.com" },
] as const;
