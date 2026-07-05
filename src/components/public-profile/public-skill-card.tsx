"use client";

import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusConfig } from "@/lib/hard-skills/skill-validation-analysis";
import { EDGE_CONFIDENCE_LABEL, EDGE_STATUS_LABEL } from "@/lib/edge-brand-copy";
import { resolveToolLogo } from "@/lib/profile/competency-referential";

type Props = {
  skill: PublicSkillCardData;
  onViewAnalysis: () => void;
};

export function PublicSkillCard({ skill, onViewAnalysis }: Props) {
  const statusCfg = publicStatusConfig(skill.status);
  const logo = resolveToolLogo(skill.name);

  return (
    <article className="flex flex-col rounded-2xl border border-black/[0.08] bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] transition hover:border-[#FF3B30]/25 hover:shadow-[0_8px_32px_rgba(255,59,48,0.08)]">
      <div className="flex items-start gap-3">
        {logo ? (
          <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        ) : (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f3] text-xs font-bold text-black/35">
            {skill.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[#0a0a0a]">{skill.name}</h3>
          <p className="mt-0.5 text-xs text-black/45">{skill.category}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-black/45">Niveau estimé</span>
          <span className="font-semibold text-[#0a0a0a]">{skill.estimatedLevel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-black/45">{EDGE_STATUS_LABEL}</span>
          <span className={`rounded-full border px-2.5 py-1 font-medium ${statusCfg.className}`}>
            {statusCfg.emoji} {statusCfg.label}
          </span>
        </div>

        {skill.confidenceScore != null ? (
          <div className="rounded-xl border border-black/[0.06] bg-[#fafafa] px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-black/40">{EDGE_CONFIDENCE_LABEL}</p>
            <p className="mt-1 text-lg font-bold text-[#0a0a0a]">{skill.confidenceScore} %</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onViewAnalysis}
        className="mt-4 w-full rounded-full border border-black/10 bg-[#0a0a0a] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black/85"
      >
        {skill.hasAnalysis ? "Voir l'analyse" : "Voir le détail"}
      </button>
    </article>
  );
}
