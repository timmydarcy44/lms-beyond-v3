import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";

type JessicaSuperPageProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  narrow?: boolean;
};

export function JessicaSuperPage({
  title,
  subtitle,
  backHref,
  backLabel = "Retour",
  actions,
  children,
  className,
  narrow,
}: JessicaSuperPageProps) {
  return (
    <div className={cn(jessicaSuper.page, className)} style={{ fontFamily: jessicaSuper.font }}>
      <div className={cn(jessicaSuper.container, narrow && "max-w-4xl")}>
        {backHref ? (
          <Link href={backHref} className={cn(jessicaSuper.ghost, "mb-6 -ml-3 inline-flex")}>
            ← {backLabel}
          </Link>
        ) : null}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={jessicaSuper.title}>{title}</h1>
            {subtitle ? <p className={jessicaSuper.subtitle}>{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

type JessicaSuperStatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
};

export function JessicaSuperStatCard({ label, value, hint, icon, accent }: JessicaSuperStatCardProps) {
  return (
    <div className={cn(jessicaSuper.card, "p-6")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={jessicaSuper.statLabel}>{label}</p>
          <p className={cn("mt-2", accent ? jessicaSuper.statValueAccent : jessicaSuper.statValue)}>{value}</p>
          {hint ? <div className="mt-3 text-sm text-neutral-500">{hint}</div> : null}
        </div>
        {icon ? (
          <div className={accent ? jessicaSuper.iconBoxAccent : jessicaSuper.iconBox}>{icon}</div>
        ) : null}
      </div>
    </div>
  );
}

type JessicaSuperButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
};

export function JessicaSuperButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "default",
  className,
  type = "button",
  disabled,
}: JessicaSuperButtonProps) {
  const cls = cn(
    variant === "primary" && (size === "sm" ? jessicaSuper.ctaSm : jessicaSuper.cta),
    variant === "outline" && jessicaSuper.ctaOutline,
    variant === "ghost" && jessicaSuper.ghost,
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}

export function JessicaSuperCard({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
}) {
  return (
    <div className={cn(jessicaSuper.card, "p-6", className)}>
      {title ? <h2 className="mb-4 text-lg font-semibold text-black">{title}</h2> : null}
      {children}
    </div>
  );
}
