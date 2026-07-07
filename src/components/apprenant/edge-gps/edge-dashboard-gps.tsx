"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCoachingBookingHref } from "@/lib/particulier/coaching-config";
import type { EdgeProgressionGps } from "@/lib/apprenant/edge-progression-gps";
import {
  EdgeSkillsGapTable,
  type OnboardingRowHighlight,
} from "@/components/apprenant/edge-gps/edge-skills-gap-table";
import { EdgeAccompagnementNudge } from "@/components/apprenant/edge-gps/edge-accompagnement-nudge";
import type { FirstStepsStep } from "@/components/apprenant/edge-gps/edge-first-steps-guide";

type Props = {
  gps: EdgeProgressionGps;
  loading?: boolean;
  onWhatNow?: () => void;
  onRequestParcours?: () => void;
  onViewGaps?: () => void;
  firstStepsStep?: FirstStepsStep | null;
  onboardingHighlights?: Record<string, OnboardingRowHighlight>;
};

const CARD = "rounded-2xl border border-white/[0.08] bg-white/[0.03]";

export function EdgeDashboardGps({
  gps,
  loading,
  onWhatNow,
  onRequestParcours,
  onViewGaps,
  firstStepsStep,
  onboardingHighlights,
}: Props) {
  if (loading) {
    return (
      <div className="mb-6 space-y-3 animate-pulse sm:mb-8 sm:space-y-4">
        <div className="h-28 rounded-2xl bg-white/[0.04] sm:h-32" />
        <div className="h-36 rounded-2xl bg-white/[0.04] sm:h-40" />
      </div>
    );
  }

  const objectiveHighlighted = firstStepsStep === "objective";
  const nextStepHighlighted = firstStepsStep === "build";

  return (
    <div className="mb-6 space-y-4 sm:mb-10 sm:space-y-5">
      {/* 1. Mon objectif */}
      <section
        id="edge-objective-section"
        className={cn(
          CARD,
          "p-4 transition sm:p-6",
          objectiveHighlighted && "border-[#3D7BFF]/30 ring-2 ring-[#3D7BFF]/45",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Mon objectif</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold tracking-tight text-white sm:text-2xl">{gps.objectiveTitle}</h2>
            {gps.referentialTitle ? (
              <p className="mt-1.5 text-xs text-white/40">
                Référentiel actuellement utilisé : {gps.referentialTitle}
              </p>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-white/60">{gps.summarySentence}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            <span className="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
              {gps.compatibilityPercent}
            </span>
            <span className="text-[10px] text-white/40">compatibilité</span>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-3">
          {onRequestParcours ? (
            <Link
              href={getCoachingBookingHref("progression")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90 sm:w-auto sm:rounded-lg sm:py-2.5"
            >
              Construire mon parcours EDGE avec un expert
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {onWhatNow ? (
            <button
              type="button"
              onClick={onWhatNow}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.05] sm:w-auto sm:rounded-lg sm:py-2.5"
            >
              <Compass className="h-4 w-4" />
              Que faire maintenant ?
            </button>
          ) : null}
        </div>
      </section>

      {/* 2. Ma prochaine étape */}
      <section
        id="edge-next-step-section"
        className={cn(
          "rounded-2xl border border-[#3D7BFF]/30 bg-gradient-to-br from-[#3D7BFF]/15 via-[#3D7BFF]/5 to-transparent p-4 transition sm:p-7",
          nextStepHighlighted && "ring-2 ring-[#3D7BFF]/45",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Ma prochaine étape
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75">
          EDGE a identifié vos écarts. Un expert peut construire une recommandation personnalisée à partir
          de vos résultats — sans parcours générique.
        </p>
        {gps.prioritySkill && gps.hasObjective ? (
          <p className="mt-3 text-sm font-medium text-white">
            Priorité détectée : <span className="text-[#8BB4FF]">{gps.prioritySkill}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3">
          {onRequestParcours ? (
            <Link
              href={getCoachingBookingHref("progression")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3D7BFF] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2F6AE8] sm:w-auto sm:rounded-lg"
            >
              Construire mon parcours EDGE avec un expert
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          {onViewGaps ? (
            <button
              type="button"
              onClick={onViewGaps}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.05] sm:w-auto sm:rounded-lg"
            >
              Voir mes écarts
            </button>
          ) : null}
        </div>
      </section>

      {/* 3. Mon parcours */}
      <section className={cn(CARD, "p-4 sm:p-6")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Mon parcours</p>
        <ol className="mt-4 space-y-3 sm:mt-5 sm:flex sm:gap-0 sm:space-y-0 sm:overflow-x-auto sm:pb-2">
          {gps.timeline.map((step, i) => (
            <li
              key={step.id}
              className="flex gap-3 sm:min-w-[120px] sm:flex-1 sm:flex-col sm:items-center sm:px-2 sm:text-center sm:last:min-w-[100px]"
            >
              <div className="hidden w-full items-center sm:flex">
                {i > 0 ? <div className="h-px flex-1 bg-white/10" /> : <div className="flex-1" />}
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    step.status === "done" && "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                    step.status === "current" && "border-[#3D7BFF] bg-[#3D7BFF]/20 text-[#8BB4FF]",
                    step.status === "upcoming" && "border-white/15 bg-white/[0.03] text-white/30",
                  )}
                >
                  {step.status === "done" ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  ) : (
                    <Circle className="h-2 w-2 fill-current" />
                  )}
                </span>
                {i < gps.timeline.length - 1 ? <div className="h-px flex-1 bg-white/10" /> : <div className="flex-1" />}
              </div>
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border sm:hidden",
                  step.status === "done" && "border-emerald-500/50 bg-emerald-500/15 text-emerald-400",
                  step.status === "current" && "border-[#3D7BFF] bg-[#3D7BFF]/20 text-[#8BB4FF]",
                  step.status === "upcoming" && "border-white/15 text-white/30",
                )}
              >
                {step.status === "done" ? <Check className="h-3 w-3" /> : <Circle className="h-1.5 w-1.5 fill-current" />}
              </span>
              <p
                className={cn(
                  "min-w-0 flex-1 text-sm leading-snug sm:mt-2 sm:text-[11px] sm:leading-tight",
                  step.status === "done" && "text-white/70",
                  step.status === "current" && "font-medium text-white",
                  step.status === "upcoming" && "text-white/35",
                )}
              >
                {step.label}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. Mes compétences */}
      <div
        id="edge-skills-gaps"
        className={cn(
          firstStepsStep === "gaps" ? "rounded-2xl ring-2 ring-[#3D7BFF]/35" : "",
        )}
      >
        <EdgeSkillsGapTable
          skills={gps.skills}
          objectiveTitle={gps.objectiveTitle}
          onboardingHighlights={onboardingHighlights}
        />
      </div>

      {/* 5. Accompagnement */}
      <EdgeAccompagnementNudge onRequestParcours={onRequestParcours} />
    </div>
  );
}
