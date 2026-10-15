"use client";

import { ExpertCockpitDashboard } from "@/components/expert/expert-cockpit-dashboard";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { JadeDemoGate } from "@/components/demo/jade-demo-gate";

export default function ExpertDashboardPage() {
  return (
    <JadeDemoGate space="expert">
      <ExpertDashboardInner />
    </JadeDemoGate>
  );
}

function ExpertDashboardInner() {
  const { isApproved } = useExpertAccess();
  return <ExpertCockpitDashboard restricted={!isApproved} />;
}
