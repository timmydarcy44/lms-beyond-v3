"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type ReportRow = {
  id: string;
  target_label: string | null;
  status: string | null;
  created_at: string | null;
  updated_at?: string | null;
  initial_score: number | null;
  final_score: number | null;
  completion_notes?: string | null;
  impact_category?: string | null;
  expert:
    | {
        first_name: string | null;
        last_name: string | null;
        certification_status: string | null;
      }
    | null;
};

function fmt(dateIso: string | null | undefined) {
  if (!dateIso) return "—";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMMM yyyy", { locale: fr });
}

function clampScore(score: number | null, fallback: number) {
  const v = typeof score === "number" && Number.isFinite(score) ? score : fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function impactCategory(row: Pick<ReportRow, "impact_category">) {
  const v = row?.impact_category;
  if (typeof v === "string" && v.trim()) return v.trim();
  return "Cohésion & Alignement";
}

function interpretation(delta: number, category: string) {
  if (delta > 10) return `Amélioration significative observée sur la dimension “${category}”.`;
  if (delta > 5) return "Progression modérée observée : la dynamique est relancée, à stabiliser dans le temps.";
  return "Stabilisation nécessaire : recommandations de consolidation et re-mesure conseillées.";
}

export default function ActionImpactReportPage() {
  const supabase = useSupabase();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<ReportRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // Attempt 1: include updated_at if schema supports it.
        try {
          const { data, error } = await supabase
            .from("action_requests")
            .select(
              "id,target_label,status,created_at,updated_at,initial_score,final_score,impact_category,completion_notes,expert:experts(first_name,last_name,certification_status)",
            )
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          if (!cancelled) setRow((data ?? null) as ReportRow | null);
        } catch {
          const { data, error } = await supabase
            .from("action_requests")
            .select(
              "id,target_label,status,created_at,initial_score,final_score,impact_category,completion_notes,expert:experts(first_name,last_name,certification_status)",
            )
            .eq("id", id)
            .maybeSingle();
          if (error) throw error;
          if (!cancelled) setRow((data ?? null) as ReportRow | null);
        }
      } catch {
        if (!cancelled) {
          setRow(null);
          setError("Impossible de générer le rapport.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, supabase]);

  useEffect(() => {
    if (!loading && row && !error) {
      // Print on load (open in new tab)
      window.setTimeout(() => window.print(), 50);
    }
  }, [error, loading, row]);

  const companyName = "Beyond Demo Entreprise";

  const expertName = useMemo(() => {
    const full = `${row?.expert?.first_name ?? ""} ${row?.expert?.last_name ?? ""}`.trim();
    return full || "Expert Beyond";
  }, [row]);

  const certified = row?.expert?.certification_status === "certified";
  const completionNotes = row?.completion_notes ?? "";

  const initial = clampScore(row?.initial_score ?? null, 62);
  const final = row?.final_score === null || row?.final_score === undefined ? null : clampScore(row.final_score, initial);
  const delta = final === null ? null : final - initial;
  const cat = impactCategory(row ?? { impact_category: null });

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print border-b border-gray-200 bg-gray-50 px-6 py-4 text-sm text-gray-700">
        Rapport prêt. La fenêtre d’impression s’ouvre automatiquement.
      </div>

      <main className="mx-auto max-w-4xl px-8 py-10">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        ) : loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">Génération du rapport…</div>
        ) : !row ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">Intervention introuvable.</div>
        ) : (
          <>
            {/* Header */}
            <header className="flex items-start justify-between gap-6 border-b border-gray-200 pb-6">
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Beyond</div>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Rapport d'Impact RH</h1>
                <p className="mt-2 text-sm text-gray-600">{companyName}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="font-semibold text-gray-900">Réf : {row.id}</div>
                <div className="mt-1">Généré le {fmt(new Date().toISOString())}</div>
              </div>
            </header>

            {/* Section 1 */}
            <section className="mt-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">1. Le Contexte</h2>
              <div className="mt-4 grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Cible</div>
                  <div className="mt-2 text-lg font-extrabold text-gray-950">{row.target_label ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Période</div>
                  <div className="mt-2 text-sm text-gray-700">
                    {fmt(row.created_at)} au {fmt((row as any).updated_at ?? row.created_at)}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Problématique initiale</div>
                  <div className="mt-2 text-sm text-gray-700">{cat}</div>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mt-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">2. L'Expertise</h2>
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    <span className="font-extrabold text-gray-950">Expert :</span> {expertName}
                    {certified ? <span className="ml-2 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">Certifié Beyond</span> : null}
                  </div>
                  <div className="text-xs text-gray-500">Statut : {row.status ?? "—"}</div>
                </div>
                <div className="mt-5 rounded-xl bg-gray-50 p-5">
                  <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Synthèse expert</div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-gray-800">
                    {completionNotes || "—"}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mt-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">3. La Preuve</h2>
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Progression</div>
                    <div className="mt-2 text-2xl font-extrabold tracking-tight text-gray-950">
                      Départ : {initial}%{" "}
                      <span className="text-gray-300">|</span>{" "}
                      Final : {final === null ? "—" : `${final}%`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Delta</div>
                    <div className="mt-2 text-3xl font-black text-emerald-700">
                      {delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta}%`}
                    </div>
                  </div>
                </div>

                <div className="mt-6 h-4 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-orange-400" style={{ width: `${initial}%` }} aria-hidden />
                  {final !== null ? (
                    <div className="-mt-4 h-full bg-emerald-500" style={{ width: `${final}%` }} aria-hidden />
                  ) : null}
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mt-8">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">4. Interprétation</h2>
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-800">
                {delta === null ? (
                  <>
                    Mesure finale en attente. Une réévaluation a été déclenchée afin de consolider la preuve d’impact.
                  </>
                ) : (
                  <>{interpretation(delta, cat)}</>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

