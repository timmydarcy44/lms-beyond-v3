"use client";

import { DashboardReclamationForm } from "@/components/qualiopi/dashboard-reclamation-form";

export default function ExpertReclamationPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <DashboardReclamationForm audience="expert" tone="dark" />
    </div>
  );
}
