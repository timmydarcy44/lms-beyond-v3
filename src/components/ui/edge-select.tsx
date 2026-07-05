"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const EDGE_INPUT_CLASS =
  "w-full rounded-xl border border-white/[0.12] bg-[linear-gradient(155deg,rgba(14,22,58,0.55)_0%,rgba(8,14,36,0.65)_100%)] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#3D7BFF]/50 focus:ring-1 focus:ring-[#3D7BFF]/25";

type Option = { value: string; label: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function EdgeSelect({ value, onChange, options, placeholder = "Choisir…", disabled, className }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          EDGE_INPUT_CLASS,
          "flex items-center justify-between gap-2 text-left",
          disabled && "opacity-50",
        )}
      >
        <span className={selected ? "text-white" : "text-white/40"}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/40 transition", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          className="absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-white/[0.12] bg-[linear-gradient(155deg,rgba(14,22,58,0.95)_0%,rgba(5,8,20,0.98)_100%)] py-1.5 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          role="listbox"
        >
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm font-medium transition",
                  value === opt.value
                    ? "bg-[#3D7BFF]/20 text-white"
                    : "text-white/80 hover:bg-white/[0.08] hover:text-white",
                )}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Style natif select sombre (fallback accessible) */
export function edgeNativeSelectClassName(): string {
  return `${EDGE_INPUT_CLASS} appearance-none cursor-pointer [&>option]:bg-[#0D111A] [&>option]:text-white`;
}
