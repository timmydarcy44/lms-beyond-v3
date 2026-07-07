"use client";

import { ArrowRight, Check, Circle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
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
  prioritySelectMode?: boolean;
  selectedPriority?: string | null;
  onSelectPriority?: (skillName: string) => void;
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
  prioritySelectMode,
  selectedPriority,
  onSelectPriority,
}: Props) {
  if (loading) {
    return (
      <div className="mb-8 space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  const objectiveHighlighted = firstStepsStep === "objective";
  const accompagnementHighlighted = firstStepsStep === "parcours";

  return (
    <div className="mb-10 space-y-5">
      <section
        id="edge-objective-section"
        className={cn(
          CARD,
          "p-5 transition sm:p-6",
          objectiveHighlighted && "ring-2 ring-[#3D7BFF]/45 border-[#3D7BFF]/30",
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Mon objectif</p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{gps.objectiveTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{gps.summarySentence}</p>
          </div>
          <div className="flex shrink-0 items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-white">
              {gps.compatibilityPercent}
            </span>
            <span className="text-sm text-white/40">%</span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {onRequestParcours ? (
            <button
              type="button"
              onClick={onRequestParcours}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
            >
              Construire mon parcours EDGE
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
          {onWhatNow ? (
            <button
              type="button"
              onClick={onWhatNow}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.05]"
            >
              <Compass className="h-4 w-4" />
              Que faire maintenant ?
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#3D7BFF]/30 bg-gradient-to-br from-[#3D7BFF]/15 via-[#3D7BFF]/5 to-transparent p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Votre prochaine étape
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">
          EDGE a identifié les compétences qui influencent le plus votre objectif. Pour éviter un parcours
          générique, nous vous proposons de construire une recommandation personnalisée à partir de vos
          résultats.
        </p>
        {gps.prioritySkill && gps.hasObjective ? (
          <p className="mt-4 text-sm font-medium text-white">
            Compétence prioritaire identifiée :{" "}
            <span className="text-[#8BB4FF]">{gps.prioritySkill}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {onRequestParcours ? (
            <button
              type="button"
              onClick={onRequestParcours}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3D7BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2F6AE8]"
            >
              Construire mon parcours EDGE
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
          {onViewGaps ? (
            <button
              type="button"
              onClick={onViewGaps}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.05]"
            >
              Voir mes écarts
            </button>
          ) : null}
        </div>
      </section>

      <section className={cn(CARD, "p-5 sm:p-6")}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Votre parcours</p>
        <ol className="mt-5 flex gap-0 overflow-x-auto pb-2">
          {gps.timeline.map((step, i) => (
            <li key={step.id} className="flex min-w-[120px] flex-1 flex-col items-center px-2 text-center last:min-w-[100px]">
              <div className="flex w-full items-center">
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
              <p
                className={cn(
                  "mt-2 text-[11px] leading-tight",
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

      <div
        id="edge-skills-gaps"
        className={cn(
          firstStepsStep === "gaps" || firstStepsStep === "priority"
            ? "rounded-2xl ring-2 ring-[#3D7BFF]/35"
            : "",
        )}
      >
        <EdgeSkillsGapTable
          skills={gps.skills}
          objectiveTitle={gps.objectiveTitle}
          onboardingHighlights={onboardingHighlights}
          prioritySelectMode={prioritySelectMode}
          selectedPriority={selectedPriority}
          onSelectPriority={onSelectPriority}
        />
      </div>

      <EdgeAccompagnementNudge
        onRequestParcours={onRequestParcours}
        highlighted={accompagnementHighlighted}
      />
    </div>
  );
}
