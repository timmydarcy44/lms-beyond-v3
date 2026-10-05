"use client";

import { forwardRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  size?: "md" | "lg";
};

export function SelectChip({ label, selected, onToggle, size = "md" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200 active:scale-[0.97]",
        size === "lg" ? "px-5 py-3 text-sm" : "px-4 py-2 text-[13px]",
        selected
          ? "border-white bg-white text-[#070b1f]"
          : "border-white/10 bg-white/[0.05] text-white/75 hover:border-white/25 hover:bg-white/[0.09] hover:text-white",
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : null}
      {label}
    </button>
  );
}

type DomainCardProps = {
  label: string;
  selected: boolean;
  isPrimary?: boolean;
  onSelect: () => void;
};

export function DomainCard({ label, selected, isPrimary, onSelect }: DomainCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative flex min-h-[64px] items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.98]",
        selected
          ? "border-[#7C83FF]/60 bg-[#7C83FF]/15"
          : "border-white/[0.08] bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]",
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-white">{label}</span>
        {isPrimary ? (
          <span className="mt-0.5 block text-[11px] font-medium text-[#A9AEFF]">Domaine principal</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
          selected ? "border-white bg-white text-[#070b1f]" : "border-white/20 text-transparent",
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </span>
    </button>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

/** Champ à label flottant, style app bancaire. */
export const RevolutField = forwardRef<HTMLInputElement, FieldProps>(function RevolutField(
  { label, hint, className, id, ...props },
  ref,
) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={className}>
      <div className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.05] transition focus-within:border-[#7C83FF]/70 focus-within:bg-white/[0.07]">
        <input
          ref={ref}
          id={inputId}
          placeholder=" "
          className="peer block h-[60px] w-full rounded-2xl bg-transparent px-4 pb-2 pt-6 text-[15px] font-medium text-white outline-none placeholder:text-transparent"
          {...props}
        />
        <label
          htmlFor={inputId}
          className="pointer-events-none absolute left-4 top-2.5 text-[11px] font-medium text-white/45 transition-all peer-placeholder-shown:top-[19px] peer-placeholder-shown:text-[15px] peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:text-[#A9AEFF]"
        >
          {label}
        </label>
      </div>
      {hint ? <p className="mt-2 px-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
});

type SectionProps = {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  visible: boolean;
};

export function SpecialtiesSection({ step, title, subtitle, children, visible }: SectionProps) {
  if (!visible) return null;

  return (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-xs font-bold text-[#A9AEFF]">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
          {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </section>
  );
}
