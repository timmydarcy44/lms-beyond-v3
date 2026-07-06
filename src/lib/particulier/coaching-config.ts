/** Accompagnement premium EDGE — contenus et tarifs (particulier). */

import {
  getProgrammeRequestHref,
  getReservationPageHref,
  type EdgeAccompagnementOfferSlug,
} from "@/lib/particulier/accompagnement-booking";

export type EdgeAccompagnementOfferId = "progression" | "simulation" | "programme";

const OFFER_ID_TO_SLUG: Record<EdgeAccompagnementOfferId, EdgeAccompagnementOfferSlug> = {
  progression: "coaching-progression",
  simulation: "simulation-professionnelle",
  programme: "programme-progression",
};

export type EdgeAccompagnementOffer = {
  id: EdgeAccompagnementOfferId;
  title: string;
  price: string;
  duration?: string;
  description: string;
  includes: string[];
  includesLabel?: string;
  examples?: string[];
  examplesLabel?: string;
  afterSimulation?: string[];
  ctaLabel: string;
  featured?: boolean;
};

export const EDGE_ACCOMPAGNEMENT_OFFERS: EdgeAccompagnementOffer[] = [
  {
    id: "progression",
    title: "Coaching Progression EDGE",
    price: "149 €",
    duration: "60 minutes",
    description: "Un accompagnement individuel pour construire votre feuille de route de progression.",
    includes: [
      "Analyse complète de votre profil EDGE",
      "Priorisation des compétences à développer",
      "Conseils personnalisés selon votre objectif",
      "Plan d'action concret sur 30 jours",
      "Recommandations de parcours EDGE",
    ],
    ctaLabel: "Réserver",
    featured: true,
  },
  {
    id: "simulation",
    title: "Simulation Professionnelle EDGE",
    price: "179 €",
    duration: "60 à 90 minutes",
    description: "Préparez-vous à une situation professionnelle réelle.",
    examples: [
      "entretien d'embauche",
      "rendez-vous commercial",
      "négociation",
      "management",
      "prise de parole",
      "présentation client",
    ],
    includes: [],
    afterSimulation: [
      "débrief détaillé",
      "axes de progression",
      "recommandations EDGE",
    ],
    ctaLabel: "Réserver",
  },
  {
    id: "programme",
    title: "Programme Progression EDGE",
    price: "À partir de 390 €",
    description: "Un accompagnement dans la durée pour accélérer votre évolution.",
    includesLabel: "Comprend",
    includes: [
      "plusieurs séances individuelles",
      "suivi personnalisé",
      "exercices entre les séances",
      "réévaluation des compétences",
      "parcours EDGE recommandés",
    ],
    ctaLabel: "En savoir plus",
  },
];

export const EDGE_ACCOMPAGNEMENT_WHY = {
  title: "Pourquoi être accompagné ?",
  text: "L'intelligence artificielle identifie vos forces, vos axes de progression et les compétences prioritaires. L'accompagnement humain permet ensuite de transformer cette analyse en résultats concrets grâce à des mises en situation, des conseils personnalisés et un suivi adapté à votre objectif professionnel.",
  cards: [
    {
      emoji: "🎯",
      title: "Objectif clair",
      description: "Construire une stratégie adaptée à votre projet.",
    },
    {
      emoji: "📈",
      title: "Progression plus rapide",
      description: "Prioriser les compétences qui auront le plus d'impact.",
    },
    {
      emoji: "🧠",
      title: "Mise en pratique",
      description: "Passer de la théorie à l'action grâce aux simulations.",
    },
    {
      emoji: "🏅",
      title: "Valorisation",
      description: "Préparer les futures validations EDGE et renforcer votre profil.",
    },
  ],
} as const;

export const EDGE_ACCOMPAGNEMENT_FAQ = [
  {
    question: "Quelle est la différence entre l'IA EDGE et un coaching ?",
    answer:
      "L'IA EDGE analyse votre profil, identifie vos forces et vos priorités de progression. Le coaching transforme ce diagnostic en plan d'action concret : priorisation, exercices, simulations et suivi humain adapté à votre objectif.",
  },
  {
    question: "Puis-je réserver sans avoir terminé mes tests ?",
    answer:
      "Oui. Plus votre profil EDGE est complet, plus l'accompagnement sera précis — mais vous pouvez démarrer dès maintenant pour structurer votre progression.",
  },
  {
    question: "Les accompagnements sont-ils en visioconférence ?",
    answer:
      "Oui. Les séances se déroulent en visioconférence, avec la même qualité d'échange et de suivi qu'en présentiel.",
  },
  {
    question: "Puis-je utiliser mon CPF ?",
    answer:
      "Selon la formule choisie, le financement CPF peut être possible. Contactez-nous pour vérifier votre éligibilité avant de réserver.",
  },
  {
    question: "Puis-je être accompagné pour une reconversion ?",
    answer:
      "Oui. Les formules sont conçues pour clarifier votre objectif, accélérer votre montée en compétences et préparer vos prochaines étapes professionnelles.",
  },
] as const;

export function getCoachingBookingHref(offerId?: EdgeAccompagnementOfferId): string {
  if (!offerId) return "/dashboard/apprenant/coaching";
  if (offerId === "programme") return getProgrammeRequestHref();
  return getReservationPageHref(OFFER_ID_TO_SLUG[offerId]);
}

/** @deprecated Utiliser EDGE_ACCOMPAGNEMENT_OFFERS — conservé pour imports legacy */
export const EDGE_PARTICULIER_COACHING = {
  progression: EDGE_ACCOMPAGNEMENT_OFFERS[0],
  simulation: EDGE_ACCOMPAGNEMENT_OFFERS[1],
  programme: EDGE_ACCOMPAGNEMENT_OFFERS[2],
} as const;
