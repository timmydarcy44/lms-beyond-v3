"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  buildUserObjectiveDisplay,
  getEdgeProjectFromRecord,
  migrateLegacyProjectToV2,
  PROFESSION_OPTIONS,
  SECTEUR_V2_OPTIONS,
} from "@/lib/particulier/edge-professional-project-v2";
import type { ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";

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
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
            1. Votre objectif
          </p>
          {display ? (
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{display}</h2>
          ) : (
            <p className="mt-2 text-sm text-white/50">Définissez votre projet professionnel.</p>
          )}
        </div>
        <Link
          href={PROFIL_EDGE_SECTION_HREFS.projet}
          className={`${CONNECT_BTN_SECONDARY} inline-flex shrink-0 items-center gap-2 px-3 py-2 text-xs`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Modifier
        </Link>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Profession</dt>
          <dd className="mt-1 text-sm font-medium text-white">
            {labelFor(PROFESSION_OPTIONS, p.edge_profession)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Secteur</dt>
          <dd className="mt-1 text-sm font-medium text-white">
            {labelFor(SECTEUR_V2_OPTIONS, p.edge_secteur)}
          </dd>
        </div>
        {p.edge_specialite?.trim() ? (
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Spécialité</dt>
            <dd className="mt-1 text-sm text-white/85">{p.edge_specialite}</dd>
          </div>
        ) : null}
        {p.edge_projet_libre?.trim() ? (
          <div className={p.edge_specialite?.trim() ? "sm:col-span-2" : ""}>
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Objectif libre</dt>
            <dd className="mt-1 text-sm leading-relaxed text-white/75">{p.edge_projet_libre}</dd>
          </div>
        ) : null}
      </dl>

      {referentialTitle ? (
        <p className="mt-4 text-xs text-white/40">
          Référentiel actuellement utilisé : {referentialTitle}
        </p>
      ) : null}
    </section>
  );
}
