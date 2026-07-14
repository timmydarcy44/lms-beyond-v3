"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Circle,
  FileText,
  Heart,
  Mail,
  Phone,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  computeDealIntelligence,
  type DealIntelligenceInput,
} from "@/lib/crm/pipeline-deal-intelligence";

const NBA_ICONS = {
  phone: Phone,
  mail: Mail,
  users: Users,
  calendar: Calendar,
  file: FileText,
} as const;

export function PipelineDealIntelligencePanel({
  input,
  onApplyNextBestAction,
}: {
  input: DealIntelligenceInput;
  onApplyNextBestAction?: (action: string) => void;
}) {
  const intel = useMemo(() => computeDealIntelligence(input), [input]);
  const NbaIcon = NBA_ICONS[intel.nextBestIcon];

  const healthEmoji = intel.healthLevel === "green" ? "🟢" : intel.healthLevel === "amber" ? "🟠" : "🔴";

  return (
    <div className="relative space-y-4 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white -mx-4 -mt-4 mb-4 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.2),transparent_55%)]" />

      {/* Complétude */}
      {intel.missingFields.length > 0 ? (
        <div className="relative rounded-xl border border-amber-400/30 bg-amber-950/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Dossier incomplet</p>
          <p className="mt-1 text-sm text-amber-50/90">Il manque :</p>
          <ul className="mt-2 space-y-1">
            {intel.missingFields.slice(0, 5).map((f) => (
              <li key={f.key} className="flex items-center gap-2 text-xs text-amber-100/90">
                <Circle className="h-3 w-3 shrink-0" />
                {f.label}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-200/80">
            Score de complétude : <span className="font-bold">{intel.completenessScore}%</span>
          </p>
        </div>
      ) : (
        <div className="relative flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          Dossier complet ({intel.completenessScore}%)
        </div>
      )}

      {/* Health Score */}
      <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
              Health Score
            </p>
            <p className="mt-1 text-3xl font-bold">
              {intel.healthScore}
              <span className="text-lg font-normal text-slate-400">/100</span> {healthEmoji}
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Probabilité de signature :{" "}
              <span className="font-semibold text-white">{intel.signatureProbability}%</span>
            </p>
          </div>
          <TrendingUp className="h-5 w-5 shrink-0 text-indigo-300" />
        </div>
        <ul className="mt-3 space-y-1.5">
          {intel.checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2 text-xs">
              {c.ok ? (
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              )}
              <span className={c.ok ? "text-slate-300" : "text-rose-200"}>{c.label}</span>
            </li>
          ))}
        </ul>
        {intel.atRisk ? (
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-rose-950/50 px-3 py-2 text-xs font-medium text-rose-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Attention : deal en risque.
          </p>
        ) : null}
      </div>

      {/* Next Best Action */}
      <div className="relative rounded-xl border border-violet-400/20 bg-violet-950/30 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/80">
          Prochaine meilleure action
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
          <NbaIcon className="h-4 w-4 shrink-0 text-violet-300" />
          {intel.nextBestAction}
        </p>
        {onApplyNextBestAction ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-3 bg-white/10 text-white hover:bg-white/20"
            onClick={() => onApplyNextBestAction(intel.nextBestAction)}
          >
            Appliquer à la fiche
          </Button>
        ) : null}
      </div>

      {/* Relationship Score */}
      <div className="relative flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-300" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Relationship Score
          </span>
        </div>
        <span className="text-lg font-bold">{intel.relationshipScore}%</span>
      </div>

      {/* Vélocité */}
      {intel.daysInStage != null ? (
        <div
          className={cn(
            "relative rounded-xl border p-4",
            intel.velocityRisk ? "border-amber-400/30 bg-amber-950/20" : "border-white/10 bg-white/5",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Vélocité</p>
          <p className="mt-1 text-sm text-white">
            {intel.stageLabel} :{" "}
            <span className="font-bold">
              {intel.daysInStage} jour{intel.daysInStage > 1 ? "s" : ""}
            </span>
            {intel.velocityRisk ? " ⚠" : null}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Moyenne comparables : {intel.stageBenchmark} jours
          </p>
          {intel.velocityWarning ? (
            <p className="mt-2 text-xs text-amber-200">{intel.velocityWarning}</p>
          ) : null}
        </div>
      ) : null}

      {/* Timeline */}
      {intel.timeline.length > 0 ? (
        <div className="relative rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">Timeline</p>
          <ul className="mt-3 space-y-2">
            {intel.timeline.map((ev, i) => (
              <li key={`${ev.date}-${ev.kind}-${i}`} className="flex gap-3 text-xs">
                <span className="w-16 shrink-0 font-mono text-slate-400">
                  {ev.date.slice(8, 10)}/{ev.date.slice(5, 7)}
                </span>
                <span className="text-slate-200">{ev.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
