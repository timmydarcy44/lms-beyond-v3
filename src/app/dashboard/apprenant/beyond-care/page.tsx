import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LearnerBeyondCareDashboard } from "@/components/beyond-care/learner-beyond-care-dashboard";
import { hasUserFeature } from "@/lib/queries/organization-features";

export default async function LearnerBeyondCarePage() {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérifier si l'organisation a accès à Beyond Care
  const hasAccess = await hasUserFeature("beyond_care");
  
  if (!hasAccess) {
    redirect("/dashboard/apprenant");
  }

  return (
    <DashboardShell
      title="Beyond Care"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Beyond Care" },
      ]}
    >
      <LearnerBeyondCareDashboard />
    </DashboardShell>
  );
}




