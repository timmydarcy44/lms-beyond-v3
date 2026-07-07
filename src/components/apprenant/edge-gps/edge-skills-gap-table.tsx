"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeSkillGapRow } from "@/lib/apprenant/edge-progression-gps";
import { statusLabelForGap } from "@/lib/apprenant/edge-progression-gps";
import {
  GAP_BADGE,
  LEVEL_BADGE,
  levelBarColor,
  ONBOARDING_ROW_RING,
  pillClass,
  STATUS_BADGE,
} from "@/lib/apprenant/edge-skill-gap-visuals";

export type OnboardingRowHighlight = "aligned" | "unevaluated" | "priority" | null;

type Props = {
  skills: EdgeSkillGapRow[];
  objectiveTitle: string;
  onboardingHighlights?: Record<string, OnboardingRowHighlight>;
  prioritySelectMode?: boolean;
  selectedPriority?: string | null;
  onSelectPriority?: (skillName: string) => void;
  onRowClick?: (skill: EdgeSkillGapRow) => void;
};

function GapPill({ label, severity }: { label: string; severity: EdgeSkillGapRow["gapSeverity"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        GAP_BADGE[severity],
      )}
    >
      {label}
    </span>
  );
}

function LevelPill({ level }: { level: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        pillClass("bg-white/[0.06] text-white/50 ring-1 ring-white/10", LEVEL_BADGE, level),
      )}
    >
      {level}
    </span>
  );
}

function StatusPill({ status }: { status: EdgeSkillGapRow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        STATUS_BADGE[status],
      )}
    >
      {statusLabelForGap(status)}
    </span>
  );
}

function LevelBar({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <div className="mt-1 h-1 w-full max-w-[72px] overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-1/4 rounded-full bg-white/20" />
      </div>
    );
  }
  return (
    <div className="mt-1 h-1 w-full max-w-[72px] overflow-hidden rounded-full bg-white/[0.08]">
      <div
        className={cn("h-full rounded-full transition-all", levelBarColor(score))}
        style={{ width: `${Math.max(8, score)}%` }}
      />
    </div>
  );
}

export function EdgeSkillsGapTable({
  skills,
  objectiveTitle,
  onboardingHighlights,
  prioritySelectMode,
  selectedPriority,
  onSelectPriority,
  onRowClick,
}: Props) {
  const [selected, setSelected] = useState<EdgeSkillGapRow | null>(null);

  if (!skills.length) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <p className="text-sm text-white/50">
          Ajoutez des compétences à votre profil EDGE pour visualiser les écarts avec votre objectif.
        </p>
        <Link
          href="/dashboard/apprenant/profil-comportemental/hard-skills"
          className="mt-4 inline-block text-sm font-medium text-[#8BB4FF] hover:underline"
        >
          Gérer mes compétences
        </Link>
      </section>
    );
  }

  const handleRowActivate = (skill: EdgeSkillGapRow) => {
    if (prioritySelectMode && onSelectPriority) {
      onSelectPriority(skill.name);
      return;
    }
    if (onRowClick) {
      onRowClick(skill);
      return;
    }
    setSelected(skill);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Compétences</p>
          <p className="mt-0.5 text-xs text-white/45">Écarts avec « {objectiveTitle} »</p>
        </div>

        <div className="hidden border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:grid sm:grid-cols-[2fr_1.1fr_1fr_1fr_auto] sm:gap-3 sm:px-5">
          <span>Compétence</span>
          <span>Niveau estimé</span>
          <span>Écart</span>
          <span>Statut EDGE</span>
          <span className="text-right">Action</span>
        </div>

        <ul className="divide-y divide-white/[0.05]">
          {skills.map((skill) => {
            const highlight = onboardingHighlights?.[skill.name] ?? null;
            const isPrioritySelected = prioritySelectMode && selectedPriority === skill.name;

            return (
              <li key={skill.name}>
                <button
                  type="button"
                  onClick={() => handleRowActivate(skill)}
                  className={cn(
                    "group flex w-full items-center gap-3 px-4 py-3 text-left transition sm:grid sm:grid-cols-[2fr_1.1fr_1fr_1fr_auto] sm:gap-3 sm:px-5 sm:py-3",
                    highlight && ONBOARDING_ROW_RING[highlight],
                    !highlight && "hover:bg-white/[0.04]",
                    isPrioritySelected && "bg-[#3D7BFF]/10 ring-1 ring-[#3D7BFF]/40",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {prioritySelectMode ? (
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          isPrioritySelected
                            ? "border-[#3D7BFF] bg-[#3D7BFF] text-white"
                            : "border-white/25 bg-transparent",
                        )}
                      >
                        {isPrioritySelected ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                      </span>
                    ) : null}
                    <span className="truncate text-sm font-medium text-white group-hover:text-[#8BB4FF]">
                      {skill.name}
                    </span>
                  </span>

                  <span className="hidden sm:block">
                    <LevelPill level={skill.estimatedLevel} />
                    <LevelBar score={skill.levelScore} />
                  </span>

                  <span className="hidden sm:block">
                    <GapPill label={skill.gapLabel} severity={skill.gapSeverity} />
                  </span>

                  <span className="hidden sm:block">
                    <StatusPill status={skill.status} />
                  </span>

                  <span className="ml-auto flex items-center gap-2 sm:ml-0 sm:justify-end">
                    <span className="flex flex-wrap gap-1 sm:hidden">
                      <StatusPill status={skill.status} />
                    </span>
                    {!prioritySelectMode ? <ChevronRight className="h-4 w-4 text-white/35" /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">
          <LegendDot className="bg-emerald-500/80" label="Aligné / validé" />
          <LegendDot className="bg-sky-500/80" label="Écart faible" />
          <LegendDot className="bg-amber-500/80" label="Écart moyen" />
          <LegendDot className="bg-rose-500/80" label="Écart fort" />
          <LegendDot className="bg-[#3D7BFF]/80" label="Prioritaire" />
          <LegendDot className="bg-white/30" label="Non évalué" />
        </div>
      </section>

      {selected && !prioritySelectMode ? (
        <SkillDetailPanel skill={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] text-white/40">
      <span className={cn("h-1.5 w-1.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function SkillDetailPanel({ skill, onClose }: { skill: EdgeSkillGapRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[160] flex justify-end">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Fermer" />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#12141C] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Compétence</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{skill.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <LevelPill level={skill.estimatedLevel} />
              <GapPill label={skill.gapLabel} severity={skill.gapSeverity} />
              <StatusPill status={skill.status} />
            </div>
            <LevelBar score={skill.levelScore} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Pourquoi c&apos;est important
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{skill.whyImportant}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Résultat actuel</p>
            <p className="mt-2 text-sm text-white/80">{skill.currentResult}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Contenus associés</p>
            <ul className="mt-3 space-y-2">
              {skill.resources.map((r) => (
                <li key={`${r.type}-${r.title}`}>
                  <Link
                    href={r.href}
                    className="block rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 transition hover:border-white/15"
                  >
                    <p className="text-sm font-medium text-white">{r.title}</p>
                    {r.description ? (
                      <p className="mt-0.5 text-xs text-white/45">{r.description}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={skill.actionHref}
            className="flex w-full items-center justify-center rounded-lg bg-white py-3 text-sm font-medium text-[#0a0a0a]"
          >
            {skill.actionLabel}
          </Link>
        </div>
      </aside>
    </div>
  );
}
