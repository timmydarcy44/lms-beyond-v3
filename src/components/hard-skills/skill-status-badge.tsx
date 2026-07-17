"use client";

import { cn } from "@/lib/utils";
import { SKILL_UX_STATUS, type SkillUxStatus } from "@/lib/hard-skills/hard-skills-portfolio";

export function SkillStatusBadge({
  status,
  className,
}: {
  status: SkillUxStatus;
  className?: string;
}) {
  const config = SKILL_UX_STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
