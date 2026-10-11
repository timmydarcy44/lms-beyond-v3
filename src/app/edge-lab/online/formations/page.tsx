import type { Metadata } from "next";
import { EdgeBusinessFormerEquipesPage } from "@/components/edge-site/business/edge-business-former-equipes-page";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { fetchPublicTrainingCourses } from "@/lib/training-courses/queries";
import { getServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Formations courtes | Byound",
  description: "Développez une compétence concrète pour avancer dans votre parcours.",
};

export default async function Page() {
  const supabase = await getServerClient();
  const courses = await fetchPublicTrainingCourses(supabase);

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeBusinessFormerEquipesPage initialCourses={courses} audience="life" />
    </EdgePremiumShell>
  );
}
