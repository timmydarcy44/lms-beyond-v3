"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Brain, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscRadarChart } from "@/components/radar-equipe/disc-radar-chart";
import { GaugeMetric } from "@/components/radar-equipe/gauge-metric";
import { RgpdBanner } from "@/components/radar-equipe/rgpd-banner";
import { SignauxFaibles } from "@/components/radar-equipe/signaux-faibles";
import type { EquipeAggregat } from "@/lib/radar-equipe/types";
import { cn } from "@/lib/utils";

type EquipeOption = { id: string; name: string };

function gapLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function stressTone(signal: string | null): "emerald" | "amber" | "rose" {
  if (signal === "faible" || signal === "modere") return "emerald";
  if (signal === "eleve") return "amber";
  return "rose";
}

export function RadarEquipeClient() {
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [equipeId, setEquipeId] = useState<string>("");
  const [aggregat, setAggregat] = useState<EquipeAggregat | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);

  const loadEquipes = useCallback(async () => {
    const res = await fetch("/api/radar-equipe/equipes");
    const json = (await res.json()) as { equipes?: EquipeOption[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Erreur");
    const list = json.equipes ?? [];
    setEquipes(list);
    if (list[0]?.id) setEquipeId((prev) => prev || list[0].id);
  }, []);

  const loadAggregat = useCallback(async (id: string) => {
    if (!id) return;
    const res = await fetch(`/api/radar-equipe/${id}`);
    const json = (await res.json()) as { aggregat?: EquipeAggregat | null; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Erreur");
    setAggregat(json.aggregat ?? null);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadEquipes();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Chargement impossible");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadEquipes]);

  useEffect(() => {
    if (!equipeId) return;
    void (async () => {
      try {
        await loadAggregat(equipeId);
      } catch {
        setAggregat(null);
      }
    })();
  }, [equipeId, loadAggregat]);

  const refresh = async () => {
    if (!equipeId) return;
    setComputing(true);
    try {
      const res = await fetch(`/api/radar-equipe/compute/${equipeId}`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Calcul impossible");
      await loadAggregat(equipeId);
      toast.success("Radar actualisé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setComputing(false);
    }
  };

  const insuffisant = aggregat?.insuffisant ?? false;
  const weekLabel = aggregat?.periode_fin
    ? format(new Date(aggregat.periode_fin), "d MMMM yyyy", { locale: fr })
    : format(new Date(), "d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Brain className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Beyond RH</span>
          </div>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight">Radar Équipe</h1>
          <p className="mt-1 text-sm text-white/60">Semaine du {weekLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {equipes.length > 1 ? (
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger className="w-[200px] border-white/15 bg-white/5 text-white">
                <SelectValue placeholder="Choisir équipe" />
              </SelectTrigger>
              <SelectContent>
                {equipes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            disabled={computing || !equipeId}
            onClick={() => void refresh()}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", computing && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
      ) : insuffisant || !aggregat ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-8 text-center">
          <p className="text-lg font-semibold text-amber-100">
            Données insuffisantes pour protéger l&apos;anonymat
          </p>
          <p className="mt-2 text-sm text-amber-100/70">
            Minimum 5 collaborateurs avec diagnostic complété requis (
            {aggregat?.nb_diagnostics_completes ?? 0} / 5).
          </p>
          <Button className="mt-6" onClick={() => void refresh()} disabled={computing}>
            Lancer le calcul
          </Button>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 to-indigo-950/30 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-violet-300">
              Insight du moment
            </p>
            <p className="mt-3 text-lg font-medium leading-relaxed text-white">
              {aggregat.insight_principal ?? "Analyse en cours…"}
            </p>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
                État cognitif de l&apos;équipe
              </h2>
              <div className="mt-4 space-y-3">
                <GaugeMetric
                  label="IDMC moyen"
                  value={aggregat.idmc_moyen}
                  tone="violet"
                  sublabel={aggregat.idmc_zone ?? undefined}
                />
                <GaugeMetric
                  label="Stress moyen"
                  value={aggregat.stress_moyen}
                  tone={stressTone(aggregat.stress_signal)}
                  sublabel={aggregat.stress_signal ?? undefined}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
                Dynamique d&apos;équipe
              </h2>
              <DiscRadarChart
                className="mt-2"
                d={aggregat.disc_d_pct ?? 0}
                i={aggregat.disc_i_pct ?? 0}
                s={aggregat.disc_s_pct ?? 0}
                c={aggregat.disc_c_pct ?? 0}
              />
              <GaugeMetric
                label="Cohésion"
                value={aggregat.cohesion_score}
                tone="emerald"
                sublabel={aggregat.profil_manquant ?? undefined}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 lg:col-span-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
                Signaux faibles
              </h2>
              <SignauxFaibles
                className="mt-4"
                nbAttention={aggregat.nb_signaux_attention ?? 0}
                nbCritique={aggregat.nb_signaux_critique ?? 0}
                nbDiagnostics={aggregat.nb_diagnostics_completes}
              />
              <Link
                href="/dashboard/entreprise/actions"
                className="mt-4 inline-flex items-center text-sm font-semibold text-violet-300 hover:text-white"
              >
                Voir recommandations
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Gaps de compétences collectifs
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(aggregat.gaps_competences ?? []).length === 0 ? (
                <p className="text-sm text-white/50">Aucun gap dominant identifié.</p>
              ) : (
                (aggregat.gaps_competences ?? []).map((g) => (
                  <div
                    key={g}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <p className="font-semibold text-white">{gapLabel(g)}</p>
                    <p className="mt-1 text-xs text-white/50">
                      Signal collectif — {aggregat.nb_diagnostics_completes} profils agrégés
                    </p>
                    <Link
                      href="/catalog"
                      className="mt-3 inline-block text-xs font-semibold text-violet-300 hover:text-white"
                    >
                      Voir module →
                    </Link>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Signaux comportementaux LMS (7 derniers jours)
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <GaugeMetric
                label="Taux complétion moyen"
                value={aggregat.taux_completion_moyen}
                suffix="%"
                tone="emerald"
              />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Connexions hors horaires
                </p>
                <p className="mt-2 text-2xl font-bold text-amber-200">
                  {aggregat.connexions_hors_horaires ?? 0}
                  {(aggregat.connexions_hors_horaires ?? 0) > 0 ? " ⚠️" : ""}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Abandons en cours
                </p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {aggregat.nb_abandons_semaine ?? 0}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-white/70">
              Actions recommandées
            </h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/85">
              <li>Atelier collectif « Gestion des priorités » (Beyond)</li>
              <li>Modules individuels sur les gaps identifiés</li>
              <li>
                <Link href="/dashboard/entreprise/experts" className="text-violet-300 underline">
                  Accéder à un expert BCT →{" "}
                  <a href="/dashboard/entreprise/marketplace" className="underline">
                    Marketplace
                  </a>
                </Link>
              </li>
            </ol>
          </section>
        </>
      )}

      <RgpdBanner />
    </div>
  );
}
