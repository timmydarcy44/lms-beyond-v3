/** Accompagnement premium EDGE — contenus et tarifs (particulier). */

import {
  getProgrammeRequestHref,
  getReservationPageHref,
  type EdgeAccompagnementOfferSlug,
} from "@/lib/particulier/accompagnement-booking";

export type EdgeAccompagnementOfferId = "membership" | "progression" | "simulation" | "programme";

export type OfferBadge = "Le plus populaire" | "Recommandé" | "Sur mesure";

export type OfferIcon = "crown" | "target" | "zap" | "layers";

const OFFER_ID_TO_SLUG: Record<Exclude<EdgeAccompagnementOfferId, "membership" | "programme">, EdgeAccompagnementOfferSlug> = {
  progression: "coaching-progression",
  simulation: "simulation-professionnelle",
};

export type EdgeAccompagnementOffer = {
  id: EdgeAccompagnementOfferId;
  title: string;
  price: string;
  priceSuffix?: string;
  duration?: string;
  description: string;
  highlights: string[];
  includes: string[];
  includesLabel?: string;
  examples?: string[];
  examplesLabel?: string;
  afterSimulation?: string[];
  ctaLabel: string;
  badge?: OfferBadge;
  icon: OfferIcon;
  featured?: boolean;
  recommended?: boolean;
};

export const EDGE_ACCOMPAGNEMENT_OFFERS: EdgeAccompagnementOffer[] = [
  {
    id: "membership",
    title: "EDGE Membership",
    price: "49 €",
    priceSuffix: "/mois",
    description:
      "L'accompagnement continu pour progresser chaque mois — le meilleur rapport valeur/prix pour transformer votre profil EDGE en résultats concrets.",
    highlights: [
      "1 coaching individuel / mois inclus",
      "Analyses & simulations illimitées",
      "Priorisation IA de vos compétences",
    ],
    includes: [
      "Coaching mensuel 45 min avec un expert EDGE",
      "Accès prioritaire aux créneaux",
      "Suivi de progression personnalisé",
      "Recommandations de parcours EDGE",
      "Réévaluation des compétences chaque trimestre",
      "Support par email entre les séances",
    ],
    ctaLabel: "Rejoindre EDGE Membership",
    badge: "Le plus populaire",
    icon: "crown",
    featured: true,
    recommended: true,
  },
  {
    id: "progression",
    title: "Coaching Progression",
    price: "149 €",
    duration: "60 min",
    description: "Une séance ponctuelle pour construire votre feuille de route de progression.",
    highlights: [
      "Analyse complète de votre profil",
      "Plan d'action 30 jours",
      "Priorisation des compétences clés",
    ],
    includes: [
      "Analyse complète de votre profil EDGE",
      "Priorisation des compétences à développer",
      "Conseils personnalisés selon votre objectif",
      "Plan d'action concret sur 30 jours",
      "Recommandations de parcours EDGE",
    ],
    ctaLabel: "Réserver",
    badge: "Recommandé",
    icon: "target",
  },
  {
    id: "simulation",
    title: "Simulation Professionnelle",
    price: "179 €",
    duration: "60–90 min",
    description: "Préparez-vous à une situation professionnelle réelle avec débrief expert.",
    highlights: [
      "Mise en situation réaliste",
      "Débrief détaillé",
      "Axes de progression ciblés",
    ],
    examples: [
      "entretien d'embauche",
      "rendez-vous commercial",
      "négociation",
      "management",
      "prise de parole",
    ],
    includes: [],
    afterSimulation: ["débrief détaillé", "axes de progression", "recommandations EDGE"],
    ctaLabel: "Réserver",
    icon: "zap",
  },
  {
    id: "programme",
    title: "Programme Progression",
    price: "390 €",
    priceSuffix: "+",
    description: "Un accompagnement dans la durée pour accélérer votre évolution professionnelle.",
    highlights: [
      "Plusieurs séances individuelles",
      "Suivi personnalisé",
      "Réévaluation des compétences",
    ],
    includesLabel: "Comprend",
    includes: [
      "plusieurs séances individuelles",
      "suivi personnalisé",
      "exercices entre les séances",
      "réévaluation des compétences",
      "parcours EDGE recommandés",
    ],
    ctaLabel: "Demander un devis",
    badge: "Sur mesure",
    icon: "layers",
  },
];

