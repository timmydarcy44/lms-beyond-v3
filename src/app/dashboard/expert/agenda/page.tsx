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
      <EdgeCard padding="lg" className="border-white/[0.07] bg-[#10173a]/70 text-center text-white shadow-none">
        <CalendarDays className="mx-auto h-10 w-10 text-[#A9AEFF]" />
        <p className="mt-4 text-sm font-medium">Agenda interactif en cours de déploiement</p>
        <p className="mt-2 text-sm text-white/50">
          Vos missions planifiées apparaîtront ici. En attendant, consultez le tableau de bord.
        </p>
        <Link href="/dashboard/expert" className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#070b1f]">
          Retour au cockpit
        </Link>
      </EdgeCard>
    </EdgeExpertPageShell>
  );
}
