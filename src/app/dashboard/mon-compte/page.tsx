import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSession } from "@/lib/auth/session";
import { getDashboardRouteForRole } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";
import AccountOverview from "./account-overview";

export default async function MonComptePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const dashboardRoute = getDashboardRouteForRole(session.role);

  return (
    <DashboardShell
      title="Mon compte"
      breadcrumbs={[
        { label: "Dashboard", href: dashboardRoute },
        { label: "Mon compte" },
      ]}
    >
      <AccountOverview />
    </DashboardShell>
  );
}






