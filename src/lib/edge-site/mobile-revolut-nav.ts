import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";
import { EDGE_ONLINE_EXTERNAL_URL } from "@/lib/training-courses/types";

export type MobileRevolutTabId = "business" | "particulier";

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
  return [
    {
      id: "business",
      label: "Business",
      discoverHref: config.megaBusiness.headerHref,
      discoverLabel: "Découvrir EDGE Business",
      sections: config.megaBusiness.columns.map((col) => ({
        title: col.title,
        links: col.links,
      })),
    },
    {
      id: "particulier",
      label: "Particulier",
      discoverHref: config.megaParticulier.headerHref,
      discoverLabel: "Découvrir EDGE Particulier",
      sections: config.megaParticulier.columns.map((col) => ({
        title: col.title,
        links: col.links.map((link) =>
          link.label === "EDGE Online"
            ? { ...link, href: EDGE_ONLINE_EXTERNAL_URL }
            : link,
        ),
      })),
    },
  ];
}
