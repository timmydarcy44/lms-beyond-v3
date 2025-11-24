import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { MentalHealthResponsesView } from "@/components/super-admin/mental-health-responses-view";
import { getServerClient } from "@/lib/supabase/server";

export default async function FormateurSanteMentalePage() {
  const session = await getSession();
  
  if (!session?.id) {
    redirect("/login");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/dashboard/formateur");
  }

  // Récupérer l'organisation du formateur
  const { data: membership } = await supabase
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", session.id)
    .limit(1)
    .single();

  const orgId = membership?.org_id;

  return (
    <DashboardShell
      title="Santé mentale - Réponses des apprenants"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Santé mentale" },
      ]}
    >
      <MentalHealthResponsesView orgId={orgId} canViewAll={true} />
    </DashboardShell>
  );
}








