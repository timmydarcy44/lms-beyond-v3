"use client";

import { TrendingDown, TrendingUp } from "lucide-react";

export type KpiCard = {
  label: string;
  value: number;
  hint: string;
  trend?: string | null;
};

type KPIGridProps = {
  kpis: KpiCard[];
};

export const KPIGrid = ({ kpis }: KPIGridProps) => {
  const accentPalettes = [
    {
      background: "bg-gradient-to-br from-[#1d4ed81c] via-[#2563eba6] to-[#0b1733]",
      border: "border-[#60a5fa66]",
      glow: "shadow-[0_18px_60px_-30px_rgba(96,165,250,0.6)]",
      chip: "bg-blue-400/20 text-blue-50",
    },
    {
      background: "bg-gradient-to-br from-[#8318431c] via-[#be185df2] to-[#280514]",
      border: "border-[#f472b666]",
      glow: "shadow-[0_18px_60px_-30px_rgba(244,114,182,0.6)]",
      chip: "bg-rose-400/20 text-rose-50",
    },
    {
      background: "bg-gradient-to-br from-[#0f766e1c] via-[#14b8a6e6] to-[#052927]",
      border: "border-[#5eead466]",
      glow: "shadow-[0_18px_60px_-30px_rgba(94,234,212,0.55)]",
      chip: "bg-teal-300/20 text-teal-50",
    },
  ];

  return (
    <section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item, index) => {
          const palette = accentPalettes[index % accentPalettes.length];
          const trendIcon =
            item.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-emerald-300" />
            ) : item.trend === "down" ? (
              <TrendingDown className="h-4 w-4 text-rose-300" />
            ) : null;

          return (
            <div
              key={item.label}
              className={`group relative overflow-hidden rounded-3xl border bg-black/35 p-6 text-white backdrop-blur-md transition duration-300 hover:scale-[1.015] ${palette.border} ${palette.background} ${palette.glow}`}
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_65%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/65">{item.label}</p>
                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] ${palette.chip}`}>
                  Insight
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight">
                  {item.value.toLocaleString("fr-FR")}
                </span>
                {trendIcon}
              </div>
              <p className="mt-3 text-sm text-white/70">{item.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};


