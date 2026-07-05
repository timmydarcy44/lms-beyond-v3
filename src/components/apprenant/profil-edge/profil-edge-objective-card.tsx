"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import type { ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

type Props = {
  project: ProfessionalProject;
  careerTitle?: string | null;
};

export function ProfilEdgeObjectiveCard({ project, careerTitle }: Props) {
  const objectif = project.objectif?.trim() || "—";
  const metier = careerTitle || project.metier_vise?.trim() || "—";
  const secteur = project.secteur?.trim() || "—";

  return (
    <section className="rounded-2xl border border-[#3D7BFF]/20 bg-gradient-to-br from-[#3D7BFF]/10 to-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3D7BFF]">Mon objectif</p>
          <h2 className="mt-2 text-lg font-semibold text-white">Votre cap professionnel</h2>
        </div>
        <Link
          href="/dashboard/apprenant/profil-comportemental/projet"
          className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-2 px-3 py-2 text-xs`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Link>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">Objectif</dt>
          <dd className="mt-1 text-sm text-white/85">{objectif}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">Métier visé</dt>
          <dd className="mt-1 text-sm font-medium text-white">{metier}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-white/40">Secteur</dt>
          <dd className="mt-1 text-sm text-white/85">{secteur}</dd>
        </div>
      </dl>
    </section>
  );
}
