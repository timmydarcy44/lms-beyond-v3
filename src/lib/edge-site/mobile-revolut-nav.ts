import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";
import type { PillarMegaMenuId } from "@/lib/edge-site/pillar-mega-menu-data";

export type MobileRevolutTabId = PillarMegaMenuId;

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
  return config.nav.pillarMegaMenus.map((pillar) => ({
    id: pillar.id,
    label: pillar.label,
    discoverHref: pillar.primaryLinks[0]?.href ?? config.routes.business,
    discoverLabel: pillar.subtitle,
    sections: [
      {
        title: pillar.title,
        links: [
          ...pillar.primaryLinks.map((link) => ({
            label: link.label,
            href: link.href,
            description: link.description,
            external: link.external,
          })),
          ...pillar.secondaryLinks.map((link) => ({
            label: link.label,
            href: link.href,
          })),
        ],
      },
    ],
    editorialTitle: pillar.editorial.title,
    editorialCtaLabel: pillar.editorial.ctaLabel,
    editorialCtaHref: pillar.editorial.ctaHref,
  }));
}
