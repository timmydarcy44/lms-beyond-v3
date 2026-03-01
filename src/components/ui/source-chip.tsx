"use client";

import { cn } from "@/lib/utils";

type SourceChipProps = {
  label: string;
  className?: string;
};

export function SourceChip({ label, className }: SourceChipProps) {
  if (!label) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-white/75",
        className,
      )}
    >
      Source · {label}
    </span>
  );
}

