"use client";

import { Check, ChevronRight } from "lucide-react";
import type { PublicSkillCardData } from "@/lib/hard-skills/skill-validation-analysis";
import { publicStatusCompactLabel } from "@/lib/hard-skills/skill-validation-analysis";
import { cn } from "@/lib/utils";

type Props = {
  skills: PublicSkillCardData[];
  onSelect: (skill: PublicSkillCardData) => void;
  theme?: "light" | "dark";
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

export function PublicSkillList({ skills, onSelect, theme = "light" }: Props) {
  if (!skills.length) return null;

  const dark = theme === "dark";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        dark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06] bg-white",
      )}
    >
      <div
        className={cn(
          "hidden border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] md:grid md:grid-cols-[2fr_1fr_0.75fr_1.25fr] md:gap-4",
          dark
            ? "border-white/[0.06] bg-white/[0.04] text-white/35"
            : "border-black/[0.06] bg-[#fafafa] text-black/35",
        )}
      >
        <span>Compétence</span>
        <span>Catégorie</span>
        <span>Niveau</span>
        <span>Statut Byound</span>
      </div>

      <ul className={cn("divide-y", dark ? "divide-white/[0.06]" : "divide-black/[0.05]")}>
        {skills.map((skill) => (
          <li key={skill.name}>
            <button
              type="button"
              onClick={() => onSelect(skill)}
              className={cn(
                "group flex w-full items-center gap-3 px-4 py-2.5 text-left transition md:grid md:grid-cols-[2fr_1fr_0.75fr_1.25fr] md:gap-4",
                dark ? "hover:bg-white/[0.05]" : "hover:bg-[#fafafa]",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-sm font-medium md:flex-none",
                  dark
                    ? "text-white/90 group-hover:text-[#9EC0FF]"
                    : "text-[#0a0a0a] group-hover:text-[#FF3B30]",
                )}
              >
                {skill.name}
              </span>
              <span className={cn("hidden truncate text-xs md:block", dark ? "text-white/40" : "text-black/45")}>
                {skill.category}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium md:block",
                  dark ? "text-white/75" : "text-[#0a0a0a]",
                )}
              >
                {skill.estimatedLevel}
              </span>
              <span className="hidden md:block">
                <StatusCell skill={skill} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-end gap-0.5 md:hidden">
                <StatusCell skill={skill} />
                <span className={cn("text-[11px]", dark ? "text-white/35" : "text-black/40")}>
                  {skill.category} · {skill.estimatedLevel}
                </span>
              </span>
              <ChevronRight
                className={cn("h-4 w-4 shrink-0 md:hidden", dark ? "text-white/25" : "text-black/20")}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
