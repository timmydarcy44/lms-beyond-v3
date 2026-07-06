"use client";

import { Check, ChevronRight } from "lucide-react";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusCompactLabel } from "@/lib/hard-skills/skill-validation-analysis";
import { cn } from "@/lib/utils";

type Props = {
  skills: PublicSkillCardData[];
  onSelect: (skill: PublicSkillCardData) => void;
};

function StatusCell({ skill }: { skill: PublicSkillCardData }) {
  const label = publicStatusCompactLabel(skill.status);
  const isVerified = skill.status === "validated" || skill.status === "expert_validated";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        isVerified && "text-emerald-700",
        skill.status === "ia_analyzed" && "text-amber-800",
        skill.status === "declared" && "text-black/45",
        skill.status === "expert_validated" && "text-violet-700",
      )}
    >
      {isVerified ? <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} /> : null}
      {label}
    </span>
  );
}

export function PublicSkillList({ skills, onSelect }: Props) {
  if (!skills.length) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <div className="hidden border-b border-black/[0.06] bg-[#fafafa] px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35 md:grid md:grid-cols-[2fr_1fr_0.75fr_1.25fr] md:gap-4">
        <span>Compétence</span>
        <span>Catégorie</span>
        <span>Niveau</span>
        <span>Statut EDGE</span>
      </div>

      <ul className="divide-y divide-black/[0.05]">
        {skills.map((skill) => (
          <li key={skill.name}>
            <button
              type="button"
              onClick={() => onSelect(skill)}
              className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[#fafafa] md:grid md:grid-cols-[2fr_1fr_0.75fr_1.25fr] md:gap-4"
            >
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#0a0a0a] group-hover:text-[#FF3B30] md:flex-none">
                {skill.name}
              </span>
              <span className="hidden truncate text-xs text-black/45 md:block">{skill.category}</span>
              <span className="hidden text-xs font-medium text-[#0a0a0a] md:block">{skill.estimatedLevel}</span>
              <span className="hidden md:block">
                <StatusCell skill={skill} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-end gap-0.5 md:hidden">
                <StatusCell skill={skill} />
                <span className="text-[11px] text-black/40">
                  {skill.category} · {skill.estimatedLevel}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-black/20 md:hidden" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
