"use client";

import type { ReactNode } from "react";

export function SegmentedFilter({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: string; label: string; count?: number }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className="rounded-full px-3 py-1.5 text-[13px] font-semibold"
            style={{ background: active ? "#6E5BFF" : "transparent", color: active ? "#fff" : "#8A93AE" }}
          >
            {item.label}
            {item.count != null ? <span className="ml-1.5 rounded-full bg-white/15 px-1.5">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[22px] border border-[#1A2340] bg-[#111831] p-4">
      <p className="text-[28px] font-extrabold tracking-[-0.6px]">{value}</p>
      <p className="text-[13px] text-[#8A93AE]">{label}</p>
      {hint ? <p className="mt-1 text-xs text-[#6BE39B]">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[28px] border border-[#1A2340] bg-[#111831] px-6 py-16 text-center">
      <div className="mb-4 h-16 w-16 rounded-3xl border border-[#26304F] bg-[#0B1122]" />
      <p className="max-w-sm text-sm text-[#C9D2E8]">{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SidePanel({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
      <div className="h-full w-full max-w-md overflow-auto border-l border-[#1A2340] bg-[#111831] p-6 text-[#F4F7FF]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#8A93AE]">Fermer</button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block text-sm">
      <span className="mb-1 block text-[#8A93AE]">{label}</span>
      {children}
    </label>
  );
}

export const fieldClass = "w-full rounded-2xl border border-[#26304F] bg-[#0B1122] px-3 py-2 text-sm outline-none";

export function DisabledTip({ label, reason, children }: { label: string; reason: string; children?: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" disabled aria-label={label} title={reason} className="cursor-not-allowed rounded-full border border-[#26304F] px-4 py-2 text-sm text-[#8A93AE] opacity-80">
        {children ?? label}
      </button>
      <span className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-56 rounded-2xl bg-[#0B1122] px-3 py-2 text-left text-xs text-[#F4F7FF] group-hover:block">
        {reason}
      </span>
    </span>
  );
}
