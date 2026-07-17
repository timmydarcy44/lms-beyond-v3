"use client";

/**
 * Surfaces hub premium — identité couleur forte (Apple / Revolut),
 * pas un dark mode uniforme.
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
    <div className="mb-5 px-0.5">
      <h2 className="text-[26px] font-bold tracking-[-0.035em] text-white sm:text-[30px]">{title}</h2>
      {subtitle ? <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-white/50">{subtitle}</p> : null}
    </div>
  );
}

export const APPLE_CARD = {
  ocean: {
    shell:
      "bg-gradient-to-br from-[#3B82F6] via-[#1D4ED8] to-[#0F172A] shadow-[0_22px_50px_-24px_rgba(37,99,235,0.65)]",
    glow: "bg-sky-300/30",
    footer: "bg-black/25",
  },
  violet: {
    shell:
      "bg-gradient-to-br from-[#8B5CF6] via-[#6D28D9] to-[#1E1035] shadow-[0_22px_50px_-24px_rgba(139,92,246,0.55)]",
    glow: "bg-fuchsia-300/25",
    footer: "bg-black/25",
  },
  ember: {
    shell:
      "bg-gradient-to-br from-[#FB923C] via-[#EA580C] to-[#431407] shadow-[0_22px_50px_-24px_rgba(234,88,12,0.55)]",
    glow: "bg-amber-200/25",
    footer: "bg-black/25",
  },
  forest: {
    shell:
      "bg-gradient-to-br from-[#34D399] via-[#059669] to-[#022C22] shadow-[0_22px_50px_-24px_rgba(16,185,129,0.5)]",
    glow: "bg-emerald-200/25",
    footer: "bg-black/25",
  },
  gold: {
    shell:
      "bg-gradient-to-br from-[#FBBF24] via-[#D97706] to-[#451A03] shadow-[0_22px_50px_-24px_rgba(217,119,6,0.5)]",
    glow: "bg-yellow-100/20",
    footer: "bg-black/25",
  },
  rose: {
    shell:
      "bg-gradient-to-br from-[#F472B6] via-[#DB2777] to-[#4A044E] shadow-[0_22px_50px_-24px_rgba(219,39,119,0.5)]",
    glow: "bg-pink-200/25",
    footer: "bg-black/25",
  },
  ice: {
    shell:
      "bg-gradient-to-br from-[#22D3EE] via-[#0284C7] to-[#0C4A6E] shadow-[0_22px_50px_-24px_rgba(14,165,233,0.5)]",
    glow: "bg-cyan-100/25",
    footer: "bg-black/25",
  },
  action: {
    shell:
      "bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#0F172A] shadow-[0_22px_50px_-24px_rgba(37,99,235,0.55)]",
    glow: "bg-blue-200/25",
    footer: "bg-black/25",
  },
  success: {
    shell:
      "bg-gradient-to-br from-[#4ADE80] via-[#16A34A] to-[#052E16] shadow-[0_22px_50px_-24px_rgba(22,163,74,0.45)]",
    glow: "bg-lime-200/20",
    footer: "bg-black/25",
  },
  slate: {
    shell:
      "border border-white/[0.08] bg-gradient-to-br from-[#1E293B] via-[#111827] to-[#0B0F17] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.7)]",
    glow: "bg-slate-300/10",
    footer: "bg-black/30",
  },
  quiet: {
    shell:
      "border border-white/[0.07] bg-gradient-to-br from-[#151A24] to-[#0C1018] shadow-[0_14px_32px_-20px_rgba(0,0,0,0.6)]",
    glow: "bg-transparent",
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
          "pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full blur-3xl",
          palette.glow,
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-black/20 blur-3xl"
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
    <div className={cn("mt-auto px-6 py-4 sm:px-7", APPLE_CARD[tone].footer, className)}>
      {children}
    </div>
  );
}

export function HubProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-white/20", className)}>
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
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-[15px] font-semibold text-black shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)]",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3.5 text-[15px] font-semibold text-white backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </span>
  );
}
