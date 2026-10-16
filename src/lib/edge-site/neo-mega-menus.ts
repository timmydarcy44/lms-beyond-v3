import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

/** Lien sans page dédiée. Ne pas le remplacer par une URL inventée. */
export const MISSING_ROUTE = "#";

export type NeoPill = {
  label: string;
  href?: string;
  featured?: boolean;
};

export type NeoGroup = {
  label: string;
  href: string;
  pills: NeoPill[];
};

export type NeoTile = {
  id: string;
  tone: "navy" | "violet";
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  cta?: string;
  pills?: NeoPill[];
  groups?: NeoGroup[];
  bars?: { label: string; width: string }[];
};

export type NeoTextLink = {
  title: string;
  subtitle: string;
  href: string;
};

export type NeoTextSection = {
  title: string;
  links: NeoTextLink[];
};

export type NeoBarAction = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type NeoMegaMenuConfig = {
  id: "ecole" | "entreprises";
  label: string;
  tiles: [NeoTile, NeoTile];
  side: NeoTextSection[];
  bar: {
    note?: string;
    textLink?: { label: string; href: string };
    actions: NeoBarAction[];
  };
};

export function getNeoMegaMenus(routes: EdgeMarketingRoutes): NeoMegaMenuConfig[] {
  const school: NeoMegaMenuConfig = {
    id: "ecole",
    label: "École",
    tiles: [
      {
        id: "bachelor",
        tone: "navy",
        eyebrow: "Après le bac",
        title: "Bachelor en alternance",
        groups: [
          {
            label: "Business et sales",
            href: routes.formationsBachelor,
            pills: [
              { label: "AI Business", href: routes.ecoleNtcAiBusiness },
              { label: "Business Sport", href: routes.ecoleNtcBusinessSport },
              { label: "Real Estate", href: routes.ecoleNtcRealEstate },
            ],
          },
          {
            label: "Retail et luxury",
            // TODO: aucune page filière Retail et luxury
            href: MISSING_ROUTE,
            pills: [
              // TODO: aucune page Retail Experience
              { label: "Retail Experience", href: MISSING_ROUTE },
              // TODO: aucune page Merchandising
              { label: "Merchandising", href: MISSING_ROUTE },
              // TODO: aucune page Luxury & Premium
              { label: "Luxury & Premium", href: MISSING_ROUTE },
              // TODO: aucune page Sport Retail
              { label: "Sport Retail", href: MISSING_ROUTE },
            ],
          },
        ],
      },
      {
        id: "poursuite",
        tone: "violet",
        eyebrow: "Après un BTS ou équivalent",
        title: "Poursuite d'études",
        groups: [
          {
            label: "Management",
            href: routes.formationsMastere,
            pills: [
              // TODO: aucune page AI Management
              { label: "AI Management", href: MISSING_ROUTE },
              // TODO: aucune page Business Performance
              { label: "Business Performance", href: MISSING_ROUTE },
              // TODO: aucune page Transition & Innovation
              { label: "Transition & Innovation", href: MISSING_ROUTE },
            ],
          },
          {
            label: "Business Development",
            href: routes.formationsMastere,
            pills: [
              // TODO: aucune page Growth & Acquisition
              { label: "Growth & Acquisition", href: MISSING_ROUTE },
              // TODO: aucune page Entrepreneurship
              { label: "Entrepreneurship", href: MISSING_ROUTE },
              // TODO: aucune page International Business
              { label: "International Business", href: MISSING_ROUTE },
              // TODO: aucune page Strategic Partnerships
              { label: "Strategic Partnerships", href: MISSING_ROUTE },
            ],
          },
        ],
      },
    ],
    side: [
      {
        title: "Candidater",
        links: [
          { title: "Déposer ma candidature", subtitle: "Dossier en ligne", href: routes.ecoleCandidater },
          { title: "Prendre rendez-vous", subtitle: "Échanger avec l'équipe", href: routes.contact },
        ],
      },
      {
        title: "Financement",
        links: [
          { title: "Financer ma formation", subtitle: "Alternance et prise en charge", href: routes.financement },
          { title: "Découvrir les aides", subtitle: "Les dispositifs possibles", href: routes.financement },
        ],
      },
    ],
    bar: {
      textLink: { label: "Découvrir Byound School →", href: routes.alternance },
      actions: [
        { label: "Accéder à mon espace", href: "/particuliers/login", variant: "secondary" },
        { label: "Créer un compte", href: "/particuliers", variant: "primary" },
      ],
    },
  };

  const business: NeoMegaMenuConfig = {
    id: "entreprises",
    label: "Entreprises",
    tiles: [
      {
        id: "former",
        tone: "navy",
        title: "Former vos équipes",
        description: "Des formations concrètes, en présentiel ou à distance.",
        href: routes.businessFormations,
        cta: "Voir les formations",
        pills: [
          { label: "Négociation", featured: true },
          { label: "Management" },
          { label: "IA" },
          { label: "Soft skills" },
          { label: "Leadership" },
        ],
      },
      {
        id: "plateforme",
        tone: "violet",
        title: "Plateforme de compétences",
        description: "Évaluez, développez et valorisez les compétences de vos équipes.",
        href: routes.businessPlateformeCompetences,
        cta: "Découvrir la plateforme",
        bars: [
          { label: "Écoute", width: "78%" },
          { label: "Négociation", width: "56%" },
          { label: "Leadership", width: "40%" },
        ],
      },
    ],
    side: [
      {
        title: "Ressources",
        links: [
          { title: "Financement OPCO", subtitle: "Faire financer vos formations", href: routes.financement },
          { title: "Open Badges", subtitle: "Certifier les compétences acquises", href: routes.businessOpenBadges },
          { title: "Cas clients", subtitle: "Ils ont formé leurs équipes", href: routes.businessCasClients },
          { title: "Diagnostic", subtitle: "Mesurer le niveau de départ", href: routes.businessDiagnostics },
        ],
      },
    ],
    bar: {
      note: "Un projet pour vos équipes ? On vous répond sous 48 h.",
      textLink: { label: "Byound Business", href: routes.business },
      actions: [{ label: "Parlons de vos besoins", href: routes.contact, variant: "primary" }],
    },
  };

  return [school, business];
}
