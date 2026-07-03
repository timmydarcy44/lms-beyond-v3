import type { Metadata } from "next";
import { EdgeBusinessFormerEquipesPage } from "@/components/edge-site/business/edge-business-former-equipes-page";
import { EdgePremiumBrandPillars } from "@/components/edge-site/premium/edge-premium-brand-pillars";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { fetchPublicTrainingCourses } from "@/lib/training-courses/queries";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Former vos équipes | EDGE Business",
  description:
    "Catalogue de formations professionnelles : 12 domaines, 80+ modules, parcours intra et inter, présentiel, distanciel et blended. Open Badges et niveaux 1 à 5.",
};

export default async function Page() {
  const supabase = await getServerClient();
  const courses = await fetchPublicTrainingCourses(supabase);

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeBusinessFormerEquipesPage initialCourses={courses} />
      <EdgePremiumBrandPillars />
    </EdgePremiumShell>
  );
}
