"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { Bell } from "lucide-react";

export default function ExpertNotificationsPage() {
  return (
    <EdgeExpertPageShell title="Notifications" subtitle="Missions, validations, messages Byound — tout au même endroit.">
      <EdgeCard padding="lg" className="border-white/[0.07] bg-[#10173a]/70 text-center text-white shadow-none">
        <Bell className="mx-auto h-10 w-10 text-[#A9AEFF]" />
        <p className="mt-4 text-sm text-white/55">Aucune notification pour le moment.</p>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
