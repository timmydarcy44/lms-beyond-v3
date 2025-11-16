import { DashboardShell } from "@/components/dashboard/dashboard-shell";

import AccountOverview from "./account-overview";

export default function MonComptePage() {
  return (
    <DashboardShell
      title="Mon compte"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/apprenant" },
        { label: "Mon compte" },
      ]}
    >
      <AccountOverview />
    </DashboardShell>
  );
}





