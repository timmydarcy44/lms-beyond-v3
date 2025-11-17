"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

export type KpiCard = {
  label: string;
  value: number;
  hint: string;
  trend?: "up" | "down" | null;
};

type KPIGridProps = {
  kpis: KpiCard[];
};

export const KPIGrid = ({ kpis }: KPIGridProps) => {
  const accentPalettes = [
    {
      background: "bg-gradient-to-br from-[#2563eb1f] via-[#7c3aed26] to-transparent",
      border: "border-[#2563eb33]",
      shadow: "shadow-[0_12px_48px_rgba(37,99,235,0.18)]",
    },
    {
      background: "bg-gradient-to-br from-[#ec489926] via-[#f9731626] to-transparent",
      border: "border-[#ec489933]",
      shadow: "shadow-[0_12px_48px_rgba(236,72,153,0.18)]",
    },
    {
      background: "bg-gradient-to-br from-[#22d3ee26] via-[#38bdf826] to-transparent",
      border: "border-[#22d3ee33]",
      shadow: "shadow-[0_12px_48px_rgba(34,211,238,0.18)]",
    },
  ];

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item, index) => {
          const palette = accentPalettes[index % accentPalettes.length];
          return (
          <div
            key={item.label}
              className={`relative overflow-hidden rounded-3xl border bg-white/5 p-6 text-white ${palette.border} ${palette.background} ${palette.shadow}`}
          >
              <span className="pointer-events-none absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-gradient-to-br from-white/20 to-transparent blur-2xl" />
            <div className="text-sm text-white/60">{item.label}</div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">
              {item.value.toLocaleString("fr-FR")}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-white/70">
              {item.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : item.trend === "down" ? (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              ) : null}
              <span>{item.hint}</span>
            </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};


