"use client";

/**
 * Surfaces hub — hiérarchie visuelle :
 * L1 = héro abstrait (composant dédié)
 * L2 = action (slate / accent discret)
 * L3 = synthèse
 * L4 = navigation sobre
 */

import Link from "next/link";
import { cn } from "@/lib/utils";

export function HubSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 px-0.5">
      <h2 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-[15px] leading-relaxed text-white/45">{subtitle}</p> : null}
    </div>
  );
}

export const APPLE_CARD = {
  slate: {
    shell:
      "border border-white/[0.08] bg-[#14161C] shadow-[0_16px_40px_-22px_rgba(0,0,0,0.7)]",
    glow: "bg-sky-400/10",
    footer: "bg-black/30",
  },
  action: {
    shell:
      "border border-[#3D7BFF]/25 bg-gradient-to-b from-[#1a2744] to-[#12151c] shadow-[0_18px_44px_-22px_rgba(61,123,255,0.35)]",
    glow: "bg-[#3D7BFF]/20",
    footer: "bg-black/35",
  },
  success: {
    shell:
      "border border-emerald-500/20 bg-gradient-to-b from-[#123028] to-[#12151c] shadow-[0_16px_40px_-22px_rgba(16,185,129,0.25)]",
    glow: "bg-emerald-400/15",
    footer: "bg-black/30",
  },
  gold: {
    shell:
      "border border-amber-500/25 bg-gradient-to-b from-[#2a2114] to-[#14161C] shadow-[0_16px_40px_-22px_rgba(217,119,6,0.3)]",
    glow: "bg-amber-300/15",
    footer: "bg-black/30",
  },
  quiet: {
    shell: "border border-white/[0.06] bg-[#12141A]",
    glow: "bg-transparent",
    footer: "bg-black/25",
  },
  /** aliases for existing call sites */
  ocean: {
    shell:
      "border border-[#3D7BFF]/25 bg-gradient-to-b from-[#1a2744] to-[#12151c] shadow-[0_18px_44px_-22px_rgba(61,123,255,0.35)]",
    glow: "bg-[#3D7BFF]/20",
    footer: "bg-black/35",
  },
  ember: {
    shell:
      "border border-orange-400/20 bg-gradient-to-b from-[#2a1c14] to-[#14161C] shadow-[0_16px_40px_-22px_rgba(234,88,12,0.28)]",
    glow: "bg-orange-400/12",
    footer: "bg-black/30",
  },
  forest: {
    shell:
      "border border-emerald-500/20 bg-gradient-to-b from-[#123028] to-[#12151c] shadow-[0_16px_40px_-22px_rgba(16,185,129,0.25)]",
    glow: "bg-emerald-400/15",
    footer: "bg-black/30",
  },
  violet: {
    shell:
      "border border-white/[0.08] bg-[#14161C] shadow-[0_16px_40px_-22px_rgba(0,0,0,0.7)]",
    glow: "bg-violet-400/10",
    footer: "bg-black/30",
  },
  rose: {
    shell:
      "border border-fuchsia-500/20 bg-gradient-to-b from-[#2a1430] to-[#14161C] shadow-[0_16px_40px_-22px_rgba(219,39,119,0.28)]",
    glow: "bg-fuchsia-400/12",
    footer: "bg-black/30",
  },
  ice: {
    shell: "border border-white/[0.06] bg-[#12141A]",
    glow: "bg-sky-300/8",
    footer: "bg-black/25",
  },
} as const;

export type AppleCardTone = keyof typeof APPLE_CARD;

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: AppleCardTone;
  flush?: boolean;
};

export function HubSurface({
  children,
  className,
  href,
  onClick,
  tone = "slate",
  flush = false,
}: SurfaceProps) {
  const palette = APPLE_CARD[tone];
  const base = cn(
    "relative overflow-hidden rounded-[24px] text-white transition duration-200",
    "motion-safe:active:scale-[0.985]",
    palette.shell,
    !flush && "p-6 sm:p-7",
    (href || onClick) &&
      "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
    className,
  );

  const inner = (
    <>
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full blur-3xl",
          palette.glow,
        )}
        aria-hidden
      />
      <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col">{children}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, "block")}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, "w-full text-left")}>
        {inner}
      </button>
    );
  }
  return <div className={base}>{inner}</div>;
}

export function HubCardFooter({
  children,
  tone = "slate",
  className,
}: {
  children: React.ReactNode;
  tone?: AppleCardTone;
  className?: string;
}) {
  return (
    <div className={cn("mt-auto px-5 py-4 sm:px-6", APPLE_CARD[tone].footer, className)}>
      {children}
    </div>
  );
}

export function HubProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-white/12", className)}>
      <div
        className="h-full rounded-full bg-[#3D7BFF] transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function HubPillCta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#3D7BFF] px-5 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(61,123,255,0.45)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function HubGhostCta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-5 py-3.5 text-[15px] font-semibold text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}
