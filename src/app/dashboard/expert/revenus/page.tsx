"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { Euro } from "lucide-react";

export default function ExpertRevenusPage() {
  return (
    <EdgeExpertPageShell
      title="Mes revenus"
      subtitle="CA mensuel, annuel, panier moyen et exports PDF / Excel."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {["CA mensuel", "CA annuel", "Panier moyen"].map((label) => (
          <EdgeCard key={label} padding="md">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">{label}</p>
            <p className="mt-2 text-2xl font-semibold">—</p>
          </EdgeCard>
        ))}
      </div>
      <EdgeCard padding="lg" className="mt-6 text-center">
        <Euro className="mx-auto h-10 w-10 text-[#635BFF]" />
        <p className="mt-4 text-sm font-medium">Tableau financier complet bientôt disponible</p>
        <p className="mt-2 text-sm text-[#050505]/50">
          Vos revenus seront calculés automatiquement à partir des missions réalisées.
        </p>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
