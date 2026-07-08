"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { SkillProofMatrix } from "@/lib/apprenant/edge-mission-types";

type Props = {
  matrix: SkillProofMatrix;
  compact?: boolean;
};

function statusIcon(status: SkillProofMatrix["rows"][0]["status"]) {
  if (status === "confirmed") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "emerging") return <CircleDot className="h-4 w-4 text-[#8BB4FF]" />;
  return <Circle className="h-4 w-4 text-white/25" />;
}

export function EdgeMissionProofMatrix({ matrix, compact = false }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8BB4FF]">
            Dossier de preuves — {matrix.skillName}
          </p>
          <p className="mt-1 text-sm text-white/60">{matrix.validationMessage}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular-nums text-white">{matrix.validationProgress}%</p>
          <p className="text-[10px] text-white/40">
            {matrix.observedBehaviors}/{matrix.totalBehaviors} comportements · {matrix.distinctMissionContexts} contextes
          </p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${matrix.isValidated ? "bg-emerald-400" : "bg-[#3D7BFF]"}`}
          initial={{ width: 0 }}
          animate={{ width: `${matrix.validationProgress}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {!compact ? (
        <ul className="mt-4 space-y-2">
          {matrix.rows.map((row) => (
            <li
              key={row.behaviorKey}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
            >
              <span className="mt-0.5 shrink-0">{statusIcon(row.status)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white/85">{row.behaviorLabel}</p>
                {!compact && row.latestEvidence ? (
                  <p className="mt-1 text-xs text-white/45 line-clamp-2">« {row.latestEvidence} »</p>
                ) : null}
                {row.debriefLine && row.observed ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-white/55">{row.debriefLine}</p>
                ) : null}
              </div>
              {row.observationCount > 0 ? (
                <span className="shrink-0 text-[10px] tabular-nums text-white/35">{row.observationCount} obs.</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
