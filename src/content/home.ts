import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import { MISSING_ROUTE } from "@/lib/edge-site/neo-mega-menus";
import { EDGE_PREMIUM_OPEN_BADGES_VIDEO } from "@/lib/edge-site/premium-constants";

export const HOME_LOGOS: { name: string; src: string }[] = [];

export const HOME_STATS: { value: string; label: string; source?: string }[] = [
  { value: "", label: "" },
  { value: "", label: "" },
  { value: "", label: "" },
];

export const HOME_VIDEO = {
  src: EDGE_PREMIUM_OPEN_BADGES_VIDEO,
  title: "Identifier. Former. Valoriser.",
} as const;

export type HomeFormation = { label: string; href: string; featured?: boolean };

export function getHomeFormations(routes: EdgeMarketingRoutes): HomeFormation[] {
  return [
    { label: "AI Business", href: routes.ecoleNtcAiBusiness, featured: true },
    { label: "Business Sport", href: routes.ecoleNtcBusinessSport },
    { label: "Real Estate", href: routes.ecoleNtcRealEstate },
    // TODO: aucune page Luxury & Premium
    { label: "Luxury & Premium", href: MISSING_ROUTE },
    // TODO: aucune page AI Management
    { label: "AI Management", href: MISSING_ROUTE },
    // TODO: aucune page Business Performance
    { label: "Business Performance", href: MISSING_ROUTE },
    // TODO: aucune page Transition & Innovation
    { label: "Transition & Innovation", href: MISSING_ROUTE },
    // TODO: aucune page Retail Experience
    { label: "Retail Experience", href: MISSING_ROUTE },
    // TODO: aucune page Merchandising
    { label: "Merchandising", href: MISSING_ROUTE },
    // TODO: aucune page Sport Retail
    { label: "Sport Retail", href: MISSING_ROUTE },
    // TODO: aucune page Growth & Acquisition
    { label: "Growth & Acquisition", href: MISSING_ROUTE },
    // TODO: aucune page Entrepreneurship
    { label: "Entrepreneurship", href: MISSING_ROUTE },
    // TODO: aucune page International Business
    { label: "International Business", href: MISSING_ROUTE },
    // TODO: aucune page Strategic Partnerships
    { label: "Strategic Partnerships", href: MISSING_ROUTE },
  ];
}

export function getHomeContent(routes: EdgeMarketingRoutes, host?: string | null) {
  const diagnostic = (slug: string) => edgeMarketingHref(`/business/diagnostics/${slug}`, host);
  const formations = getHomeFormations(routes);
  const visible = formations.slice(0, 5);
  const more = Math.max(formations.length - visible.length, 0);
  return {
    hero: {
      school: routes.alternance,
      business: routes.business,
    },
    formations: visible,
    moreFormations: more,
    moreHref: routes.formations,
    schoolHref: routes.alternance,
    businessHref: routes.business,
    diagnostics: [
      {
        slug: "soft-skills",
        title: "Soft Skills",
        text: "Les compétences comportementales qui font la différence au quotidien.",
        href: diagnostic("soft-skills"),
      },
      {
        slug: "idmc",
        title: "IDMC",
        text: "Attention, raisonnement, flexibilité et stratégies d'apprentissage.",
        href: diagnostic("idmc"),
      },
      {
        slug: "test-comportemental",
        title: "Test comportemental",
        text: "Identifier son style de communication pour mieux vendre, manager et collaborer.",
        href: diagnostic("test-comportemental"),
      },
    ],
    diagnosticsHref: routes.businessDiagnostics,
    demoHref: routes.businessDemo,
    trainerHref: routes.expertSignup,
    contactHref: routes.contact,
    footer: [
      {
        title: "Particuliers",
        links: [
          { label: "Formations courtes", href: routes.onlineFormations },
          { label: "Reconversion professionnelle", href: routes.particulierReconversion },
          { label: "Trouver ma formation", href: routes.onlineFormations },
        ],
      },
      {
        title: "Business",
        links: [
          { label: "Former vos équipes", href: routes.businessFormerEquipes },
          { label: "Plateforme de compétences", href: routes.businessPlateformeCompetences },
          { label: "Parlons de vos besoins", href: routes.contact },
        ],
      },
      {
        title: "Ressources",
        links: [
          { label: "Blog", href: routes.blog },
          { label: "Guides", href: routes.guides },
          { label: "Webinaires", href: routes.webinaires },
          { label: "Formateurs / Experts", href: routes.formateursExperts },
        ],
      },
      {
        title: "À propos",
        links: [
          { label: "Notre mission", href: routes.notreMission },
          { label: "Qui sommes-nous ?", href: routes.aPropos },
          { label: "Contact", href: routes.contact },
          { label: "Découvrir Byound", href: routes.decouvrir },
        ],
      },
    ],
    legal: [
      // TODO: aucune page Mentions légales
      { label: "Mentions légales", href: MISSING_ROUTE },
      // TODO: aucune page Confidentialité
      { label: "Confidentialité", href: MISSING_ROUTE },
      // TODO: aucune page CGV
      { label: "CGV", href: MISSING_ROUTE },
    ],
  };
}
