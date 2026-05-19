"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { m: "S1", v: 42 },
  { m: "S2", v: 48 },
  { m: "S3", v: 45 },
  { m: "S4", v: 52 },
  { m: "S5", v: 58 },
];

export function TuteurSparkline() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tutorSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="m" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide domain={[30, 70]} />
          <Tooltip
            contentStyle={{
              background: "rgba(9,9,11,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              fontSize: 12,
              color: "#fafafa",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.55)" }}
          />
          <Area type="monotone" dataKey="v" stroke="rgb(129, 140, 248)" strokeWidth={2} fill="url(#tutorSpark)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
