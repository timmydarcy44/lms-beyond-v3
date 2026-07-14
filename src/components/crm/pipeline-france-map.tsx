"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { PipelineDeal } from "@/lib/crm/pipeline-shared";
import { projectLatLngToSvg, resolveDealGeoPoint } from "@/lib/crm/french-geo";

const SVG_W = 320;
const SVG_H = 340;

/** Silhouette métropole simplifiée (viewBox 0 0 320 340). */
const FRANCE_PATH =
  "M48 118 L62 95 L78 88 L95 72 L118 58 L142 52 L168 48 L195 55 L218 68 L238 82 L252 98 L265 118 L272 142 L278 168 L275 195 L268 218 L255 238 L235 255 L210 268 L182 278 L152 282 L122 276 L95 262 L72 242 L58 218 L50 192 L45 165 L42 138 Z";

export function PipelineFranceMap({ deals }: { deals: PipelineDeal[] }) {
  const points = useMemo(() => {
    const seen = new Set<string>();
    return deals
      .map((d) => resolveDealGeoPoint(d))
      .filter((p): p is NonNullable<typeof p> => {
        if (!p || seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
  }, [deals]);

  const projected = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        ...projectLatLngToSvg(p.lat, p.lng, SVG_W, SVG_H),
      })),
    [points],
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.22),transparent_55%)]" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
            Carte France
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {projected.length} entreprise{projected.length > 1 ? "s" : ""} géolocalisée
            {projected.length > 1 ? "s" : ""}
          </p>
        </div>
        <MapPin className="h-5 w-5 shrink-0 text-indigo-300" />
      </div>

      <div className="relative mt-4 flex justify-center">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="h-auto w-full max-w-[320px]"
          role="img"
          aria-label="Carte de France avec les entreprises du pipeline"
        >
          <defs>
            <linearGradient id="franceFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(30,41,59,0.9)" />
              <stop offset="100%" stopColor="rgba(49,46,129,0.5)" />
            </linearGradient>
          </defs>
          <path
            d={FRANCE_PATH}
            fill="url(#franceFill)"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1.5"
          />
          {projected.map((p) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r="7" fill="rgba(99,102,241,0.25)" />
              <circle cx={p.x} cy={p.y} r="3.5" fill="#818cf8" />
              <title>{`${p.company_name}${p.naf_code ? ` (NAF ${p.naf_code})` : ""}`}</title>
            </g>
          ))}
        </svg>
      </div>

      {projected.length > 0 ? (
        <ul className="relative mt-3 max-h-24 space-y-1 overflow-y-auto text-xs text-slate-300">
          {projected.slice(0, 6).map((p) => (
            <li key={p.id} className="truncate">
              <Link href={`/super/crm/pipeline-btob/${p.id}`} className="hover:text-white">
                {p.company_name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="relative mt-3 text-xs text-slate-400">
          Renseignez le SIRET ou le code postal pour afficher les points sur la carte.
        </p>
      )}
    </div>
  );
}
