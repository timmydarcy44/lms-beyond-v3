"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { ExpertPendingDashboard } from "@/components/expert/expert-pending-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";

export default function ExpertDashboardPage() {
  const { isApproved } = useExpertAccess();

  if (!isApproved) {
    return <ExpertPendingDashboard />;
  }

  return <ExpertCockpitDashboard />;
}
