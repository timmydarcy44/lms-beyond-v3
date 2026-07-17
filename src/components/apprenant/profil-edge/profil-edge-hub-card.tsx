"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProfilEdgeHubKicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55", className)}>
      {children}
    </p>
  );
}

export function ProfilEdgeHubSection({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      <div>
        <h2 className="text-[24px] font-bold tracking-[-0.03em] text-white sm:text-[28px]">{title}</h2>
        {subtitle ? <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-white/45">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

type HubCardProps = {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "accent" | "success" | "muted";
};

const VARIANTS = {
  default: "border border-white/[0.08] bg-[#14161C]",
  accent:
    "border border-[#3D7BFF]/25 bg-gradient-to-b from-[#1a2744] to-[#12151c] shadow-[0_16px_40px_-22px_rgba(61,123,255,0.3)]",
  success: "border border-emerald-500/20 bg-gradient-to-b from-[#123028] to-[#12151c]",
  muted: "border border-white/[0.06] bg-[#12141A]",
};

export function ProfilEdgeHubCard({ children, className, href, onClick, variant = "default" }: HubCardProps) {
  const base = cn(
    "group relative flex flex-col overflow-hidden rounded-[24px] p-6 text-white transition duration-200 motion-safe:active:scale-[0.985] sm:p-7",
    VARIANTS[variant],
    (href || onClick) &&
      "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={base}>
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
