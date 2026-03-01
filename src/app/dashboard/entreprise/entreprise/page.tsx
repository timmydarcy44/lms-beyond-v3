"use client";

import { CompanyProfile } from "@/components/beyond-connect/company-profile";
import { DashboardShell } from "@/components/beyond-connect/dashboard-shell";

export default function CompanyProfilePage() {
  return (
    <DashboardShell breadcrumbs={["Dashboard", "Entreprise"]}>
      <CompanyProfile />
    </DashboardShell>
  );
}
