import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

export type MobileRevolutTabId =
  | "alternants"
  | "entreprises"
  | "particuliers"
  | "plateforme"
  | "a-propos";

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
  const { megaApprenants, megaBusiness, megaParticulier, nav, routes } = config;

  return [
    {
      id: "alternants",
      label: "École",
      discoverHref: routes.alternance,
      discoverLabel: megaApprenants.headerTitle,
      sections: megaApprenants.columns.flatMap((col) => {
        const groups = "groups" in col ? col.groups : [];
        if (groups.length > 0) {
          return groups.map((group) => ({
            title: col.title ? `${col.title} · ${group.title}` : group.title,
            links: group.links.map((link) => ({ label: link.label, href: link.href })),
          }));
        }
        return [
          {
            title: col.title,
            links: col.links.map((link) => ({ label: link.label, href: link.href })),
          },
        ];
      }),
      editorialTitle: "CFA Byound — rentrée 2027",
      editorialCtaLabel: "Manifestez votre intérêt",
      editorialCtaHref: routes.contact,
    },
    {
      id: "entreprises",
      label: "Entreprises",
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
      id: "particuliers",
      label: "Particuliers",
      discoverHref: megaParticulier.headerHref,
      discoverLabel: megaParticulier.headerTitle,
      sections: megaParticulier.columns.map((col) => ({
        title: col.title,
        links: col.links.map((link) => ({
          label: link.label,
          href: link.href,
        })),
      })),
      editorialTitle: "Votre prochain projet",
      editorialCtaLabel: "Espace particuliers",
      editorialCtaHref: routes.particulier,
    },
    {
      id: "plateforme",
      label: "Plateforme",
      discoverHref: nav.plateforme[0]?.href ?? routes.home,
      discoverLabel: "La plateforme",
      sections: [
        {
          title: "La plateforme",
          links: nav.plateforme.map((item) => ({
            label: item.label,
            href: item.href,
          })),
        },
      ],
      editorialTitle: "Compétences visibles",
      editorialCtaLabel: "Voir les Open Badges",
      editorialCtaHref: routes.businessOpenBadges,
    },
    {
      id: "a-propos",
      label: "À propos",
      discoverHref: routes.aPropos,
      discoverLabel: "À propos de Byound",
      sections: [
        {
          title: "Byound",
          links: [
            { label: "À propos", href: routes.aPropos },
            { label: "Notre mission", href: routes.notreMission },
            { label: "Contact", href: routes.contact },
          ],
        },
      ],
      editorialTitle: "Qui sommes-nous",
      editorialCtaLabel: "En savoir plus",
      editorialCtaHref: routes.aPropos,
    },
  ];
}
