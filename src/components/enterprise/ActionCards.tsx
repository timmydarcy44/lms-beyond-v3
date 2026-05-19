"use client";

import React from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type RecommendedAction = {
  id: string;
  title: string;
  description: string | null;
  dimension_key: string;
  target_count: number;
};

function dimensionStyle(dimensionKey: string) {
  const key = dimensionKey.toLowerCase();
  if (key.includes("stress") || key.includes("care") || key.includes("burn")) {
    return {
      dot: "bg-red-500",
      border: "border-red-200",
      bg: "bg-red-50/40",
      badge: "bg-red-100 text-red-800",
      icon: "text-red-600",
    };
  }
  if (key.includes("orga") || key.includes("organisation") || key.includes("prior")) {
    return {
      dot: "bg-amber-500",
      border: "border-amber-200",
      bg: "bg-amber-50/40",
      badge: "bg-amber-100 text-amber-900",
      icon: "text-amber-600",
    };
  }
  return {
    dot: "bg-indigo-500",
    border: "border-indigo-200",
    bg: "bg-indigo-50/40",
    badge: "bg-indigo-100 text-indigo-900",
    icon: "text-indigo-600",
  };
}

export function ActionCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-3xl border border-gray-200 bg-gray-50/40 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="mt-4 h-3 w-72 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-56 rounded bg-gray-200" />
            </div>
            <div className="text-right">
              <div className="h-10 w-12 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <div className="h-9 w-44 rounded-2xl bg-gray-200" />
            <div className="h-3 w-52 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActionCards({
  actions,
  onSelect,
}: {
  actions: RecommendedAction[];
  onSelect: (actionId: string) => void;
}) {
  if (actions.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-gray-50/50 p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-gray-500" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-gray-950">
              Aucune recommandation cette semaine
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Revenez après de nouveaux diagnostics pour générer des actions prioritaires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {actions.map((a) => {
        const s = dimensionStyle(a.dimension_key);
        return (
          <div key={a.id} className={cn("rounded-3xl border p-6", s.border, s.bg)}>
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", s.dot)} aria-hidden />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700">{a.title}</h3>
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", s.badge)}>
                    {a.dimension_key}
                  </span>
                </div>
                {a.description && <p className="mt-3 text-sm text-gray-600">{a.description}</p>}
              </div>

              <div className="text-right">
                <div className="text-4xl font-black tracking-tight text-gray-950">{a.target_count}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-gray-500">collaborateurs</div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelect(a.id)}
                className="inline-flex items-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-900"
              >
                Voir la proposition <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
              <p className="text-xs text-gray-500">Accès experts uniquement via ce tunnel.</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

