// Petits éléments visuels partagés par les tableaux de bord (sans dépendance).

export function Sparkline({ values, max = 100, width = 160, height = 44 }: { values: number[]; max?: number; width?: number; height?: number }) {
  if (values.length === 0) return <span className="text-xs text-muted-foreground">Pas encore de partie</span>;
  const pad = 4, w = width - pad * 2, h = height - pad * 2;
  const pts = values.map((v, i) => [pad + (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w), pad + h - (v / max) * h] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${pad + h} L${pts[0][0].toFixed(1)},${pad + h} Z`;
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Scores successifs : ${values.join(", ")}`}>
      <path d={area} fill="currentColor" opacity={0.12} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={3.5} fill="currentColor" />
    </svg>
  );
}

export function Bar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`}>
      <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-900">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

export function ToneChip({ tone }: { tone: "good" | "mid" | "bad" | null }) {
  if (!tone) return null;
  const map = {
    good: ["Bon réflexe", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"],
    mid: ["À nuancer", "bg-amber-500/15 text-amber-700 dark:text-amber-300"],
    bad: ["À revoir", "bg-red-500/15 text-red-700 dark:text-red-300"],
  } as const;
  const [label, cls] = map[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}

export const CRITERIA_LABEL: Record<string, string> = {
  sources: "Pertinence des sources", analyse: "Qualité de l'analyse",
  opportunitesRisques: "Opportunités et risques", justification: "Justification",
};
export const CRITERIA_MAX: Record<string, number> = { sources: 25, analyse: 30, opportunitesRisques: 20, justification: 25 };
