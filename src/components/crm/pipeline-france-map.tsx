"use client";

import { useMemo } from "react";
import Link from "next/link";
import franceDepartmentsMap from "@svg-maps/france.departments";
import type { PipelineDeal } from "@/lib/crm/pipeline-shared";
import {
  projectLatLngToSvg,
  resolveAllDealGeoPoints,
} from "@/lib/crm/french-geo";

export function PipelineFranceMap({
  deals,
  contentOnly = false,
}: {
  deals: PipelineDeal[];
  contentOnly?: boolean;
}) {
  const points = useMemo(() => resolveAllDealGeoPoints(deals), [deals]);

  const projected = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        ...projectLatLngToSvg(p.lat, p.lng),
      })),
    [points],
  );

  const missingCount = deals.length - points.length;

  const mapBody = (
    <>
      <div className="flex justify-center">
        <svg
          viewBox={franceDepartmentsMap.viewBox}
          className="h-auto w-full max-w-[360px]"
          role="img"
          aria-label="Carte de France avec les entreprises du pipeline"
        >
          <defs>
            <linearGradient id="franceDeptFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(30,41,59,0.95)" />
              <stop offset="100%" stopColor="rgba(49,46,129,0.55)" />
            </linearGradient>
          </defs>
          <g fill="url(#franceDeptFill)" stroke="rgba(148,163,184,0.28)" strokeWidth="0.6">
            {franceDepartmentsMap.locations.map((loc) => (
              <path key={loc.id} d={loc.path} />
            ))}
          </g>
          {projected.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="8" fill="rgba(99,102,241,0.22)" />
              <circle cx={p.x} cy={p.y} r="3.5" fill="#a5b4fc" stroke="#312e81" strokeWidth="0.5" />
              <title>{`${p.company_name}${p.naf_code ? ` (NAF ${p.naf_code})` : ""}`}</title>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>
          {projected.length}/{deals.length} entreprise{deals.length > 1 ? "s" : ""} sur la carte
        </span>
        {missingCount > 0 ? (
          <span className="text-amber-300/90">
            · {missingCount} sans localisation (ajoutez ville ou CP)
          </span>
        ) : null}
      </div>

      {projected.length > 0 ? (
        <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-slate-300">
          {projected.map((p) => (
            <li key={p.id} className="truncate">
              <Link href={`/super/crm/pipeline-btob/${p.id}`} className="hover:text-white">
                {p.company_name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-slate-400">
          Renseignez le SIRET, la ville ou le code postal pour afficher les entreprises.
        </p>
      )}

      <p className="mt-2 text-[10px] text-slate-500">
        Carte © MapSVG / svg-maps (CC BY 4.0)
      </p>
    </>
  );

  if (contentOnly) return mapBody;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.22),transparent_55%)]" />
      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
          Carte France
        </p>
        <p className="mt-1 text-sm text-slate-300">
          {projected.length} entreprise{projected.length > 1 ? "s" : ""} sur la carte
        </p>
        <div className="relative mt-4">{mapBody}</div>
      </div>
    </div>
  );
}
