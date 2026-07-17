"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProfilEdgeHubKicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[12px] font-semibold uppercase tracking-[0.14em] text-white/70", className)}>
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
        <h2 className="text-[28px] font-bold tracking-[-0.035em] text-white sm:text-[32px]">{title}</h2>
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

/** Cartes immersives type Apple Music — pas des tuiles grises uniformes. */
const VARIANTS = {
  default:
    "bg-gradient-to-b from-[#475569] via-[#334155] to-[#0f172a] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.65)]",
  accent:
    "bg-gradient-to-b from-[#1c4ed8] via-[#1e3a8a] to-[#0f172a] shadow-[0_20px_50px_-20px_rgba(37,99,235,0.55)]",
  success:
    "bg-gradient-to-b from-[#059669] via-[#047857] to-[#064e3b] shadow-[0_20px_50px_-20px_rgba(16,185,129,0.45)]",
  muted:
    "bg-gradient-to-b from-[#64748b] via-[#334155] to-[#0f172a] shadow-[0_16px_40px_-18px_rgba(0,0,0,0.55)]",
};

export function ProfilEdgeHubCard({ children, className, href, onClick, variant = "default" }: HubCardProps) {
  const base = cn(
    "group relative flex flex-col overflow-hidden rounded-[28px] p-6 text-white transition duration-200 motion-safe:active:scale-[0.985] sm:p-7",
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
