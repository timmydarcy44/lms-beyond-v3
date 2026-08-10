export type EdgePlanId = "skills" | "learning" | "learning-plus";
export type EdgeBilling = "monthly" | "annual";

export type EdgePlan = {
  id: EdgePlanId;
  name: string;
  /** Prix HT / collaborateur / mois (mensuel). */
  unitMonthly: number;
  tagline: string;
  promise: string;
  includes: readonly string[];
  popular?: boolean;
  /** Dropdown formations (EDGE Learning). */
  formationsPicker?: boolean;
};

/** Remise annuelle : facturation mensuelle équivalente à −20 %. */
export const EDGE_ANNUAL_DISCOUNT = 0.2;

export const EDGE_SEATS_MIN = 1;
export const EDGE_SEATS_MAX = 500;
export const EDGE_SEATS_DEFAULT = 25;

/** Tarif formation présentielle / collective : 1 500 € HT la journée (défaut). */
export const EDGE_FORMATIONATION_DAY_PRICE_HT = 1500;
export const EDGE_FORMATIONATION_DEFAULT_DAYS = 1;

export const EDGE_PLANS: readonly EdgePlan[] = [
  {
    id: "skills",
    name: "EDGE Skills",
    unitMonthly: 9,
    tagline: "Pour cartographier, suivre et piloter les compétences.",
    promise: "Comprendre les compétences de l’entreprise et piloter leur évolution.",
    includes: [
      "3 diagnostics collaborateurs",
      "Cartographie automatisée des compétences",
      "Bilans et recommandations automatisés",
      "Dashboard collaborateur",
      "Dashboard RH / entreprise",
      "Suivi des compétences",
      "Skills Wallet",
      "Open Badges",
      "Analytics de base",
    ],
  },
  {
    id: "learning",
    name: "EDGE Learning",
    unitMonthly: 15,
    tagline: "Tout EDGE Skills, avec en plus un véritable LMS.",
    promise: "Passer de l’identification des compétences au développement des compétences.",
    popular: true,
    formationsPicker: true,
    includes: [
      "Toutes les fonctionnalités EDGE Skills",
      "LMS intégré",
      "Création de formations",
      "Import de contenus existants",
      "Création de parcours personnalisés",
      "Attribution des parcours par collaborateur, équipe, métier ou compétence",
      "Suivi de progression",
      "Quiz et évaluations",
      "Analytics learning",
      "Possibilité de construire vos propres parcours internes",
    ],
  },
  {
    id: "learning-plus",
    name: "EDGE Learning+",
    unitMonthly: 20,
    tagline: "Tout EDGE Learning, avec la bibliothèque EDGE prête à l’emploi.",
    promise: "Diagnostiquer, recommander et former immédiatement, sans produire les contenus.",
    includes: [
      "Toutes les fonctionnalités EDGE Learning",
      "Bibliothèque EDGE de microlearning",
      "Accès illimité aux micro-formations incluses",
      "Contenus courts et opérationnels",
      "Recommandations de modules selon les diagnostics",
      "Parcours thématiques prêts à l’emploi",
      "Mélange contenus entreprise + EDGE",
      "Nouveaux contenus ajoutés régulièrement",
    ],
  },
] as const;

export function edgeUnitPrice(unitMonthly: number, billing: EdgeBilling): number {
  if (billing === "annual") {
    return Math.round(unitMonthly * (1 - EDGE_ANNUAL_DISCOUNT) * 100) / 100;
  }
  return unitMonthly;
}

export function edgeMonthlyTotal(
  unitMonthly: number,
  seats: number,
  billing: EdgeBilling,
): number {
  return Math.round(edgeUnitPrice(unitMonthly, billing) * seats * 100) / 100;
}

export function edgeAnnualTotal(unitMonthly: number, seats: number): number {
  return Math.round(edgeMonthlyTotal(unitMonthly, seats, "annual") * 12 * 100) / 100;
}

/** Coût formations : nb formations × jours (défaut 1) × 1 500 € HT / journée. */
export function edgeFormationsTotalHt(
  formationCount: number,
  daysPerFormation: number = EDGE_FORMATIONATION_DEFAULT_DAYS,
): number {
  return formationCount * daysPerFormation * EDGE_FORMATIONATION_DAY_PRICE_HT;
}

export function formatEdgeEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
