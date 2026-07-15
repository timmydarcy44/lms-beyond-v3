"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SectionTone = "default" | "alert" | "warning" | "success" | "dark";

const toneStyles: Record<
  SectionTone,
  { wrap: string; title: string; badge: string; subtitle: string; border: string }
> = {
  default: {
    wrap: "border-gray-200 bg-white",
    title: "text-gray-900",
    badge: "bg-gray-100 text-gray-600",
    subtitle: "text-gray-600",
    border: "border-black/5",
  },
  dark: {
    wrap: "border-white/10 bg-white/5 backdrop-blur-sm",
    title: "text-white",
    badge: "bg-white/10 text-slate-300",
    subtitle: "text-slate-400",
    border: "border-white/10",
  },
  alert: {
    wrap: "border-rose-200 bg-rose-50/90",
    title: "text-rose-950",
    badge: "bg-rose-100 text-rose-700",
    subtitle: "text-gray-600",
    border: "border-black/5",
  },
  warning: {
    wrap: "border-amber-300 bg-amber-50/90",
    title: "text-amber-950",
    badge: "bg-amber-100 text-amber-800",
    subtitle: "text-gray-600",
    border: "border-black/5",
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50/90",
    title: "text-emerald-950",
    badge: "bg-emerald-100 text-emerald-800",
    subtitle: "text-gray-600",
    border: "border-black/5",
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
          {subtitle ? <p className={cn("mt-0.5 text-xs", s.subtitle)}>{subtitle}</p> : null}
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
      {open ? <div className={cn("border-t px-4 pb-4 pt-3", s.border)}>{children}</div> : null}
    </div>
  );
}
