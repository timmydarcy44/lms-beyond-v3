"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";

export default function ExpertDashboardPage() {
  const { isApproved } = useExpertAccess();
  return <ExpertCockpitDashboard restricted={!isApproved} />;
}
