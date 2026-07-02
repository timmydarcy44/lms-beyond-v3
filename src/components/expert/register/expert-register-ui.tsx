"use client";

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
      className={cn(
        "rounded-2xl border font-medium transition-all duration-200",
        size === "lg" ? "px-5 py-3 text-sm" : "px-4 py-2.5 text-sm",
        selected
          ? "border-[#635BFF]/50 bg-[#635BFF]/15 text-white shadow-[0_0_24px_rgba(99,91,255,0.15)]"
          : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.07] hover:text-white",
      )}
    >
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
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
        selected
          ? "border-[#635BFF]/45 bg-[#635BFF]/10 shadow-[0_0_32px_rgba(99,91,255,0.12)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          selected && "opacity-100",
        )}
        style={{
          background: "radial-gradient(ellipse at top left, rgba(99,91,255,0.08), transparent 70%)",
        }}
        aria-hidden
      />
      <span className="relative flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">{label}</span>
        {isPrimary ? (
          <span className="shrink-0 rounded-lg border border-[#635BFF]/35 bg-[#635BFF]/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#a8a3ff]">
            Principal
          </span>
        ) : null}
      </span>
    </button>
  );
}

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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-xs font-bold text-[#635BFF]">
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
