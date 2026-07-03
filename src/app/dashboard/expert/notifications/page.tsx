"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { Bell } from "lucide-react";

export default function ExpertNotificationsPage() {
  return (
    <EdgeExpertPageShell title="Notifications" subtitle="Missions, validations, messages EDGE — tout au même endroit.">
      <EdgeCard padding="lg" className="text-center">
        <Bell className="mx-auto h-10 w-10 text-[#635BFF]" />
        <p className="mt-4 text-sm text-[#050505]/55">Aucune notification pour le moment.</p>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
