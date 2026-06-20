"use client";

import { useState, type ReactNode } from "react";

export type ProfileSectionTab = "competences" | "experiences" | "diplomes";

const TABS: Array<{ id: ProfileSectionTab; label: string }> = [
  { id: "competences", label: "Compétences" },
  { id: "experiences", label: "Expériences" },
  { id: "diplomes", label: "Diplômes" },
];

type Props = {
  variant?: "dashboard" | "public";
  competences: ReactNode;
  experiences: ReactNode;
  diplomes: ReactNode;
  headerAction?: ReactNode;
  defaultTab?: ProfileSectionTab;
  className?: string;
};

export function ProfileSectionTabs({
  variant = "dashboard",
  competences,
  experiences,
  diplomes,
  headerAction,
  defaultTab = "competences",
  className = "",
}: Props) {
  const [active, setActive] = useState<ProfileSectionTab>(defaultTab);
  const isDashboard = variant === "dashboard";

  const tabClass = (id: ProfileSectionTab) =>
    isDashboard
      ? `rounded-full px-4 py-2 text-xs font-semibold transition ${
          active === id
            ? "bg-white/15 text-white"
            : "text-white/55 hover:bg-white/10 hover:text-white/80"
        }`
      : `rounded-full px-4 py-2 text-xs font-semibold transition ${
          active === id
            ? "bg-[#FF3B30]/10 text-[#FF3B30]"
            : "text-black/50 hover:bg-black/[0.04] hover:text-black/70"
        }`;

  const panels: Record<ProfileSectionTab, ReactNode> = {
    competences,
    experiences,
    diplomes,
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActive(tab.id)} className={tabClass(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
      </div>
      <div className="mt-6">{panels[active]}</div>
    </div>
  );
}
