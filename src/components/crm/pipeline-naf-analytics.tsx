"use client";

import { useMemo } from "react";
import type { PipelineDeal } from "@/lib/crm/pipeline-shared";
import { computeNafBuckets } from "@/lib/crm/naf-analytics";

export function PipelineNafAnalytics({
  deals,
  contentOnly = false,
}: {
  deals: PipelineDeal[];
  contentOnly?: boolean;
}) {
  const buckets = useMemo(() => computeNafBuckets(deals), [deals]);
  const withNaf = deals.filter((d) => d.naf_code?.trim()).length;

  const body = (
    <>
      {buckets.length === 0 ? (
        <p className="text-xs text-slate-400">
          Complétez le SIRET pour enrichir le code NAF et analyser les secteurs du pipe.
        </p>
      ) : (
        <ul className="space-y-3">
          {buckets.map((b) => (
            <li key={b.code}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-200">
                  <span className="font-mono text-violet-300">{b.code}</span> · {b.label}
                </span>
                <span className="shrink-0 text-slate-400">
                  {b.count} ({b.share}%)
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-400"
                  style={{ width: `${Math.max(b.share, 8)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (contentOnly) return body;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 p-4 text-white shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.2),transparent_55%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/80">
            Secteurs NAF
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {withNaf} fiche{withNaf > 1 ? "s" : ""} avec code NAF
          </p>
        </div>
      </div>
      <div className="relative mt-4">{body}</div>
    </div>
  );
}