export type ComparisonFeature = {
  label: string;
  membership: boolean | string;
  progression: boolean | string;
  simulation: boolean | string;
  programme: boolean | string;
};

export const EDGE_OFFER_COMPARISON: ComparisonFeature[] = [
  { label: "Coaching individuel", membership: "1×/mois", progression: "1 séance", simulation: "—", programme: "Multi-séances" },
  { label: "Analyse profil EDGE", membership: true, progression: true, simulation: true, programme: true },
  { label: "Plan d'action personnalisé", membership: true, progression: true, simulation: false, programme: true },
  { label: "Simulation professionnelle", membership: true, progression: false, simulation: true, programme: true },
  { label: "Suivi dans la durée", membership: true, progression: false, simulation: false, programme: true },
  { label: "Réévaluation compétences", membership: "Trimestrielle", progression: false, simulation: false, programme: true },
  { label: "Support entre séances", membership: true, progression: false, simulation: false, programme: true },
  { label: "Rapport qualité/prix", membership: "★★★★★", progression: "★★★", simulation: "★★★", programme: "★★★★" },
];

export const EDGE_ACCOMPAGNEMENT_WHY = {
  title: "Pourquoi être accompagné ?",
  text: "L'intelligence artificielle identifie vos forces, vos axes de progression et les compétences prioritaires. L'accompagnement humain transforme cette analyse en résultats concrets.",
  cards: [
    { emoji: "🎯", title: "Objectif clair", description: "Construire une stratégie adaptée à votre projet." },
    { emoji: "📈", title: "Progression rapide", description: "Prioriser les compétences à fort impact." },
    { emoji: "🧠", title: "Mise en pratique", description: "Passer de la théorie à l'action." },
    { emoji: "🏅", title: "Valorisation", description: "Renforcer votre profil EDGE." },
  ],
} as const;

export const EDGE_ACCOMPAGNEMENT_FAQ = [
  {
    question: "Pourquoi choisir EDGE Membership plutôt qu'une séance ?",
    answer:
      "À 49 €/mois, EDGE Membership inclut un coaching mensuel (valeur 149 €), des analyses illimitées et un suivi continu. C'est le meilleur rapport valeur/prix pour progresser durablement.",
  },
  {
    question: "Quelle est la différence entre l'IA EDGE et un coaching ?",
    answer:
      "L'IA EDGE analyse votre profil et identifie vos priorités. Le coaching transforme ce diagnostic en plan d'action concret avec un expert humain.",
  },
  {
    question: "Puis-je réserver sans avoir terminé mes tests ?",
    answer:
      "Oui. Plus votre profil EDGE est complet, plus l'accompagnement sera précis — mais vous pouvez démarrer dès maintenant.",
  },
  {
    question: "Les accompagnements sont-ils en visioconférence ?",
    answer: "Oui. Toutes les séances se déroulent en visioconférence.",
  },
  {
    question: "Puis-je utiliser mon CPF ?",
    answer: "Selon la formule, le financement CPF peut être possible. Contactez-nous pour vérifier votre éligibilité.",
  },
] as const;

export function getCoachingBookingHref(offerId?: EdgeAccompagnementOfferId): string {
  if (!offerId) return "/dashboard/apprenant/coaching";
  if (offerId === "programme") return getProgrammeRequestHref();
  if (offerId === "membership") return `${getProgrammeRequestHref()}?offer=edge-membership`;
  return getReservationPageHref(OFFER_ID_TO_SLUG[offerId]);
}

/** @deprecated Utiliser EDGE_ACCOMPAGNEMENT_OFFERS */
export const EDGE_PARTICULIER_COACHING = {
  membership: EDGE_ACCOMPAGNEMENT_OFFERS[0],
  progression: EDGE_ACCOMPAGNEMENT_OFFERS[1],
  simulation: EDGE_ACCOMPAGNEMENT_OFFERS[2],
  programme: EDGE_ACCOMPAGNEMENT_OFFERS[3],
} as const;
