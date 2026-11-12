"use client";

import type { ReactNode } from "react";

export function PageTitle({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[34px] font-extrabold leading-none tracking-[-0.6px] text-[#F2F4FA]">
          {title}
        </h1>
        {subtitle ? <div className="mt-2 text-sm text-[#9AA3BD]">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export type StageStripItem = {
  id: string;
  label: string;
  count: number;
  color: string;
};

export function StageStrip({
  title,
  meta,
  items,
  onSelect,
  activeId,
}: {
  title: string;
  meta?: ReactNode;
  items: StageStripItem[];
  onSelect?: (id: string) => void;
  activeId?: string | null;
}) {
  return (
    <section className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-[17px] font-extrabold text-[#F2F4FA]">{title}</h2>
        {meta ? <p className="text-sm text-[#9AA3BD]">{meta}</p> : null}
      </div>
      <div className="mt-5 grid gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = activeId === item.id;
          const bar = item.count > 0 ? item.color : "#26304F";
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect?.(item.id)}
              className="rounded-2xl p-2 text-left transition"
              style={{
                background: active ? "#0B1122" : "transparent",
                boxShadow: active ? `inset 0 0 0 1px ${item.color}55` : undefined,
              }}
            >
              <span className="mb-3 block h-[6px] rounded-full" style={{ background: bar }} />
              <span className="block text-[20px] font-extrabold text-[#F2F4FA]">{item.count}</span>
              <span className="mt-1 block text-xs font-semibold text-[#9AA3BD]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function FilterPill({
  active,
  children,
  onClick,
  count,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-sm font-semibold"
      style={{
        background: active ? "#FFFFFF" : "#111831",
        color: active ? "#0A0F1E" : "#B7BED3",
        border: active ? "1px solid #FFFFFF" : "1px solid #1A2340",
      }}
    >
      {children}
      {count != null ? ` ${count}` : ""}
    </button>
  );
}

export function TestToggle({
  checked,
  count,
  onChange,
}: {
  checked: boolean;
  count: number;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#9AA3BD]">
      <span
        className="relative h-5 w-9 rounded-full transition"
        style={{ background: checked ? "#6E5BFF" : "#26304F" }}
      >
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-4"
        />
      </span>
      Comptes de test ({count})
    </label>
  );
}

export function ViewSwitch({
  value,
  onChange,
  boardLabel = "Tableau",
  listLabel = "Liste",
}: {
  value: "board" | "list";
  onChange: (next: "board" | "list") => void;
  boardLabel?: string;
  listLabel?: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-full border border-[#26304F] bg-[#0B1122] p-0.5 text-sm font-semibold">
      <button
        type="button"
        onClick={() => onChange("board")}
        className="rounded-full px-3 py-1.5"
        style={{
          background: value === "board" ? "#FFFFFF" : "transparent",
          color: value === "board" ? "#0A0F1E" : "#6C7593",
        }}
      >
        {boardLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className="rounded-full px-3 py-1.5"
        style={{
          background: value === "list" ? "#FFFFFF" : "transparent",
          color: value === "list" ? "#0A0F1E" : "#6C7593",
        }}
      >
        {listLabel}
      </button>
    </div>
  );
}
