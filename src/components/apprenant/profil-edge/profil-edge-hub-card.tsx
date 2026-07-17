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
        <h2 className="text-[26px] font-bold tracking-[-0.035em] text-white sm:text-[30px]">{title}</h2>
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
  default:
    "bg-gradient-to-br from-[#475569] via-[#1E293B] to-[#0F172A] shadow-[0_18px_40px_-22px_rgba(0,0,0,0.55)]",
  accent:
    "bg-gradient-to-br from-[#3B82F6] via-[#1D4ED8] to-[#0F172A] shadow-[0_22px_50px_-24px_rgba(37,99,235,0.55)]",
  success:
    "bg-gradient-to-br from-[#34D399] via-[#059669] to-[#022C22] shadow-[0_22px_50px_-24px_rgba(16,185,129,0.45)]",
  muted:
    "border border-white/[0.07] bg-gradient-to-br from-[#151A24] to-[#0C1018]",
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
