"use client";

import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";

type Props = {
  matching: CareerMatchingResult;
};

function MetricCard({
  label,
  count,
  colorClass,
  bgClass,
}: {
  label: string;
  count: number;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className={`rounded-xl border border-white/[0.08] ${bgClass} p-4`}>
      <p className={`text-2xl font-bold tabular-nums ${colorClass}`}>{count}</p>
      <p className="mt-1 text-xs font-medium text-white/55">{label}</p>
    </div>
  );
}

export function ProfilEdgeHubResults({ matching }: Props) {
  const priorityLabel = matching.nextPriority?.skill ?? "—";

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8BB4FF]">
        2. Vos résultats
      </p>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-white/45">Compatibilité métier</p>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl">
            {matching.compatibilityScore}
            <span className="text-2xl text-white/40">%</span>
          </p>
        </div>
        <div className="rounded-xl border border-[#3D7BFF]/25 bg-[#3D7BFF]/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">Priorité</p>
          <p className="mt-1 text-sm font-semibold text-white">{priorityLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Forces"
          count={matching.strengths.length}
          colorClass="text-emerald-300"
          bgClass="bg-emerald-500/[0.06]"
        />
        <MetricCard
          label="À consolider"
          count={matching.consolidate.length}
          colorClass="text-sky-300"
          bgClass="bg-sky-500/[0.06]"
        />
        <MetricCard
          label="Non évaluées"
          count={matching.unevaluated.length}
          colorClass="text-white/50"
          bgClass="bg-white/[0.03]"
        />
        <MetricCard
          label="À développer"
          count={matching.develop.length}
          colorClass="text-rose-300"
          bgClass="bg-rose-500/[0.06]"
        />
      </div>
    </section>
  );
}
