"use client";

import { TrendingUp } from "lucide-react";
import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";
import { ProfilEdgeHubCard, ProfilEdgeHubKicker } from "./profil-edge-hub-card";

type Props = {
  matching: CareerMatchingResult;
};

export function ProfilEdgeHubResults({ matching }: Props) {
  const priorityLabel = matching.nextPriority?.skill ?? "—";

  return (
    <ProfilEdgeHubCard className="min-h-[220px] justify-between gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
          <TrendingUp className="h-6 w-6" />
        </div>
      </div>

      <div>
        <ProfilEdgeHubKicker>Alignement métier</ProfilEdgeHubKicker>
        <p className="mt-3 text-5xl font-semibold tabular-nums tracking-[-0.04em] text-white">
          {matching.compatibilityScore}
          <span className="text-2xl text-white/35">%</span>
        </p>
        <p className="mt-2 text-sm text-white/45">Compatibilité avec votre objectif professionnel</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-xl font-bold tabular-nums text-emerald-300">{matching.strengths.length}</p>
          <p className="mt-1 text-[10px] leading-tight text-white/45">Forces</p>
        </div>
        <div className="rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/10 px-3 py-3 text-center">
          <p className="truncate text-xs font-semibold text-[#8BB4FF]">{priorityLabel}</p>
          <p className="mt-1 text-[10px] leading-tight text-white/45">Priorité</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-center">
          <p className="text-xl font-bold tabular-nums text-sky-300">
            {matching.develop.length + matching.consolidate.length}
          </p>
          <p className="mt-1 text-[10px] leading-tight text-white/45">À progresser</p>
        </div>
      </div>
    </ProfilEdgeHubCard>
  );
}
