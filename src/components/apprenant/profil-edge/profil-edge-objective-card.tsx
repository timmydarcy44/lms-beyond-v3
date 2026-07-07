"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { objectiveTypeLabel, projectSummaryLines } from "@/lib/particulier/professional-project-fields";
import type { ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  project: ProfessionalProject;
  typeProfil?: string | null;
  careerTitle?: string | null;
};

export function ProfilEdgeObjectiveCard({ project, typeProfil, careerTitle }: Props) {
  const lines = projectSummaryLines(typeProfil, project);
  const metierLine = lines.find((l) => l.label.toLowerCase().includes("métier"));
  const metier = metierLine?.value || careerTitle || "—";

  return (
    <section className="rounded-2xl border border-[#3D7BFF]/20 bg-gradient-to-br from-[#3D7BFF]/10 to-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3D7BFF]">Projet professionnel</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Votre cap professionnel</h2>
          <p className="mt-1 text-xs text-white/45">{objectiveTypeLabel(typeProfil)}</p>
        </div>
        <Link
          href="/dashboard/apprenant/profil-comportemental/projet"
          className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-2 px-3 py-2 text-xs`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier mon projet professionnel
        </Link>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">Métier visé</dt>
          <dd className="mt-1 text-sm font-medium text-white">{metier}</dd>
        </div>
        {lines
          .filter((l) => !l.label.toLowerCase().includes("métier"))
          .slice(0, 2)
          .map((line) => (
            <div key={line.label}>
              <dt className="text-xs uppercase tracking-wider text-white/40">{line.label}</dt>
              <dd className="mt-1 text-sm text-white/85">{line.value}</dd>
            </div>
          ))}
      </dl>
    </section>
  );
}
