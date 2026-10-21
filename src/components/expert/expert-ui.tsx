"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7EEBB5]";

export function ExpertPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[32px] font-extrabold leading-none tracking-[-0.04em] text-[#F4F5F7] md:text-[40px]">
          {title}
        </h1>
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-[#B5BAC6]">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}

export function ExpertPrimaryButton({
  children,
  href,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const className = cn(
    "inline-flex h-11 items-center justify-center rounded-full bg-[#2FD08A] px-5 text-sm font-extrabold text-[#04140C]",
    focusRing,
  );
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function HeroCard({
  children,
  tone = "surface",
  className,
}: {
  children: ReactNode;
  tone?: "surface" | "green" | "blue";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[32px] p-6 sm:p-8",
        tone === "green" && "bg-[#2FD08A] text-[#04140C]",
        tone === "blue" && "bg-[#132A4D] text-[#F4F5F7]",
        tone === "surface" && "bg-[#12141A] text-[#F4F5F7]",
        className,
      )}
    >
      {tone === "surface" ? (
        <span
          className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(47,208,138,0.38),transparent_70%)]"
          aria-hidden
        />
      ) : null}
      {tone === "green" ? (
        <>
          <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/25" aria-hidden />
          <span className="pointer-events-none absolute -bottom-16 right-10 h-44 w-44 rounded-full bg-white/15" aria-hidden />
        </>
      ) : null}
      <div className="relative">{children}</div>
    </section>
  );
}

export function QuickActions({
  actions,
}: {
  actions: Array<{
    label: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    tone?: "green" | "dark" | "ghost";
  }>;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      {actions.map((action) => {
        const Icon = action.icon;
        const circle = cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          action.tone === "green" && "bg-[#2FD08A] text-[#04140C]",
          action.tone === "dark" && "bg-[#07080B] text-[#F4F5F7]",
          (!action.tone || action.tone === "ghost") && "bg-[#1E2130] text-[#F4F5F7]",
        );
        const inner = (
          <>
            <span className={circle}>
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="max-w-[88px] text-center text-xs font-semibold text-[#DADDE4]">{action.label}</span>
          </>
        );
        if (action.href) {
          return (
            <Link key={action.label} href={action.href} className={cn("flex w-[88px] flex-col items-center gap-2 rounded-3xl", focusRing)}>
              {inner}
            </Link>
          );
        }
        return (
          <button key={action.label} type="button" onClick={action.onClick} className={cn("flex w-[88px] flex-col items-center gap-2 rounded-3xl", focusRing)}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentBar({
  total,
  filled,
  tone = "green",
}: {
  total: number;
  filled: number;
  tone?: "green" | "gold" | "white";
}) {
  const count = Math.max(0, total);
  const done = Math.max(0, Math.min(count, filled));
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            index < done
              ? tone === "gold"
                ? "bg-[#F2CF6B]"
                : tone === "white"
                  ? "bg-white"
                  : "bg-[#2FD08A]"
              : "bg-[#1E2130]",
          )}
        />
      ))}
    </div>
  );
}

const PILL_TONES = {
  green: "bg-[#0F2E20] text-[#7EEBB5]",
  solid: "bg-[#2FD08A] text-[#04140C]",
  grey: "bg-[#1E2130] text-[#DADDE4]",
  blue: "bg-[#132A4D] text-[#8DB8FF]",
  gold: "bg-[#36301A] text-[#F2CF6B]",
  alert: "bg-[#3A1418] text-[#FF7A85]",
} as const;

export function StatusPill({
  children,
  tone = "grey",
}: {
  children: ReactNode;
  tone?: keyof typeof PILL_TONES;
}) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", PILL_TONES[tone])}>
      {children}
    </span>
  );
}

export function TxList({
  title,
  meta,
  children,
}: {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-[#12141A] px-3 py-2 sm:px-4">
      {title ? (
        <header className="flex items-center justify-between gap-3 px-2 py-3">
          <h2 className="text-base font-extrabold text-[#F4F5F7]">{title}</h2>
          {meta ? <span className="text-sm font-bold text-[#9096A3]">{meta}</span> : null}
        </header>
      ) : null}
      <div className="divide-y divide-[#1E2130]">{children}</div>
    </section>
  );
}

export function TxRow({
  leading,
  title,
  subtitle,
  trailing,
  href,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-[#F4F5F7]">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-[#9096A3]">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
    </>
  );
  const className = "flex min-h-[72px] items-center gap-3 px-2 py-3";
  if (href) {
    return (
      <Link href={href} className={cn(className, "rounded-2xl hover:bg-[#1E2130]", focusRing)}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

export function FilterPills({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ id: string; label: string }>;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-bold",
              focusRing,
              selected ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#12141A] text-[#DADDE4]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] bg-[#12141A] px-6 py-10 text-center">
      <p className="text-base font-extrabold text-[#F4F5F7]">{title}</p>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm text-[#B5BAC6]">{text}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
