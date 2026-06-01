"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

type DiscRadarChartProps = {
  d: number;
  i: number;
  s: number;
  c: number;
  className?: string;
};

function discBadges(d: number, i: number, s: number, c: number) {
  const badges: { label: string; tone: "orange" | "blue" }[] = [];
  if (c < 15) badges.push({ label: "Profil Rigueur sous-représenté", tone: "orange" });
  if (d > 50) badges.push({ label: "Dominance forte — risque de conflits décisionnels", tone: "orange" });
  if (s > 50) badges.push({ label: "Équipe stable — attention au changement brutal", tone: "blue" });
  return badges;
}

export function DiscRadarChart({ d, i, s, c, className }: DiscRadarChartProps) {
  const data = [
    { axis: "D — Décision", value: d, fullMark: 100 },
    { axis: "I — Influence", value: i, fullMark: 100 },
    { axis: "S — Stabilité", value: s, fullMark: 100 },
    { axis: "C — Rigueur", value: c, fullMark: 100 },
  ];

  const badges = discBadges(d, i, s, c);

  return (
    <div className={cn("space-y-3", className)}>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 10 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Distribution"
            dataKey="value"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
            }}
            formatter={(v: number) => [`${v}%`, "Part de l'équipe"]}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-white/60">
        {d}% D — {i}% I — {s}% S — {c}% C
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {badges.map((b) => (
          <span
            key={b.label}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium",
              b.tone === "orange"
                ? "border border-amber-500/40 bg-amber-500/15 text-amber-100"
                : "border border-sky-500/40 bg-sky-500/15 text-sky-100",
            )}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
