"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Section repliable — thème clair cohérent avec la fiche prospect. */
export function PipelineLightSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
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
    <div className={cn("rounded-xl border border-gray-200 bg-white", className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge ? (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{badge}</span>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open ? <div className="border-t border-gray-100 px-4 pb-4 pt-3">{children}</div> : null}
    </div>
  );
}
