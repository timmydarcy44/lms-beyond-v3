"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { MissionGauge, MissionGaugeDelta } from "@/lib/apprenant/edge-mission-types";

type Props = {
  gauges: MissionGauge[];
  lastDeltas?: MissionGaugeDelta[];
};

export function EdgeMissionGaugePanel({ gauges, lastDeltas }: Props) {
  const deltaMap = new Map((lastDeltas ?? []).map((d) => [d.name.toLowerCase(), d.delta]));

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">État de la situation</p>
      <div className="mt-3 space-y-2.5">
        {gauges.map((g) => {
          const delta = deltaMap.get(g.name.toLowerCase());
          return (
            <div key={g.key}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-white/55">{g.name}</span>
                <span className="tabular-nums text-white/70">{g.value}</span>
              </div>
              <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[#3D7BFF]/80"
                  initial={false}
                  animate={{ width: `${g.value}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <AnimatePresence>
                {delta !== undefined && delta !== 0 ? (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-0.5 inline-block text-[10px] font-medium tabular-nums ${
                      delta > 0 ? "text-emerald-400/90" : "text-orange-300/90"
                    }`}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
