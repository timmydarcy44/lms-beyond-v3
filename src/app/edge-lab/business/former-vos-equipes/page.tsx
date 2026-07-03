import type { Metadata } from "next";
import { EdgeBusinessFormerEquipesPage } from "@/components/edge-site/business/edge-business-former-equipes-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";

export const metadata: Metadata = {
  title: "Former vos équipes | EDGE Business",
  description:
    "Catalogue de formations professionnelles : 12 domaines, 80+ modules, parcours intra et inter, présentiel, distanciel et blended. Open Badges et niveaux 1 à 5.",
};

export default function Page() {
  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeBusinessFormerEquipesPage />
    </EdgePremiumShell>
  );
}
