"use client";

import { EdgeExpertPageShell } from "@/components/edge-ui/edge-expert-page-shell";
import { EdgeCard } from "@/components/edge-ui/edge-card";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

const COURSES = [
  "Prompt Engineering",
  "DISC",
  "IA appliquée",
  "Leadership",
  "Soft Skills",
  "Management",
  "Communication",
];

export default function ExpertEdgeOnlinePage() {
  return (
    <EdgeExpertPageShell
      title="EDGE Online"
      subtitle="Continuez à développer vos compétences avec des parcours certifiants et des Open Badges."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((title) => (
          <EdgeCard key={title} hover padding="md">
            <GraduationCap className="h-6 w-6 text-[#635BFF]" />
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="mt-1 text-xs text-[#050505]/45">Open Badge · Niveau adaptatif</p>
            <button type="button" className="mt-4 w-full rounded-xl border border-[#635BFF]/20 py-2 text-xs font-semibold text-[#635BFF]">
              Continuer
            </button>
          </EdgeCard>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-[#050505]/45">
        <Link href="/dashboard/expert" className="text-[#635BFF] hover:underline">
          Retour au cockpit
        </Link>
      </p>
    </EdgeExpertPageShell>
  );
}
