"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function ProfilEdgeHubKicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11px] font-medium uppercase tracking-[0.18em] text-white/40", className)}>
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
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/45">{subtitle}</p> : null}
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
  default: "border-white/[0.08] bg-[#17171F] hover:border-white/[0.14]",
  accent: "border-[#3D7BFF]/25 bg-gradient-to-br from-[#3D7BFF]/[0.12] to-[#17171F] hover:border-[#3D7BFF]/40",
  success: "border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-[#17171F] hover:border-emerald-500/35",
  muted: "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]",
};

export function ProfilEdgeHubCard({ children, className, href, onClick, variant = "default" }: HubCardProps) {
  const base = cn(
    "group relative flex flex-col rounded-[1.35rem] border p-6 transition duration-200 sm:p-7",
    VARIANTS[variant],
    (href || onClick) && "cursor-pointer",
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
      <button type="button" onClick={onClick} className={cn(base, "text-left w-full")}>
        {children}
      </button>
    );
  }

  return <div className={base}>{children}</div>;
}
