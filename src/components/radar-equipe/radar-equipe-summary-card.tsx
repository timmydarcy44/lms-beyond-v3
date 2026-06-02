"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function RadarEquipeSummaryCard() {
  const [insight, setInsight] = useState<string | null>(null);
  const [insuffisant, setInsuffisant] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const eqRes = await fetch("/api/radar-equipe/equipes");
        const eqJson = (await eqRes.json()) as { equipes?: { id: string }[] };
        const id = eqJson.equipes?.[0]?.id;
        if (!id) return;
        const res = await fetch(`/api/radar-equipe/${id}`);
        const json = (await res.json()) as {
          aggregat?: { insight_principal?: string; insuffisant?: boolean; periode_fin?: string };
        };
        if (json.aggregat?.insuffisant) {
          setInsuffisant(true);
          setInsight("Données insuffisantes — minimum 5 diagnostics");
        } else {
          setInsight(json.aggregat?.insight_principal ?? null);
        }
      } catch {
        setInsight(null);
      }
    })();
  }, []);

  const weekLabel = format(new Date(), "d MMMM", { locale: fr });

  return (
    <Link
      href="/dashboard/entreprise/equipe-insight"
      className="group block rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-[#0b0d14] p-6 shadow-lg transition hover:border-violet-400/40"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-violet-300">
          <Brain className="h-5 w-5" />
          <span className="text-sm font-bold">Équipe Insight</span>
        </div>
        <span className="text-xs text-white/40">Semaine du {weekLabel}</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-white/80">
        {insight ? (
          <>
            <span className="text-violet-300">💡 </span>
            {insight}
          </>
        ) : insuffisant ? (
          "Collectez plus de diagnostics pour activer le radar."
        ) : (
          "Chargement du radar équipe…"
        )}
      </p>
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-violet-300 group-hover:text-white">
        Voir le radar complet
        <ChevronRight className="ml-1 h-4 w-4" />
      </span>
    </Link>
  );
}
