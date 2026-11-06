"use client";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { DashboardReclamationForm } from "@/components/qualiopi/dashboard-reclamation-form";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";

export default function EntrepriseReclamationPage() {
  return (
    <div className="flex min-h-screen bg-[#f7f5fb] text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-500">Qualité</p>
        <h1 className={`mt-2 ${ENTREPRISE_H1_CLASS}`}>Réclamation</h1>
        <div className="mt-6 max-w-xl">
          <DashboardReclamationForm audience="entreprise" tone="light" />
        </div>
      </main>
    </div>
  );
}
