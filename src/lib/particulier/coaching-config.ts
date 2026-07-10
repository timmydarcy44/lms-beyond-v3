/** Accompagnement EDGE — contenus et tarifs (particulier). */

import {
  getProgrammeRequestHref,
  getReservationPageHref,
  type EdgeAccompagnementOfferSlug,
} from "@/lib/particulier/accompagnement-booking";

/** CTA unique particulier — réservation avec un expert EDGE. */
export const EDGE_EXPERT_PARCOURS_CTA = "Construire mon parcours avec un expert";

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
    title: "Construire mon parcours avec un expert",
    price: "49 €",
    duration: "60 min",
    tier: "principal",
    tierLabel: "Séance avec un expert",
    description: "Échange individuel en visioconférence avec un expert EDGE.",
    valueProposition:
      "Analyser votre profil, clarifier vos priorités et définir les prochaines étapes concrètes.",
    benefits: [
      "Analyse de votre profil EDGE et de vos écarts",
      "Priorisation des compétences à travailler",
      "Recommandations personnalisées pour la suite",
    ],
    ctaLabel: "Réserver avec un expert — 49 €",
    icon: "target",
  },
  {
    id: "simulation",
    title: "Mission EDGE avec expert",
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
    ctaLabel: "Réserver une mission avec expert",
    icon: "zap",
  },
  {
    id: "programme",
    title: "Création du parcours & développement des compétences",
    price: "Sur devis",
    tier: "longue-duree",
    tierLabel: "Accompagnement sur mesure",
    description: "Parcours personnalisé et plan de développement des compétences — tarif établi après échange.",
    valueProposition:
      "Un accompagnement structuré dans la durée, adapté à votre objectif et à votre rythme.",
    benefits: [
      "Création d'un parcours personnalisé",
      "Plan de développement des compétences",
      "Suivi et réévaluation avec un expert EDGE",
    ],
    ctaLabel: "Demander un devis",
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
  { label: "Échange expert", membership: "1×/mois", progression: "49 € · 60 min", simulation: "179 €", programme: "Sur devis" },
  { label: "Analyse profil EDGE", membership: true, progression: true, simulation: true, programme: true },
  { label: "Plan d'action", membership: true, progression: true, simulation: false, programme: true },
  { label: "Création du parcours", membership: false, progression: false, simulation: false, programme: true },
  { label: "Développement des compétences", membership: false, progression: false, simulation: false, programme: true },
  { label: "Suivi dans la durée", membership: true, progression: false, simulation: false, programme: true },
];

export const EDGE_ACCOMPAGNEMENT_FAQ = [
  {
    question: "Combien coûte la séance avec un expert ?",
    answer:
      "La construction de votre plan avec un expert EDGE est à 49 € (60 min en visioconférence). La création d'un parcours complet ou d'un plan de développement des compétences sur la durée se fait sur devis, après un premier échange.",
  },
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

export function getExpertParcoursHref(): string {
  return getCoachingBookingHref("progression");
}

/** @deprecated Utiliser EDGE_ACCOMPAGNEMENT_OFFERS */
export const EDGE_PARTICULIER_COACHING = {
  membership: EDGE_ACCOMPAGNEMENT_OFFERS[0],
  progression: EDGE_ACCOMPAGNEMENT_OFFERS[1],
  simulation: EDGE_ACCOMPAGNEMENT_OFFERS[2],
  programme: EDGE_ACCOMPAGNEMENT_OFFERS[3],
} as const;
