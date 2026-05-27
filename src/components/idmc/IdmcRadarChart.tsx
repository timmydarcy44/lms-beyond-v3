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

export type AxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";

export const AXES_LABELS: Record<AxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l'information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

export const resolveIdmcAxes = (scores: unknown): Record<AxisKey, number> | null => {
  if (!scores || typeof scores !== "object") return null;
  const candidate = scores as Record<string, unknown>;
  if (candidate.axes && typeof candidate.axes === "object") {
    return candidate.axes as Record<AxisKey, number>;
  }
  if (candidate.points && typeof candidate.points === "object") {
    const points = candidate.points as Record<AxisKey, number>;
    const axes = {} as Record<AxisKey, number>;
    (Object.keys(AXES_LABELS) as AxisKey[]).forEach((key) => {
      const value = typeof points[key] === "number" ? points[key] : 0;
      axes[key] = Math.round((value / 15) * 100);
    });
    return axes;
  }
  const hasAllAxes = (Object.keys(AXES_LABELS) as AxisKey[]).every(
    (key) => typeof candidate[key] === "number",
  );
  if (hasAllAxes) return candidate as Record<AxisKey, number>;
  return null;
};

export function IdmcRadarChart({
  scores,
  title = "Profil IDMC",
  responsive = false,
  variant = "light",
}: {
  scores: Record<AxisKey, number>;
  title?: string;
  responsive?: boolean;
  variant?: "light" | "dark";
}) {
  const chartHeight = responsive ? 260 : 300;
  const radarData = (Object.keys(AXES_LABELS) as AxisKey[]).map((key) => ({
    axis: AXES_LABELS[key],
    value: scores[key] ?? 0,
  }));

  const isLight = variant === "light";

  return (
    <div
      className={
        isLight
          ? "rounded-xl border border-black/[0.06] bg-white p-3"
          : "rounded-2xl border border-white/10 bg-slate-900 p-5"
      }
    >
      {title ? (
        <div
          className={
            isLight
              ? "text-[10px] font-medium uppercase tracking-[0.2em] text-[#FF3B30]"
              : "text-[12px] text-white/60"
          }
        >
          {title}
        </div>
      ) : null}
      <div className="mt-2 w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.12)"} />
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.7)",
                fontSize: 9,
              }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: isLight ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.5)", fontSize: 8 }}
              axisLine={false}
            />
            <Tooltip
              contentStyle={
                isLight
                  ? { background: "#fff", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }
                  : { background: "#0B0F1A", border: "1px solid rgba(255,255,255,0.1)" }
              }
              labelStyle={{ color: isLight ? "#0a0a0a" : "#E5E7EB", fontSize: 11 }}
              itemStyle={{ color: "#FF3B30", fontSize: 11 }}
            />
            <Radar dataKey="value" stroke="#FF3B30" fill="rgba(255,59,48,0.18)" strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
