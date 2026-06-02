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
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
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

export function RadarEquipeClient({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const light = variant === "light";
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [equipeId, setEquipeId] = useState<string>("");
  const [aggregat, setAggregat] = useState<EquipeAggregat | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEquipes = useCallback(async () => {
    const res = await fetch("/api/radar-equipe/equipes");
    const json = (await res.json()) as { equipes?: EquipeOption[]; error?: string };
    if (!res.ok) throw new Error(json.error ?? "Erreur");
    const list = json.equipes ?? [];
    setEquipes(list);
    if (list[0]?.id) setEquipeId((prev) => prev || list[0].id);
    else setEquipeId("");
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
      setLoadError(null);
      try {
        await loadEquipes();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Chargement impossible";
        setLoadError(msg);
        toast.error(msg);
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

  const insuffisant = aggregat?.insuffisant ?? true;
  const diagCompleted = aggregat?.nb_diagnostics_completes ?? 0;
  const diagThreshold = 5;
  const diagPct = Math.min(100, Math.round((diagCompleted / diagThreshold) * 100));
  const weekLabel = aggregat?.periode_fin
    ? format(new Date(aggregat.periode_fin), "d MMMM yyyy", { locale: fr })
    : format(new Date(), "d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-8">
      <header className={cn("flex flex-wrap items-start justify-between gap-4", light && "flex-col items-center text-center")}>
        <div>
          <div className={cn("flex items-center gap-2", light ? "text-violet-600" : "text-violet-300")}>
            <Brain className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-widest">Beyond RH</span>
          </div>
          <h1
            className={cn(
              "mt-1",
              light ? ENTREPRISE_H1_CLASS : "text-[28px] font-extrabold tracking-tight text-white",
            )}
          >
            🔍 Équipe Insight
          </h1>
          <p className={cn("mt-1 text-sm", light ? "text-center text-gray-400" : "text-white/60")}>
            Semaine du {weekLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {equipes.length > 1 ? (
            <Select value={equipeId} onValueChange={setEquipeId}>
              <SelectTrigger
                className={cn(
                  "w-[200px]",
                  light ? "border-gray-200 bg-white text-gray-900" : "border-white/15 bg-white/5 text-white",
                )}
              >
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
            className={
              light
                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "border-white/15 bg-white/5 text-white hover:bg-white/10"
            }
            disabled={computing || !equipeId}
            onClick={() => void refresh()}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", computing && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </header>

      {loading ? (
        <div
          className={cn(
            "h-48 animate-pulse rounded-2xl",
            light ? "bg-gray-100" : "bg-white/5",
          )}
        />
      ) : loadError ? (
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            light ? "border-gray-100 bg-gray-50" : "border-red-500/25 bg-red-500/10",
          )}
        >
          <p className={cn("text-lg font-semibold", light ? "text-gray-900" : "text-red-100")}>
            Chargement en cours…
          </p>
          <p className={cn("mt-2 text-sm", light ? "text-gray-500" : "text-red-100/70")}>
            {loadError}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void loadEquipes()}>
            Réessayer
          </Button>
        </div>
      ) : equipes.length === 0 || insuffisant || !aggregat ? (
        <div
          className={cn(
            "rounded-2xl border p-8 shadow-sm",
            light
              ? "border-gray-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
              : "border-amber-500/25 bg-amber-500/10",
          )}
        >
          <p className="text-2xl" aria-hidden>
            📊
          </p>
          <p className={cn("mt-3 text-lg font-bold", light ? "text-gray-900" : "text-amber-100")}>
            Données insuffisantes
          </p>
          <p className={cn("mt-2 text-sm", light ? "text-gray-500" : "text-amber-100/70")}>
            L&apos;Équipe Insight s&apos;active à partir de {diagThreshold} diagnostics complétés.
          </p>
          <p className={cn("mt-4 text-sm font-semibold", light ? "text-gray-700" : "text-amber-100")}>
            {diagCompleted} / {diagThreshold} diagnostics effectués
          </p>
          <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-violet-500 transition-all"
              style={{ width: `${diagPct}%` }}
            />
          </div>
          <p className={cn("mt-1 text-xs", light ? "text-gray-400" : "text-amber-100/60")}>
            {diagPct}%
          </p>
          <Button className="mt-6 bg-violet-600 hover:bg-violet-500" asChild>
            <Link href="/dashboard/entreprise/salaries">Inviter mes collaborateurs →</Link>
          </Button>
          <p className={cn("mt-6 text-xs", light ? "text-gray-400" : "text-white/50")}>
            ℹ️ Données agrégées et anonymisées — Conforme RGPD
          </p>
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
                <Link href="/dashboard/entreprise/marketplace" className="text-violet-300 underline">
                  Accéder à la marketplace BCT →
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
