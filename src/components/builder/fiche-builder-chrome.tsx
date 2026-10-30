import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type BuilderStatus = "draft" | "active" | "paused" | "closed";

const STATUS_LABEL: Record<BuilderStatus, string> = {
  draft: "Brouillon",
  active: "Publiée",
  paused: "En pause",
  closed: "Clôturée",
};

export function StatusPill({ status }: { status: BuilderStatus }) {
  return (
    <span className="inline-flex h-8 items-center rounded-full bg-white px-3 text-sm font-semibold text-[#3A3D45]">
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ChoicePills({
  label,
  value,
  options,
  onChange,
  allowEmpty = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  allowEmpty?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(allowEmpty && active ? "" : option)}
            className={cn(
              "h-[42px] rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]",
              active ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white text-[#07080B]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full bg-[#F4F4F1] p-1">
      {options.map((option) => {
        const active = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option)}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6E5BFF]",
              active ? "bg-[#07080B] text-white" : "text-[#3A3D45]",
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function SegmentBar({ total, filled }: { total: number; filled: number }) {
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn("h-1.5 flex-1 rounded-full", index < filled ? "bg-[#6E5BFF]" : "bg-[#E3E0D8]")}
        />
      ))}
    </div>
  );
}

export function BuilderTopBar({
  backHref,
  title,
  status,
  savedLabel,
  preview,
  publishLabel,
  publishDisabled,
  onPublish,
}: {
  backHref: string;
  title: string;
  status: BuilderStatus;
  savedLabel: string;
  preview?: ReactNode;
  publishLabel: string;
  publishDisabled: boolean;
  onPublish: () => void;
}) {
  return (
    <header className="flex flex-wrap items-center gap-3">
      <Link
        href={backHref}
        aria-label="Retour vers Mes offres"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#07080B]"
      >
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="truncate text-[28px] font-extrabold leading-none tracking-[-0.04em]">{title}</h1>
          <StatusPill status={status} />
        </div>
        <p className="mt-1 text-sm text-[#6B6F7A]">{savedLabel}</p>
      </div>
      <div className="flex items-center gap-2">
        {preview}
        <button
          type="button"
          disabled={publishDisabled}
          onClick={onPublish}
          className="h-11 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {publishLabel}
        </button>
      </div>
    </header>
  );
}

export type FicheStep = {
  id: number;
  title: string;
  caption: string;
};

export function FicheStepper({
  steps,
  current,
  done,
  onChange,
}: {
  steps: FicheStep[];
  current: number;
  done: number[];
  onChange: (step: number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((step) => {
        const active = step.id === current;
        const complete = done.includes(step.id);
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onChange(step.id)}
            aria-current={active ? "step" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[20px] px-4 py-3 text-left",
              active ? "bg-[#07080B] text-white" : "bg-white text-[#07080B]",
            )}
          >
            <span
              className={cn(
                "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                active ? "bg-white text-[#07080B]" : complete ? "bg-[#EEEBFF] text-[#6E5BFF]" : "bg-[#F4F4F1] text-[#3A3D45]",
              )}
            >
              {complete && !active ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span>
              <span className={cn("block text-xs", active ? "text-white/70" : "text-[#6B6F7A]")}>Étape {step.id}</span>
              <span className="block text-sm font-semibold">{step.title}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type ChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  step: number;
};

export function PublishChecklist({
  items,
  onComplete,
}: {
  items: ChecklistItem[];
  onComplete: (item: ChecklistItem) => void;
}) {
  const done = items.filter((item) => item.ok).length;
  return (
    <section className="rounded-[28px] bg-white p-5">
      <p className="text-sm font-semibold text-[#3A3D45]">Prête à publier</p>
      <p className="mt-2 text-[40px] font-extrabold leading-none tracking-[-0.04em]">
        {done}
        <span className="text-[22px] text-[#6B6F7A]"> / {items.length}</span>
      </p>
      <div className="mt-4">
        <SegmentBar total={items.length} filled={done} />
      </div>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 text-sm">
            <span className="inline-flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs",
                  item.ok ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-white text-[#07080B] ring-1 ring-[#E3E0D8]",
                )}
                aria-hidden
              >
                {item.ok ? "✓" : ""}
              </span>
              <span className={item.ok ? "font-semibold text-[#126B3B]" : "font-extrabold text-[#07080B]"}>{item.label}</span>
            </span>
            {item.ok ? null : (
              <button type="button" className="shrink-0 font-semibold text-[#6E5BFF]" onClick={() => onComplete(item)}>
                Compléter
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
