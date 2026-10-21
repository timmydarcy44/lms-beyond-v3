"use client";

import type { ReactNode } from "react";

import { ExpertPageHeader } from "@/components/expert/expert-ui";

type Props = {
  children: ReactNode;
  restricted?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function EdgeExpertPageShell({ children, title, subtitle, actions }: Props) {
  return (
    <div className="min-h-screen text-[#F4F5F7]">
      <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <ExpertPageHeader title={title} subtitle={subtitle} action={actions} />
        {children}
      </div>
    </div>
  );
}
