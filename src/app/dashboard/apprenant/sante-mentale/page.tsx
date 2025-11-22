import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MentalHealthDashboard } from "@/components/apprenant/mental-health-dashboard";
import { hasUserFeature } from "@/lib/queries/organization-features";

export default async function SanteMentalePage() {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  // Vérifier si l'utilisateur a accès à la fonctionnalité santé mentale
  const hasAccess = await hasUserFeature("mental_health_tracking");
  
  if (!hasAccess) {
    redirect("/dashboard/apprenant");
  }

  return (
    <DashboardShell
      title="Santé mentale"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Santé mentale" },
      ]}
    >
      <MentalHealthDashboard />
    </DashboardShell>
  );
}







