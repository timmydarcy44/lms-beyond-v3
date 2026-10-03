"use client";

import Link from "next/link";

import {
  SOFT_SKILL_SCORE_PER_COMPETENCE,
  softSkillMasteryPercent,
  sortSoftSkillsDescending,
} from "@/lib/soft-skills/resolve-soft-skills-result";
import { cn } from "@/lib/utils";

type Props = {
  items: Array<{ skill: string; score: number }>;
  variant?: "revolut" | "cockpit" | "light";
  synthesisHref?: string | null;
  synthesisLabel?: string;
  className?: string;
};

export function SoftSkillsRankingList({
  items,
  variant = "revolut",
  synthesisHref,
  synthesisLabel = "Détail du test et synthèse IA",
  className,
}: Props) {
  const sorted = sortSoftSkillsDescending(items);
  if (!sorted.length) return null;

  const isRevolut = variant === "revolut";
  const isCockpit = variant === "cockpit";

  return (
    <div className={cn("space-y-3", className)}>
      <p
        className={cn(
          "text-[12px]",
          isRevolut || isCockpit ? "text-white/45" : "text-black/45",
        )}
      >
        {sorted.length} compétence{sorted.length > 1 ? "s évaluées" : " évaluée"} — du plus
        fort au plus faible
      </p>

      <ul className="space-y-2">
        {sorted.map((item, index) => {
          const pct = softSkillMasteryPercent(item.score);
          const barWidth = `${Math.max(6, pct)}%`;
          return (
            <li
              key={item.skill}
              className={cn(
                "flex items-center gap-3 rounded-xl px-1 py-1.5 sm:gap-4",
                isRevolut && "sm:px-0",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                  index === 0 && (isRevolut || isCockpit)
                    ? "bg-[#3D7BFF] text-white"
                    : isRevolut || isCockpit
                      ? "bg-white/10 text-white/55"
                      : "bg-black/[0.06] text-black/50",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "truncate text-[13px] font-medium sm:text-[14px]",
                    isRevolut || isCockpit ? "text-white/90" : "text-black/85",
                  )}
                >
                  {item.skill}
                </p>
                <div
                  className={cn(
                    "mt-1.5 h-1.5 w-full max-w-md overflow-hidden rounded-full",
                    isRevolut || isCockpit ? "bg-white/10" : "bg-black/10",
                  )}
                >
                  <div
                    className="h-full rounded-full bg-[#3D7BFF]"
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-[12px] font-semibold tabular-nums",
                    isRevolut || isCockpit ? "text-white" : "text-[#0a0a0a]",
                  )}
                >
                  {pct}&nbsp;%
                </p>
                <p
                  className={cn(
                    "text-[10px] tabular-nums",
                    isRevolut || isCockpit ? "text-white/40" : "text-black/45",
                  )}
                >
                  {Math.round(item.score)}/{SOFT_SKILL_SCORE_PER_COMPETENCE}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {synthesisHref ? (
        <Link
          href={synthesisHref}
          className={cn(
            "inline-flex text-[12px] font-medium",
            isRevolut || isCockpit
              ? "text-[#9EC0FF]/80 hover:text-[#9EC0FF]"
              : "text-[#3D7BFF] hover:underline",
          )}
        >
          {synthesisLabel}
        </Link>
      ) : null}
    </div>
  );
}
