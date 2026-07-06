"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EdgeSkillGapRow } from "@/lib/apprenant/edge-progression-gps";
import { statusLabelForGap } from "@/lib/apprenant/edge-progression-gps";

type Props = {
  skills: EdgeSkillGapRow[];
  objectiveTitle: string;
};

const STATUS_STYLE: Record<string, string> = {
  validated: "text-emerald-400",
  in_progress: "text-amber-300",
  priority: "text-[#8BB4FF]",
  to_develop: "text-white/45",
  badge_available: "text-violet-300",
};

export function EdgeSkillsGapTable({ skills, objectiveTitle }: Props) {
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

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-4 py-3 sm:px-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">Compétences</p>
          <p className="mt-0.5 text-xs text-white/45">Écarts avec « {objectiveTitle} »</p>
        </div>

        <div className="hidden border-b border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/35 sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:gap-3 sm:px-5">
          <span>Compétence</span>
          <span>Niveau estimé</span>
          <span>Écart</span>
          <span>Statut EDGE</span>
          <span className="text-right">Action</span>
        </div>

        <ul className="divide-y divide-white/[0.05]">
          {skills.map((skill) => (
            <li key={skill.name}>
              <button
                type="button"
                onClick={() => setSelected(skill)}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.04] sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:gap-3 sm:px-5 sm:py-2.5"
              >
                <span className="truncate text-sm font-medium text-white group-hover:text-[#8BB4FF]">
                  {skill.name}
                </span>
                <span className="hidden text-xs text-white/60 sm:block">{skill.estimatedLevel}</span>
                <span className="hidden text-xs text-white/45 sm:block">{skill.gapLabel}</span>
                <span className={cn("hidden text-xs font-medium sm:block", STATUS_STYLE[skill.status])}>
                  {statusLabelForGap(skill.status)}
                </span>
                <span className="ml-auto flex items-center gap-1 text-xs text-white/40 sm:ml-0">
                  <span className="sm:hidden">{statusLabelForGap(skill.status)}</span>
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <SkillDetailPanel skill={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
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
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/50 hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Pourquoi c&apos;est important</p>
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
