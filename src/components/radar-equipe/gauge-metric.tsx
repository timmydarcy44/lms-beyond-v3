import { cn } from "@/lib/utils";

type GaugeMetricProps = {
  label: string;
  value: number | null;
  suffix?: string;
  tone?: "violet" | "amber" | "emerald" | "rose";
  sublabel?: string;
};

export function GaugeMetric({
  label,
  value,
  suffix = "",
  tone = "violet",
  sublabel,
}: GaugeMetricProps) {
  const v = value != null && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
  const gradient =
    tone === "emerald"
      ? "from-emerald-400 to-emerald-600"
      : tone === "amber"
        ? "from-amber-400 to-orange-500"
        : tone === "rose"
          ? "from-rose-400 to-red-500"
          : "from-violet-400 to-indigo-600";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">
        {v != null ? `${v}${suffix}` : "—"}
      </p>
      {sublabel ? <p className="mt-1 text-xs text-white/50">{sublabel}</p> : null}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all", gradient)}
          style={{ width: v != null ? `${v}%` : "0%" }}
        />
      </div>
    </div>
  );
}
