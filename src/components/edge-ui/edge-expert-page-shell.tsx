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
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={restricted} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">{eyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-2 max-w-2xl text-sm text-[#050505]/55">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
