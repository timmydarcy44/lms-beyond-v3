"use client";

import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { HubGhostCta, HubPillCta, HubSurface } from "./hub-ui";

type Props = {
  objectiveLabel: string;
  referentialTitle?: string | null;
  matching: CareerMatchingResult | null;
  hasProject: boolean;
};

export function ProfileHeroCard({ objectiveLabel, referentialTitle, matching, hasProject }: Props) {
  const score = matching?.compatibilityScore;
  const priority = matching?.nextPriority?.skill;
  const forces = matching?.strengths.length ?? 0;
  const priorities = matching
    ? matching.develop.length + matching.consolidate.length
    : 0;

  return (
    <HubSurface tone="ocean" className="min-h-[420px] flex flex-col justify-between gap-8">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-white/70">Mon objectif</p>
        <Link
          href={PROFIL_EDGE_SECTION_HREFS.projet}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm"
        >
          <Pencil className="h-3 w-3" />
          Modifier
        </Link>
      </div>

      <div>
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.04em] text-white sm:text-[2.35rem]">
          {hasProject ? objectiveLabel : "Définissez votre objectif"}
        </h2>
        {referentialTitle ? (
          <p className="mt-2 text-[15px] text-white/65">Référentiel · {referentialTitle}</p>
        ) : null}
      </div>

      {matching && score != null ? (
        <>
          <div>
            <p className="text-[5.5rem] font-bold leading-none tracking-[-0.06em] text-white tabular-nums sm:text-[6rem]">
              {score}
              <span className="text-[2rem] text-white/50">%</span>
            </p>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-white/80">
              Vous êtes aligné à {score}&nbsp;% avec votre objectif
              {referentialTitle ? ` ${referentialTitle}` : ""}.
            </p>
          </div>

          {priority ? (
            <p className="rounded-2xl bg-black/25 px-4 py-3.5 text-[15px] leading-relaxed text-white/90 backdrop-blur-sm">
              Votre prochaine progression prioritaire concerne{" "}
              <span className="font-bold text-white">{priority}</span>.
            </p>
          ) : null}

          <p className="text-[14px] text-white/65">
            <span className="font-semibold text-white">{forces}</span> force{forces > 1 ? "s" : ""}
            <span className="mx-2 text-white/35">·</span>
            <span className="font-semibold text-white">{priorities}</span> priorité
            {priorities > 1 ? "s" : ""}
          </p>

          <div className="flex flex-col gap-3">
            <a href="#plan-action">
              <HubPillCta>
                Voir mon plan d&apos;action
                <ArrowRight className="h-4 w-4" />
              </HubPillCta>
            </a>
            <Link href={PROFIL_EDGE_SECTION_HREFS.projet}>
              <HubGhostCta>Modifier mon objectif</HubGhostCta>
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-5">
          <p className="text-[16px] leading-relaxed text-white/75">
            {hasProject
              ? "Enregistrez votre projet pour activer l’analyse d’alignement métier."
              : "Indiquez où vous voulez aller — EDGE construira le chemin."}
          </p>
          <Link href={PROFIL_EDGE_SECTION_HREFS.projet}>
            <HubPillCta>
              {hasProject ? "Activer mon analyse" : "Définir mon objectif"}
              <ArrowRight className="h-4 w-4" />
            </HubPillCta>
          </Link>
        </div>
      )}
    </HubSurface>
  );
}
