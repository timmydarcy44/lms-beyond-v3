"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function ExpertAgendaPage() {
  return (
    <EdgeExpertPageShell
      title="Mon agenda"
      subtitle="Vue semaine et mois, synchronisation Google Agenda — vos missions validées s'y afficheront automatiquement."
    >
      <EdgeCard padding="lg" className="text-center">
        <CalendarDays className="mx-auto h-10 w-10 text-[#635BFF]" />
        <p className="mt-4 text-sm font-medium">Agenda interactif en cours de déploiement</p>
        <p className="mt-2 text-sm text-[#050505]/50">
          Vos missions planifiées apparaîtront ici. En attendant, consultez le tableau de bord.
        </p>
        <Link href="/dashboard/expert" className="mt-6 inline-flex text-sm font-medium text-[#635BFF] hover:underline">
          Retour au cockpit
        </Link>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
