"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { PROFIL_EDGE_SECTION_HREFS } from "@/lib/particulier/profil-edge-maturity";
import { cn } from "@/lib/utils";

/** Asset facilement remplaçable — œuvre visuelle unique de Mon évolution. */
export const EVOLUTION_HERO_ABSTRACT_SRC = "/images/beyond-hero-abstract.png";

type Props = {
  objectiveLabel: string;
  referentialTitle?: string | null;
  matching: CareerMatchingResult | null;
  hasProject: boolean;
  loading?: boolean;
  error?: string | null;
};

export function EvolutionAbstractHeroCard({
  objectiveLabel,
  referentialTitle,
  matching,
  hasProject,
  loading = false,
  error = null,
}: Props) {
  const score = matching?.compatibilityScore;
  const priority = matching?.nextPriority?.skill;
  const forces = matching?.strengths.length ?? 0;
  const priorities = matching
    ? matching.develop.length + matching.consolidate.length
    : 0;

  return (
    <article
      className={cn(
        "relative isolate overflow-hidden rounded-[28px]",
        "min-h-[420px] border border-white/[0.08] bg-[#0B0D12]",
        "shadow-[0_24px_60px_-28px_rgba(0,0,0,0.75)]",
      )}
    >
      {/* Visuel abstrait — droite desktop / haut mobile */}
      <div
        className="pointer-events-none absolute inset-0 md:left-[42%]"
        aria-hidden
      >
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src={EVOLUTION_HERO_ABSTRACT_SRC}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 55vw"
            className={cn(
              "object-cover object-[68%_40%] opacity-[0.55] saturate-[0.75] contrast-[1.05]",
              "md:opacity-70",
              "motion-safe:animate-[evolution-hero-drift_28s_ease-in-out_infinite_alternate]",
              "motion-reduce:animate-none",
            )}
          />
        </div>
        {/* Teinte + fondu lisibilité */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0D12]/75 via-[#0B0D12]/45 to-[#0B0D12] md:bg-gradient-to-r md:from-[#0B0D12] md:via-[#0B0D12]/88 md:to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(61,123,255,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-[1] flex min-h-[420px] flex-col justify-between gap-8 p-6 sm:p-8 md:max-w-[58%] md:p-10">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Mon évolution
          </p>

          {error ? (
            <div className="mt-6 space-y-3">
              <h2 className="text-[1.75rem] font-bold tracking-[-0.035em] text-white sm:text-[2rem]">
                Impossible de charger votre évolution
              </h2>
              <p className="text-[15px] text-white/70">{error}</p>
            </div>
          ) : loading ? (
            <div className="mt-6 space-y-4">
              <div className="mt-6 h-8 w-[80%] max-w-md animate-pulse rounded-lg bg-white/10" />
              <div className="h-4 w-[65%] max-w-sm animate-pulse rounded bg-white/10" />
              <div className="mt-8 h-16 w-32 animate-pulse rounded-lg bg-white/10" />
            </div>
          ) : !hasProject ? (
            <div className="mt-5 space-y-4">
              <h2 className="text-[1.85rem] font-bold leading-[1.12] tracking-[-0.04em] text-white sm:text-[2.25rem]">
                Définissez votre prochaine direction.
              </h2>
              <p className="max-w-md text-[16px] leading-relaxed text-white/70">
                Indiquez votre objectif professionnel pour que EDGE puisse construire votre
                progression.
              </p>
              <Link
                href={PROFIL_EDGE_SECTION_HREFS.projet}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-black sm:w-auto"
              >
                Définir mon objectif
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <h2 className="text-[1.85rem] font-bold leading-[1.12] tracking-[-0.04em] text-white sm:text-[2.25rem]">
                Vous construisez votre avenir professionnel.
              </h2>

              <div>
                <p className="text-[13px] text-white/50">Objectif actuel</p>
                <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.02em] text-white">
                  {objectiveLabel}
                </p>
                {referentialTitle ? (
                  <p className="mt-1 text-[14px] text-white/55">Référentiel · {referentialTitle}</p>
                ) : null}
              </div>

              {matching && score != null ? (
                <>
                  <div>
                    <p className="text-[4.5rem] font-bold leading-none tracking-[-0.06em] text-white tabular-nums sm:text-[5.25rem]">
                      {score}
                      <span className="text-[1.5rem] font-semibold text-white/45"> %</span>
                    </p>
                    <p className="mt-2 text-[15px] text-white/60">d&apos;alignement</p>
                  </div>

                  {priority ? (
                    <p className="max-w-md text-[15px] leading-relaxed text-white/80">
                      Votre prochaine progression prioritaire concerne{" "}
                      <span className="font-semibold text-white">{priority}</span>.
                    </p>
                  ) : (
                    <p className="max-w-md text-[15px] leading-relaxed text-white/70">
                      Votre diagnostic est en cours — poursuivez vos explorations pour affiner la
                      priorité.
                    </p>
                  )}

                  <p className="text-[14px] text-white/50">
                    {forces} force{forces > 1 ? "s" : ""} identifiée{forces > 1 ? "s" : ""}
                    <span className="mx-2 text-white/25">·</span>
                    {priorities} priorité{priorities > 1 ? "s" : ""} actuelle
                    {priorities > 1 ? "s" : ""}
                  </p>
                </>
              ) : (
                <p className="max-w-md text-[15px] leading-relaxed text-white/70">
                  {referentialTitle || hasProject
                    ? "L’alignement se calcule dès que votre diagnostic EDGE est complet et votre projet enregistré."
                    : "Complétez votre diagnostic pour activer l’alignement."}
                </p>
              )}
            </div>
          )}
        </div>

        {!loading && !error && hasProject ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#ma-mission"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3D7BFF] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(61,123,255,0.65)] sm:w-auto"
            >
              Continuer ma progression
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#plan-action"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm sm:w-auto"
            >
              Voir mon plan d&apos;action
            </a>
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        @keyframes evolution-hero-drift {
          from {
            transform: scale(1) translate3d(0, 0, 0);
          }
          to {
            transform: scale(1.06) translate3d(-1.5%, 1%, 0);
          }
        }
      `}</style>
    </article>
  );
}
