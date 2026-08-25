"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { formatGap, formatScoreOn15 } from "@/lib/entreprise/metier-skill-gaps";
import { cn } from "@/lib/utils";

type NeedRow = {
  id: string;
  skill: string;
  metier_id: string;
  metier_title: string;
  department: string | null;
  target: number;
  avg_observed: number;
  avg_gap: number;
  evaluated_count: number;
  under_target_count: number;
  under_target_pct: number;
  scope_label: string;
  scope: string;
  representative: boolean;
  insufficient_reason: string | null;
  priority_score: number;
};

type MetierGroup = {
  metier_id: string;
  metier_title: string;
  department: string | null;
  needs: NeedRow[];
  priority_score: number;
  people_under: number;
  worst_gap: number;
};

type Payload = {
  needs_with_actions?: NeedRow[];
  priority_needs?: NeedRow[];
  stats?: {
    employees_total: number;
    employees_with_scores: number;
    needs_count: number;
  };
  demo_enriched?: boolean;
  error?: string;
};

const METIER_IMAGES = [
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
  "/edge-lab/cover_management.png",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "/edge-lab/cover_analyse_comportementale.png",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
  "/edge-lab/programme-ia.png",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
] as const;

function metierImage(title: string, index: number) {
  const hash = title.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return METIER_IMAGES[(hash + index) % METIER_IMAGES.length]!;
}

function groupByMetier(needs: NeedRow[]): MetierGroup[] {
  const map = new Map<string, MetierGroup>();
  for (const need of needs) {
    const key = need.metier_id || need.metier_title;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        metier_id: need.metier_id || key,
        metier_title: need.metier_title,
        department: need.department,
        needs: [need],
        priority_score: need.priority_score,
        people_under: need.under_target_count,
        worst_gap: need.avg_gap,
      });
    } else {
      existing.needs.push(need);
      existing.priority_score = Math.max(existing.priority_score, need.priority_score);
      existing.people_under = Math.max(existing.people_under, need.under_target_count);
      existing.worst_gap = Math.min(existing.worst_gap, need.avg_gap);
    }
  }
  return [...map.values()]
    .map((g) => ({
      ...g,
      needs: [...g.needs].sort((a, b) => a.avg_gap - b.avg_gap || b.priority_score - a.priority_score),
    }))
    .sort((a, b) => b.priority_score - a.priority_score);
}

export default function BesoinsCompetencesPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"priority" | "all">("priority");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/entreprise/besoins-competences");
        const text = await res.text();
        const json = text ? (JSON.parse(text) as Payload) : {};
        if (!res.ok) throw new Error((json as Payload).error || "Chargement impossible");
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    if (filter === "priority") {
      const ids = new Set((data.priority_needs ?? []).map((n) => n.id));
      return (data.needs_with_actions ?? []).filter((n) => ids.has(n.id));
    }
    return data.needs_with_actions ?? [];
  }, [data, filter]);

  const metiers = useMemo(() => groupByMetier(rows), [rows]);

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] text-gray-900">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <div className="mb-8">
          <h1 className={ENTREPRISE_H1_CLASS}>Besoins en compétences</h1>
          <p className="mt-2 text-center text-sm text-gray-500 sm:text-left">
            Par métier / poste · écarts Soft Skills (/15) vs cibles attendues
            {data?.demo_enriched ? " · Données démo" : ""}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Analyse des écarts…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {[
                {
                  label: "Collaborateurs",
                  value: String(data?.stats?.employees_total ?? 0),
                  hint: `${data?.stats?.employees_with_scores ?? 0} Soft Skills`,
                },
                {
                  label: "Métiers concernés",
                  value: String(metiers.length),
                  hint: `${data?.stats?.needs_count ?? 0} écarts skill`,
                },
                { label: "Échelle", value: "/15", hint: "Test Soft Skills" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-[22px] bg-white px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    {kpi.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{kpi.hint}</p>
                </div>
              ))}
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilter("priority")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  filter === "priority"
                    ? "bg-gray-950 text-white"
                    : "bg-white text-gray-700 shadow-sm",
                )}
              >
                Prioritaires
              </button>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition",
                  filter === "all"
                    ? "bg-gray-950 text-white"
                    : "bg-white text-gray-700 shadow-sm",
                )}
              >
                Tous les métiers
              </button>
            </div>

            {metiers.length === 0 ? (
              <div className="rounded-[28px] bg-white p-10 text-center shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <p className="font-semibold text-gray-900">Aucun écart sous cible</p>
                <p className="mt-2 text-sm text-gray-500">
                  Vérifiez les cibles Soft Skills des métiers et les diagnostics collaborateurs.
                </p>
                <Link
                  href="/dashboard/entreprise/metiers"
                  className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:underline"
                >
                  Gérer les métiers
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {metiers.map((metier, index) => {
                  const topSkills = metier.needs.slice(0, 3);
                  return (
                    <Link
                      key={metier.metier_id}
                      href={`/dashboard/entreprise/besoins-competences/metier/${encodeURIComponent(metier.metier_id)}`}
                      className="group relative block aspect-[4/5] overflow-hidden rounded-[28px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition duration-400 ease-out hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(0,0,0,0.18)]"
                    >
                      <Image
                        src={metierImage(metier.metier_title, index)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
                      <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          {metier.needs.length} compétence
                          {metier.needs.length > 1 ? "s" : ""} à renforcer
                        </span>
                        <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                          Écart {formatGap(metier.worst_gap)}
                        </span>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                          Métier / poste
                          {metier.department ? ` · ${metier.department}` : ""}
                        </p>
                        <h2 className="mt-1.5 text-[24px] font-semibold leading-tight tracking-tight text-white [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                          {metier.metier_title}
                        </h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {topSkills.map((need) => (
                            <span
                              key={need.id}
                              className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm"
                            >
                              {need.skill} · {formatScoreOn15(need.avg_observed)}
                            </span>
                          ))}
                          {metier.needs.length > 3 ? (
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80">
                              +{metier.needs.length - 3}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-4 text-[13px] font-semibold text-white">
                          Voir les écarts →
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
