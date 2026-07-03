import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

export type MobileRevolutTabId = "apprenants" | "business" | "formateurs";

export type MobileRevolutSection = {
  title: string;
  links: { label: string; href: string }[];
};

export type MobileRevolutTabData = {
  id: MobileRevolutTabId;
  label: string;
  discoverHref: string;
  discoverLabel: string;
  sections: MobileRevolutSection[];
};

export function getMobileRevolutTabs(config: EdgePremiumConfig): MobileRevolutTabData[] {
  const R = config.routes;
  const expertBase = R.expertDashboard;

  return [
    {
      id: "apprenants",
      label: "Apprenants",
      discoverHref: config.megaApprenants.headerHref,
      discoverLabel: "Découvrir EDGE",
      sections: config.megaApprenants.columns.map((col) => ({
        title: col.title,
        links: col.links,
      })),
    },
    {
      id: "business",
      label: "Business",
      discoverHref: config.megaBusiness.headerHref,
      discoverLabel: "Découvrir EDGE",
      sections: config.megaBusiness.columns.map((col) => ({
        title: col.title,
        links: col.links,
      })),
    },
    {
      id: "formateurs",
      label: "Formateurs",
      discoverHref: R.formateursExperts,
      discoverLabel: "Découvrir EDGE",
      sections: [
        {
          title: "Rejoindre EDGE",
          links: [
            { label: "Devenir formateur / expert", href: R.expertSignup },
            { label: "Le réseau EDGE", href: R.formateursExperts },
          ],
        },
        {
          title: "Mon profil",
          links: [
            { label: "Mon espace formateur", href: expertBase },
            { label: "Compléter mon profil", href: `${expertBase}/profile` },
          ],
        },
        {
          title: "EDGE Certified",
          links: [{ label: "Parcours certification", href: `${expertBase}/certification` }],
        },
        {
          title: "Missions",
          links: [
            { label: "Mes missions", href: `${expertBase}/interventions` },
            { label: "Mon agenda", href: `${expertBase}/agenda` },
          ],
        },
        {
          title: "Aide",
          links: [
            { label: "Centre d'aide", href: `${expertBase}/support` },
            { label: "Contact", href: R.contact },
          ],
        },
      ],
    },
  ];
}
