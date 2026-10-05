"use client";

import Link from "next/link";
import { Dumbbell, Upload, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingFocus } from "@/lib/apprenant/edge-skills-center";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";

export function SkillsSectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7BA7FF]/90">
      {children}
    </p>
  );
}

export function SkillsProgressBar({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#3D7BFF] to-[#60A5FA] transition-[width] duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function SkillsTrainingCard({ focus }: { focus: TrainingFocus }) {
  const href = `/dashboard/apprenant/skills/entrainement?skill=${encodeSkillParam(focus.skill)}`;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 transition duration-300 hover:border-[#3D7BFF]/35 hover:bg-white/[0.05]">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#3D7BFF]/10 blur-2xl transition group-hover:bg-[#3D7BFF]/20" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-white">{focus.skill}</h3>
            <p className="mt-1 text-[12px] text-white/35">{focus.statusLabel}</p>
          </div>
          <span className="shrink-0 text-[22px] font-bold tabular-nums tracking-tight text-[#7BA7FF]">
            {focus.progressPercent}&nbsp;%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Niveau actuel</p>
            <p className="mt-0.5 font-medium text-white/85">{focus.currentLevel}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Objectif</p>
            <p className="mt-0.5 font-medium text-white/85">{focus.targetLevel}</p>
          </div>
        </div>

        <SkillsProgressBar value={focus.progressPercent} />

        <div className="flex items-end justify-between gap-3 border-t border-white/[0.06] pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/30">Prochain entraînement</p>
            <p className="mt-0.5 text-[13px] text-white/75">{focus.nextDrill}</p>
            <p className="mt-0.5 text-[12px] text-white/35">{focus.durationMin} min</p>
          </div>
          <Link href={href} className={`${CONNECT_BTN_PRIMARY} shrink-0 !px-3.5 !py-2 text-[12px]`}>
            Continuer
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SkillsCapitalStrip({
  total,
  proved,
  inDevelopment,
  badges,
}: {
  total: number;
  proved: number;
  inDevelopment: number;
  badges: number;
}) {
  const items = [
    { label: "compétences", value: total },
    { label: "prouvées", value: proved },
    { label: "en développement", value: inDevelopment },
    { label: "badges", value: badges },
  ];
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-8">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <p className="text-[40px] font-bold leading-none tracking-[-0.04em] text-white tabular-nums sm:text-[48px]">
            {item.value}
          </p>
          <p className="text-[13px] text-white/40">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export function SkillsEmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-white/40">{children}</p>;
}

const SKILLS_QUICK_ACTIONS = [
  {
    title: "Déposer une preuve",
    description: "Lien, document ou portfolio pour valider une compétence.",
    href: "/dashboard/apprenant/skills/prove",
    icon: Upload,
  },
  {
    title: "Entraînement",
    description: "Exercices guidés et mises en situation.",
    href: "/dashboard/apprenant/skills/entrainement",
    icon: Dumbbell,
  },
  {
    title: "Wallet",
    description: "Tous vos badges et certifications Byound.",
    href: "/dashboard/apprenant/badges",
    icon: Wallet,
  },
] as const;

export function SkillsQuickActionCards({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {SKILLS_QUICK_ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 transition hover:border-[#3D7BFF]/35 hover:bg-white/[0.06]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3D7BFF]/15 text-[#9EC0FF] transition group-hover:bg-[#3D7BFF]/25">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[15px] font-semibold tracking-[-0.02em] text-white">{action.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-white/45">{action.description}</p>
          </Link>
        );
      })}
    </div>
  );
}

/** @deprecated Préférer SkillsQuickActionCards + lien « Développer » séparé */
export function SkillsCtaRow({
  primaryHref,
  secondaryHref,
  exploreHref,
}: {
  primaryHref: string;
  secondaryHref: string;
  exploreHref: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Link href={primaryHref} className={CONNECT_BTN_PRIMARY}>
        Développer une compétence
      </Link>
      <Link href={secondaryHref} className={CONNECT_BTN_SECONDARY}>
        Prouver une compétence
      </Link>
      <Link
        href={exploreHref}
        className="text-[13px] font-medium text-[#7BA7FF] transition hover:text-white sm:ml-1"
      >
        Explorer mes compétences
      </Link>
    </div>
  );
}
