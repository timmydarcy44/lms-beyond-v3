"use client";

import Link from "next/link";
import { ArrowRight, Pencil } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { HubSurface } from "./hub-ui";

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
    <HubSurface tone="hero" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#3D7BFF]/15 blur-3xl"
        aria-hidden
      />
      <div className="relative space-y-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-medium text-white/45">Mon objectif</p>
          <Link
            href={PROFIL_EDGE_SECTION_HREFS.projet}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] text-white/65 transition hover:text-white"
          >
            <Pencil className="h-3 w-3" />
            Modifier
          </Link>
        </div>

        <div>
          <h2 className="text-[1.65rem] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[1.85rem]">
            {hasProject ? objectiveLabel : "Définissez votre objectif professionnel"}
          </h2>
          {referentialTitle ? (
            <p className="mt-2 text-[14px] text-white/45">Référentiel · {referentialTitle}</p>
          ) : null}
        </div>

        {matching && score != null ? (
          <>
            <div>
              <p className="text-[4rem] font-semibold leading-none tracking-[-0.05em] text-white tabular-nums sm:text-[4.5rem]">
                {score}
                <span className="text-[1.75rem] text-white/35">%</span>
              </p>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/65">
                Vous êtes aligné à {score}&nbsp;% avec votre objectif
                {referentialTitle ? ` ${referentialTitle}` : ""}.
              </p>
            </div>

            {priority ? (
              <p className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-[15px] leading-relaxed text-white/80">
                Votre prochaine progression prioritaire concerne{" "}
                <span className="font-semibold text-white">{priority}</span>.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-white/50">
              <span>
                <span className="font-semibold tabular-nums text-white">{forces}</span> force
                {forces > 1 ? "s" : ""}
              </span>
              <span>
                <span className="font-semibold tabular-nums text-white">{priorities}</span> priorité
                {priorities > 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <a href="#plan-action" className={`${CONNECT_BTN_PRIMARY} justify-center sm:w-auto`}>
                Voir mon plan d&apos;action
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link
                href={PROFIL_EDGE_SECTION_HREFS.projet}
                className={`${CONNECT_BTN_SECONDARY} justify-center sm:w-auto`}
              >
                Modifier mon objectif
              </Link>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-[15px] leading-relaxed text-white/55">
              {hasProject
                ? "Enregistrez votre projet pour activer l’analyse d’alignement métier."
                : "Indiquez où vous voulez aller — EDGE construira le chemin."}
            </p>
            <Link href={PROFIL_EDGE_SECTION_HREFS.projet} className={`${CONNECT_BTN_PRIMARY} w-full justify-center sm:w-auto`}>
              {hasProject ? "Activer mon analyse" : "Définir mon objectif"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </HubSurface>
  );
}
