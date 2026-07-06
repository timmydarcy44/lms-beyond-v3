"use client";

import Link from "next/link";
import { ArrowRight, Check, Circle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeProgressionGps } from "@/lib/apprenant/edge-progression-gps";
import { EdgeSkillsGapTable } from "@/components/apprenant/edge-gps/edge-skills-gap-table";
import { EdgeAccompagnementNudge } from "@/components/apprenant/edge-gps/edge-accompagnement-nudge";

type Props = {
  gps: EdgeProgressionGps;
  loading?: boolean;
  onWhatNow?: () => void;
};

const CARD = "rounded-2xl border border-white/[0.08] bg-white/[0.03]";

export function EdgeDashboardGps({ gps, loading, onWhatNow }: Props) {
  if (loading) {
    return (
      <div className="mb-8 space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-white/[0.04]" />
        <div className="h-40 rounded-2xl bg-white/[0.04]" />
      </div>
    );
  }

  return (
    <div className="mb-10 space-y-5">
      {/* 1. Mon objectif */}
      <section className={cn(CARD, "p-5 sm:p-6")}>
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
          <Link
            href={gps.parcoursHref}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#0a0a0a] transition hover:bg-white/90"
          >
            Continuer mon parcours
            <ArrowRight className="h-4 w-4" />
          </Link>
          {onWhatNow ? (
            <button
              type="button"
              onClick={onWhatNow}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/[0.05]"
            >
              <Compass className="h-4 w-4" />
              Que dois-je faire maintenant ?
            </button>
          ) : null}
        </div>
      </section>

      {/* 2. Prochaine étape — zone la plus visible */}
      <section className="rounded-2xl border border-[#3D7BFF]/30 bg-gradient-to-br from-[#3D7BFF]/15 via-[#3D7BFF]/5 to-transparent p-5 sm:p-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
          Aujourd&apos;hui, votre prochaine étape
        </p>
        <h3 className="mt-3 text-lg font-semibold text-white sm:text-xl">
          Travaillez la compétence : {gps.nextStep.skill}
        </h3>
        {gps.nextStep.subPriority ? (
          <p className="mt-1 text-sm text-white/55">Sous-priorité : {gps.nextStep.subPriority}</p>
        ) : null}
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          <span className="font-medium text-white/90">Pourquoi ?</span> {gps.nextStep.why}
        </p>
        <Link
          href={gps.nextStep.actionHref}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#3D7BFF] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2F6AE8]"
        >
          Commencer cette étape
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* 3. Timeline */}
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

      {/* 4. Compétences */}
      <EdgeSkillsGapTable skills={gps.skills} objectiveTitle={gps.objectiveTitle} />

      {/* 7. Accompagnement */}
      <EdgeAccompagnementNudge />
    </div>
  );
}
