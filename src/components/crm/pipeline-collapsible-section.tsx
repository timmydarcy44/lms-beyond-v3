"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function PipelineCollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.18),transparent_55%)]" />
      <button
        type="button"
        className="relative flex w-full items-start justify-between gap-3 p-4 text-left sm:p-5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">{title}</p>
          {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge ? <span className="text-xs text-slate-400">{badge}</span> : null}
          <ChevronDown
            className={cn("h-4 w-4 text-slate-300 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open ? <div className="relative px-4 pb-4 sm:px-5 sm:pb-5">{children}</div> : null}
    </div>
  );
}
