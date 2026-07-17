"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import {
  buildUserObjectiveDisplay,
  getEdgeProjectFromRecord,
  migrateLegacyProjectToV2,
  PROFESSION_OPTIONS,
  SECTEUR_V2_OPTIONS,
} from "@/lib/particulier/edge-professional-project-v2";
import type { ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { ProfilEdgeHubCard, ProfilEdgeHubKicker } from "./profil-edge-hub-card";

type Props = {
  project: ProfessionalProject;
  referentialTitle?: string | null;
};

function labelFor(
  options: ReadonlyArray<{ value: string; label: string }>,
  value: string | undefined,
) {
  if (!value?.trim()) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function ProfilEdgeHubObjective({ project, referentialTitle }: Props) {
  const migrated = migrateLegacyProjectToV2(project);
  const p = getEdgeProjectFromRecord(migrated);
  const display = buildUserObjectiveDisplay(migrated);

  return (
    <ProfilEdgeHubCard variant="accent" className="min-h-[220px] justify-between gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3D7BFF]/20 text-[#8BB4FF]">
          <Target className="h-6 w-6" />
        </div>
        <Link
          href={PROFIL_EDGE_SECTION_HREFS.projet}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/70 transition hover:border-white/20 hover:text-white"
        >
          Modifier
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div>
        <ProfilEdgeHubKicker>Votre objectif</ProfilEdgeHubKicker>
        {display ? (
          <h2 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[1.65rem]">
            {display}
          </h2>
        ) : (
          <p className="mt-3 text-[15px] leading-relaxed text-white/50">
            Définissez votre projet pour activer le chemin EDGE.
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Profession</p>
          <p className="mt-1 text-sm font-medium text-white">{labelFor(PROFESSION_OPTIONS, p.edge_profession)}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-white/35">Secteur</p>
          <p className="mt-1 text-sm font-medium text-white">{labelFor(SECTEUR_V2_OPTIONS, p.edge_secteur)}</p>
        </div>
      </div>

      {referentialTitle ? (
        <p className="text-xs text-white/40">Référentiel : {referentialTitle}</p>
      ) : null}
    </ProfilEdgeHubCard>
  );
}
