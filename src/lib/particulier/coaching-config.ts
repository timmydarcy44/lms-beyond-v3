/** Accompagnement EDGE — contenus et tarifs (particulier). */

import {
  getProgrammeRequestHref,
  getReservationPageHref,
  type EdgeAccompagnementOfferSlug,
} from "@/lib/particulier/accompagnement-booking";

export type EdgeAccompagnementOfferId = "membership" | "progression" | "simulation" | "programme";

export type OfferTier = "principal" | "ponctuel" | "cible" | "longue-duree";

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
  tier: OfferTier;
  tierLabel: string;
  description: string;
  /** Bénéfice principal — affiché en priorité */
  valueProposition: string;
  benefits: string[];
  ctaLabel: string;
  icon: OfferIcon;
};

export const EDGE_ACCOMPAGNEMENT_OFFERS: EdgeAccompagnementOffer[] = [
  {
    id: "membership",
    title: "EDGE Membership",
    price: "49 €",
    priceSuffix: "/mois",
    tier: "principal",
    tierLabel: "Offre principale",
    description: "Accompagnement continu pour structurer votre progression professionnelle.",
    valueProposition: "Un suivi mensuel pour avancer régulièrement sur vos compétences prioritaires.",
    benefits: [
      "Coaching individuel chaque mois",
      "Analyses et simulations régulières",
      "Recommandations personnalisées selon votre profil EDGE",
    ],
    ctaLabel: "Rejoindre EDGE Membership",
    icon: "crown",
  },
  {
    id: "progression",
    title: "Coaching Progression",
    price: "149 €",
    duration: "60 min",
    tier: "ponctuel",
    tierLabel: "Séance ponctuelle",
    description: "Une séance pour analyser votre profil et définir un plan d'action.",
    valueProposition: "Clarifier vos priorités et structurer les prochaines étapes.",
    benefits: [
      "Analyse de votre profil EDGE",
      "Priorisation des compétences",
      "Plan d'action sur 30 jours",
    ],
    ctaLabel: "Réserver une séance",
    icon: "target",
  },
  {
    id: "simulation",
    title: "Défi EDGE",
    price: "179 €",
    duration: "60–90 min",
    tier: "cible",
    tierLabel: "Préparation ciblée",
    description: "Mise en situation professionnelle avec débrief structuré.",
    valueProposition: "Vous préparer concrètement à une situation à venir.",
    benefits: [
      "Entretien, négociation, prise de parole…",
      "Débrief avec un expert EDGE",
      "Axes de progression identifiés",
    ],
    ctaLabel: "Lancer un Défi EDGE",
    icon: "zap",
  },
  {
    id: "programme",
    title: "Programme Progression",
    price: "390 €",
    priceSuffix: "+",
    tier: "longue-duree",
    tierLabel: "Accompagnement longue durée",
    description: "Plusieurs séances sur une période définie, avec suivi entre les rendez-vous.",
    valueProposition: "Un accompagnement structuré dans la durée.",
    benefits: [
      "Séances individuelles planifiées",
      "Suivi et exercices entre les séances",
      "Réévaluation des compétences",
    ],
    ctaLabel: "Construire un programme",
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
  { label: "Plan d'action", membership: true, progression: true, simulation: false, programme: true },
  { label: "Défi EDGE", membership: true, progression: false, simulation: true, programme: true },
  { label: "Suivi dans la durée", membership: true, progression: false, simulation: false, programme: true },
  { label: "Réévaluation compétences", membership: "Trimestrielle", progression: false, simulation: false, programme: true },
];

export const EDGE_ACCOMPAGNEMENT_FAQ = [
  {
    question: "Quelle est la différence entre l'analyse EDGE et un accompagnement ?",
    answer:
      "L'analyse EDGE identifie vos compétences, vos écarts et vos priorités à partir de votre profil. L'accompagnement permet d'approfondir ces éléments avec un expert et de définir un plan d'action.",
  },
  {
    question: "Puis-je réserver sans avoir terminé mon profil ?",
    answer:
      "Oui. Plus votre profil EDGE est complet, plus l'accompagnement sera précis.",
  },
  {
    question: "Les séances sont-elles en visioconférence ?",
    answer: "Oui. Toutes les séances se déroulent en visioconférence.",
  },
  {
    question: "Le financement CPF est-il possible ?",
    answer: "Selon la formule choisie. Contactez-nous pour vérifier votre éligibilité.",
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
