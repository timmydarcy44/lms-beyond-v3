import type { EdgePremiumConfig } from "@/lib/edge-site/premium-constants";

export type MobileRevolutTabId = "former" | "developper" | "recruter" | "piloter";

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
  return config.nav.pillars.map((pillar) => ({
    id: pillar.id,
    label: pillar.label,
    discoverHref: pillar.href,
    discoverLabel: `Découvrir · ${pillar.label}`,
    sections: [
      {
        title: pillar.label,
        links: pillar.items,
      },
    ],
  }));
}
