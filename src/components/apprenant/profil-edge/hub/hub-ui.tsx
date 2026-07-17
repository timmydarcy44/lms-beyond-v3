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
    <div className="mb-4">
      <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-white sm:text-[24px]">{title}</h2>
      {subtitle ? <p className="mt-1.5 text-[14px] leading-relaxed text-white/50">{subtitle}</p> : null}
    </div>
  );
}

type SurfaceProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: "hero" | "action" | "secondary" | "quiet";
};

const TONE = {
  hero: "border-white/[0.08] bg-gradient-to-br from-[#1a2240] via-[#141824] to-[#0e1018]",
  action: "border-white/[0.08] bg-[#171922]",
  secondary: "border-white/[0.06] bg-[#15161d]",
  quiet: "border-white/[0.05] bg-white/[0.025]",
};

export function HubSurface({ children, className, href, onClick, tone = "secondary" }: SurfaceProps) {
  const base = cn(
    "rounded-[1.5rem] border p-5 transition duration-200 sm:p-6",
    "motion-safe:active:scale-[0.99]",
    TONE[tone],
    (href || onClick) && "cursor-pointer hover:border-white/[0.12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D7BFF]/60",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(base, "block")}>
        {children}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(base, "w-full text-left")}>
        {children}
      </button>
    );
  }
  return <div className={base}>{children}</div>;
}

export function HubProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div
        className="h-full rounded-full bg-white/80 transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
