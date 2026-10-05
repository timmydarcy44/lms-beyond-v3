"use client";

import SidebarExpert from "@/components/SidebarExpert";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  restricted?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function EdgeExpertPageShell({
  children,
  restricted = false,
  eyebrow = "Espace formateur",
  title,
  subtitle,
  actions,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b1f] text-white">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <div className="absolute -right-64 -top-64 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(91,80,255,0.28),transparent_62%)] blur-3xl" />
        <div className="absolute -bottom-64 -left-48 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(40,80,200,0.14),transparent_62%)] blur-3xl" />
      </div>
      <SidebarExpert restricted={restricted} />
      <main className="relative min-h-screen lg:pl-[260px]">
        <div className="mx-auto max-w-6xl px-4 py-7 pb-24 sm:px-6 sm:py-10">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-[#A9AEFF]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">{title}</h1>
              {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
