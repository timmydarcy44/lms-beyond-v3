"use client";

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
      <h2 className="text-[28px] font-bold tracking-[-0.035em] text-white sm:text-[32px]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-[15px] leading-relaxed text-white/45">{subtitle}</p> : null}
    </div>
  );
}

/** Palettes immersives type Apple Music — une identité visuelle par carte. */
export const APPLE_CARD = {
  ocean: {
    shell: "bg-gradient-to-b from-[#1c4ed8] via-[#1e3a8a] to-[#0f172a] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.55)]",
    glow: "bg-sky-400/30",
    footer: "bg-[#0b1224]/55",
  },
  ember: {
    shell: "bg-gradient-to-b from-[#ea580c] via-[#c2410c] to-[#7c2d12] shadow-[0_20px_50px_-20px_rgba(234,88,12,0.5)]",
    glow: "bg-amber-300/25",
    footer: "bg-[#3b1508]/50",
  },
  forest: {
    shell: "bg-gradient-to-b from-[#059669] via-[#047857] to-[#064e3b] shadow-[0_20px_50px_-20px_rgba(16,185,129,0.45)]",
    glow: "bg-emerald-300/25",
    footer: "bg-[#022c22]/50",
  },
  violet: {
    shell: "bg-gradient-to-b from-[#7c3aed] via-[#5b21b6] to-[#2e1065] shadow-[0_20px_50px_-20px_rgba(124,58,237,0.5)]",
    glow: "bg-fuchsia-300/20",
    footer: "bg-[#1e0a3c]/55",
  },
  rose: {
    shell: "bg-gradient-to-b from-[#db2777] via-[#9d174d] to-[#4a044e] shadow-[0_20px_50px_-20px_rgba(219,39,119,0.5)]",
    glow: "bg-pink-300/25",
    footer: "bg-[#3b0764]/50",
  },
  gold: {
    shell: "bg-gradient-to-b from-[#d97706] via-[#b45309] to-[#78350f] shadow-[0_20px_50px_-20px_rgba(217,119,6,0.45)]",
    glow: "bg-yellow-200/20",
    footer: "bg-[#451a03]/50",
  },
  slate: {
    shell: "bg-gradient-to-b from-[#475569] via-[#334155] to-[#0f172a] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.65)]",
    glow: "bg-slate-300/15",
    footer: "bg-black/35",
  },
  ice: {
    shell: "bg-gradient-to-b from-[#0ea5e9] via-[#0369a1] to-[#0c4a6e] shadow-[0_20px_50px_-20px_rgba(14,165,233,0.45)]",
    glow: "bg-cyan-200/25",
    footer: "bg-[#082f49]/55",
  },
} as const;

export type AppleCardTone = keyof typeof APPLE_CARD;

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: AppleCardTone;
  /** Désactive padding interne (pour layouts split type Music Radio). */
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
    "relative overflow-hidden rounded-[28px] text-white transition duration-200",
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
          "pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full blur-3xl",
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
    <div className={cn("mt-auto px-6 py-4 sm:px-7 sm:py-5", APPLE_CARD[tone].footer, className)}>
      {children}
    </div>
  );
}

export function HubProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-white/20", className)}>
      <div
        className="h-full rounded-full bg-white transition-[width] duration-700 ease-out motion-reduce:transition-none"
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
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/35 bg-white/10 px-5 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
