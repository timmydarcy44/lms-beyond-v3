"use client";

import { ExpertApprovedDashboard } from "@/components/expert/expert-approved-dashboard";
import { ExpertPendingDashboard } from "@/components/expert/expert-pending-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";

export default function ExpertDashboardPage() {
  const { isApproved } = useExpertAccess();

  if (!isApproved) {
    return <ExpertPendingDashboard />;
  }

  return <ExpertApprovedDashboard />;
}
