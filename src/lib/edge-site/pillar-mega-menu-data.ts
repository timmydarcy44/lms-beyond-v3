import type { EdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";

export type PillarMegaMenuId = "former" | "developper" | "recruter" | "piloter";

export type PillarMegaMenuIconId =
  | "graduation-cap"
  | "route"
  | "book-open"
  | "clipboard-list"
  | "sparkles"
  | "briefcase"
  | "users"
  | "search"
  | "target"
  | "layout-dashboard"
  | "bar-chart-3";

export type PillarMegaMenuLink = {
  label: string;
  href: string;
  description: string;
  icon: PillarMegaMenuIconId;
  external?: boolean;
};

export type PillarMegaMenuData = {
  id: PillarMegaMenuId;
  label: string;
  title: string;
  subtitle: string;
  primaryLinks: PillarMegaMenuLink[];
  secondaryLinks: { label: string; href: string }[];
  editorial: {
    label?: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
};

export function getPillarMegaMenus(R: EdgeMarketingRoutes): PillarMegaMenuData[] {
  return [
    {
      id: "former",
      label: "Former",
      title: "FORMER",
      subtitle: "Faire intervenir l'expertise EDGE.",
      primaryLinks: [
        {
          label: "Formations avec nos experts",
          href: R.businessFormerEquipes,
          description: "Des formations opérationnelles adaptées aux enjeux de vos équipes.",
          icon: "graduation-cap",
        },
        {
          label: "Parcours sur mesure",
          href: R.businessParcoursSurMesure,
          description: "Construisez un programme adapté à votre organisation.",
          icon: "route",
        },
      ],
      secondaryLinks: [
        { label: "Intra-entreprise", href: R.businessFormerEquipes },
        { label: "Inter-entreprises", href: R.businessFormerEquipes },
        { label: "Blended learning", href: R.businessPresentielDistanciel },
      ],
      editorial: {
        title: "Une formation, bien plus qu'une journée.",
        description:
          "Diagnostic des besoins, formation et pilotage des compétences dans un même environnement.",
        ctaLabel: "Découvrir l'approche EDGE",
        ctaHref: R.businessFormerEquipes,
      },
    },
    {
      id: "developper",
      label: "Développer",
      title: "DÉVELOPPER",
      subtitle: "Faire progresser les compétences dans la durée.",
      primaryLinks: [
        {
          label: "EDGE Online",
          href: EDGE_ONLINE_EXTERNAL_URL,
          description: "Micro-formations pour développer les compétences en continu.",
          icon: "book-open",
          external: true,
        },
        {
          label: "Formations internes",
          href: R.businessAcademie,
          description: "Créez et diffusez vos propres contenus de formation.",
          icon: "clipboard-list",
        },
        {
          label: "Parcours",
          href: R.businessSuiviParcours,
          description: "Combinez contenus EDGE et formations internes en parcours personnalisés.",
          icon: "route",
        },
        {
          label: "Micro-certifications",
          href: R.businessCertificationsBiz,
          description: "Valorisez les compétences acquises au fil des parcours.",
          icon: "sparkles",
        },
      ],
      secondaryLinks: [],
      editorial: {
        label: "BEYOND",
        title: "Tout votre learning, au même endroit.",
        description:
          "EDGE Online, formations internes et parcours réunis dans un seul environnement.",
        ctaLabel: "Découvrir Beyond",
        ctaHref: R.business,
      },
    },
    {
      id: "recruter",
      label: "Recruter",
      title: "RECRUTER",
      subtitle: "Acquérir les compétences qui manquent à votre organisation.",
      primaryLinks: [
        {
          label: "Créer une offre",
          href: R.businessRecrutement,
          description: "Structurez et publiez une offre à partir de votre besoin.",
          icon: "briefcase",
        },
        {
          label: "Gérer les candidatures",
          href: R.businessRecrutement,
          description: "Centralisez vos candidats et suivez leur progression.",
          icon: "users",
        },
        {
          label: "Matching compétences",
          href: R.businessMatchingCandidats,
          description: "Comparez les profils candidats avec les compétences recherchées.",
          icon: "search",
        },
        {
          label: "Pipeline de recrutement",
          href: R.businessRecrutement,
          description: "Pilotez chaque recrutement depuis un même espace.",
          icon: "target",
        },
      ],
      secondaryLinks: [],
      editorial: {
        label: "EDGE RECRUIT",
        title: "Recruter à partir des compétences.",
        description: "Passez du besoin identifié au profil recherché sans repartir de zéro.",
        ctaLabel: "Découvrir EDGE Recruit",
        ctaHref: R.businessRecrutement,
      },
    },
    {
      id: "piloter",
      label: "Piloter",
      title: "PILOTER",
      subtitle: "Comprendre les compétences de votre organisation.",
      primaryLinks: [
        {
          label: "Dashboard RH",
          href: R.businessTableauxDeBord,
          description: "Visualisez les indicateurs clés de vos équipes.",
          icon: "layout-dashboard",
        },
        {
          label: "Métiers & compétences",
          href: R.businessCompetences,
          description: "Structurez vos métiers et les compétences attendues.",
          icon: "briefcase",
        },
        {
          label: "Diagnostics",
          href: R.businessDiagnostics,
          description: "Évaluez les profils et identifiez les écarts.",
          icon: "bar-chart-3",
        },
        {
          label: "Besoins en compétences",
          href: R.businessDeveloppementTalents,
          description: "Identifiez les Skills Gaps individuels et collectifs.",
          icon: "target",
        },
        {
          label: "Équipe Insight",
          href: R.businessAnalytics,
          description: "Obtenez une lecture globale des profils et besoins de vos équipes.",
          icon: "users",
        },
      ],
      secondaryLinks: [],
      editorial: {
        title: "Transformez vos données RH en décisions.",
        description:
          "Identifiez les besoins, développez les compétences et choisissez les actions adaptées.",
        ctaLabel: "Découvrir le pilotage EDGE",
        ctaHref: R.businessTableauxDeBord,
      },
    },
  ];
}
