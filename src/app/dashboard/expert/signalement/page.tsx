"use client";

import { DashboardSignalementForm } from "@/components/qualiopi/dashboard-signalement-form";

export default function ExpertSignalementPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <DashboardSignalementForm audience="expert" tone="dark" />
    </div>
  );
}
