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
    (key) => typeof candidate[key] === "number"
  );
  if (hasAllAxes) return candidate as Record<AxisKey, number>;
  return null;
};

export function IdmcRadarChart({
  scores,
  title = "Spider Chart (IDMC)",
  responsive = false,
}: {
  scores: Record<AxisKey, number>;
  title?: string;
  responsive?: boolean;
}) {
  const chartHeight = responsive ? 300 : 350;
  const radarData = (Object.keys(AXES_LABELS) as AxisKey[]).map((key) => ({
    axis: AXES_LABELS[key],
    value: scores[key] ?? 0,
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
      <div className="text-[12px] text-white/60">{title}</div>
      <div className="mt-4 w-full" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="rgba(255,255,255,0.12)" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "#0B0F1A", border: "1px solid rgba(255,255,255,0.1)" }}
              labelStyle={{ color: "#E5E7EB" }}
              itemStyle={{ color: "#F59E0B" }}
            />
            <Radar dataKey="value" stroke="#F59E0B" fill="rgba(245,158,11,0.25)" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
