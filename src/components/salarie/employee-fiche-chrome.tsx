"use client";

import type { ReactNode } from "react";
import { Calendar, GraduationCap, Mail, Pencil } from "lucide-react";

export const EMPLOYEE_TABS = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "skills", label: "Compétences" },
  { id: "tests", label: "Tests" },
  { id: "follow", label: "Suivi" },
] as const;

export type EmployeeTabId = (typeof EMPLOYEE_TABS)[number]["id"];

export function parseEmployeeTab(value: string | null | undefined): EmployeeTabId {
  return EMPLOYEE_TABS.some((tab) => tab.id === value) ? (value as EmployeeTabId) : "overview";
}

export function ProfileTabs({
  current,
  onChange,
}: {
  current: EmployeeTabId;
  onChange: (tab: EmployeeTabId) => void;
}) {
  return (
    <div role="tablist" aria-label="Sections de la fiche" className="mt-6 inline-flex max-w-full flex-wrap gap-1 rounded-full bg-white p-1">
      {EMPLOYEE_TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`employee-tab-${tab.id}`}
            aria-selected={active}
            aria-controls={`employee-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={
              active
                ? "h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white"
                : "h-10 rounded-full px-4 text-sm font-semibold text-[#3A3D45]"
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function RoundAction({
  label,
  onClick,
  children,
  tone = "dark",
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  tone?: "violet" | "dark";
  disabled?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-[76px] flex-col items-center gap-2 text-center disabled:opacity-40">
      <span
        className={
          tone === "violet"
            ? "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#6E5BFF] text-white"
            : "inline-flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white/10 text-white"
        }
      >
        {children}
      </span>
      <span className="text-xs font-semibold leading-tight text-white/80">{label}</span>
    </button>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  const empty = value === "Non renseigné" || value === "Aucun besoin déclaré";
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${empty ? "text-[#9096A3]" : "text-white"}`}>{value}</p>
    </div>
  );
}

export function EmployeeHeader({
  name,
  initials,
  subtitle,
  pills,
  email,
  phone,
  seniority,
  inclusion,
  showInvite,
  inviteBusy,
  onAssignFormation,
  onPlanInterview,
  onResendInvite,
  onEdit,
  onInclusion,
}: {
  name: string;
  initials: string;
  subtitle: string;
  pills: string[];
  email: string;
  phone: string;
  seniority: string;
  inclusion: string;
  showInvite: boolean;
  inviteBusy?: boolean;
  onAssignFormation: () => void;
  onPlanInterview: () => void;
  onResendInvite: () => void;
  onEdit: () => void;
  onInclusion: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[32px] bg-[#070C1C] px-6 py-7 text-white sm:px-8">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(50% 120% at 100% 0%, #6E5BFF59, transparent 70%)" }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 min-[1100px]:flex-row min-[1100px]:items-start min-[1100px]:justify-between">
        <div className="flex min-w-0 gap-5">
          <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#6E5BFF] text-2xl font-extrabold">
            {initials}
          </span>
          <div className="min-w-0">
            <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.04em]">{name}</h1>
            <p className="mt-2 text-sm text-[#B5BAC6]">{subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <span key={pill} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  {pill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 min-[1100px]:justify-end">
          <RoundAction label="Assigner une formation" tone="violet" onClick={onAssignFormation}>
            <GraduationCap className="h-5 w-5" />
          </RoundAction>
          <RoundAction label="Planifier un entretien" onClick={onPlanInterview}>
            <Calendar className="h-5 w-5" />
          </RoundAction>
          {showInvite ? (
            <RoundAction label={inviteBusy ? "Envoi…" : "Renvoyer l'invitation"} disabled={inviteBusy} onClick={onResendInvite}>
              <Mail className="h-5 w-5" />
            </RoundAction>
          ) : null}
          <RoundAction label="Modifier" onClick={onEdit}>
            <Pencil className="h-5 w-5" />
          </RoundAction>
        </div>
      </div>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniCard label="Email" value={email} />
        <MiniCard label="Téléphone" value={phone} />
        <MiniCard label="Ancienneté" value={seniority} />
        <button type="button" onClick={onInclusion} className="rounded-2xl bg-white/10 px-4 py-3 text-left">
          <p className="text-xs text-white/60">Inclusion / accessibilité</p>
          <p className={`mt-1 truncate text-sm font-semibold ${inclusion === "Aucun besoin déclaré" ? "text-[#9096A3]" : "text-white"}`}>{inclusion}</p>
        </button>
      </div>
    </section>
  );
}
