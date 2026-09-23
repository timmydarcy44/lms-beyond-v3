import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

export type MobileRevolutTabId = "alternance" | "business" | "fonctionnalites" | "ressources";

export type MobileRevolutSection = {
  title: string;
  links: { label: string; href: string; description?: string; external?: boolean }[];
};

export type MobileRevolutTabData = {
  id: MobileRevolutTabId;
  label: string;
  discoverHref: string;
  discoverLabel: string;
  sections: MobileRevolutSection[];
  editorialTitle: string;
  editorialCtaLabel: string;
  editorialCtaHref: string;
};

export function getMobileRevolutTabs(config: EdgePremiumConfig): MobileRevolutTabData[] {
  const { megaApprenants, megaBusiness, nav, links, routes } = config;

  return [
    {
      id: "alternance",
      label: "Alternance",
      discoverHref: megaApprenants.headerHref,
      discoverLabel: megaApprenants.headerTitle,
      sections: megaApprenants.columns.map((col) => ({
        title: col.title,
        links: col.links.map((link) => ({
          label: link.label,
          href: link.href,
        })),
      })),
      editorialTitle: "Trouver votre formation",
      editorialCtaLabel: "Voir les formations",
      editorialCtaHref: routes.formations,
    },
    {
      id: "business",
      label: "Business",
      discoverHref: megaBusiness.headerHref,
      discoverLabel: megaBusiness.headerTitle,
      sections: megaBusiness.columns.map((col) => ({
        title: col.title,
        links: col.links.map((link) => ({
          label: link.label,
          href: link.href,
        })),
      })),
      editorialTitle: "Équipes & compétences",
      editorialCtaLabel: "Demander une démo",
      editorialCtaHref: routes.businessDemo,
    },
    {
      id: "fonctionnalites",
      label: "Fonctionnalités",
      discoverHref: nav.fonctionnalites[0]?.href ?? links.home,
      discoverLabel: "Fonctionnalités",
      sections: [
        {
          title: "Fonctionnalités",
          links: nav.fonctionnalites.map((item) => ({
            label: item.label,
            href: item.href,
          })),
        },
      ],
      editorialTitle: "Découvrir la plateforme",
      editorialCtaLabel: "Découvrir Byound",
      editorialCtaHref: links.decouvrirEdge,
    },
    {
      id: "ressources",
      label: "Ressources",
      discoverHref: nav.ressources[0]?.href ?? links.home,
      discoverLabel: "Ressources",
      sections: [
        {
          title: "Ressources",
          links: nav.ressources.map((item) => ({
            label: item.label,
            href: item.href,
          })),
        },
      ],
      editorialTitle: "Aller plus loin",
      editorialCtaLabel: "Contact",
      editorialCtaHref: links.contact,
    },
  ];
}
