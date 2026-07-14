"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "alert" | "warning" | "success";

const toneStyles: Record<
  SectionTone,
  { wrap: string; title: string; badge: string }
> = {
  default: {
    wrap: "border-gray-200 bg-white",
    title: "text-gray-900",
    badge: "bg-gray-100 text-gray-600",
  },
  alert: {
    wrap: "border-rose-200 bg-rose-50/90",
    title: "text-rose-950",
    badge: "bg-rose-100 text-rose-700",
  },
  warning: {
    wrap: "border-amber-300 bg-amber-50/90",
    title: "text-amber-950",
    badge: "bg-amber-100 text-amber-800",
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50/90",
    title: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800",
  },
};

/** Section repliable — thème clair avec variantes d'alerte. */
export function PipelineLightSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  tone = "default",
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  defaultOpen?: boolean;
  tone?: SectionTone;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const s = toneStyles[tone];

  return (
    <div className={cn("rounded-xl border", s.wrap, className)}>
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", s.title)}>{title}</p>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {badge ? (
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", s.badge)}>
              {badge}
            </span>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open ? <div className="border-t border-black/5 px-4 pb-4 pt-3">{children}</div> : null}
    </div>
  );
}
