"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type ActionRequestRow = {
  id: string;
  action_type: string | null;
  target_label: string | null;
  target_count: number | null;
  status: string | null;
  created_at: string | null;
  expert:
    | {
        first_name: string | null;
        last_name: string | null;
        certification_status: string | null;
      }
    | null;
};

function formatRelativeDate(dateIso: string | null) {
  if (!dateIso) return "date inconnue";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "date inconnue";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

function expertName(expert: ActionRequestRow["expert"]) {
  const full = `${expert?.first_name ?? ""} ${expert?.last_name ?? ""}`.trim();
  return full || "Expert Beyond";
}

export default function EnterpriseActionsHistoryPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ActionRequestRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select(
            "id,action_type,target_label,target_count,status,created_at,expert:experts(first_name,last_name,certification_status)",
          )
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        if (!cancelled) setItems((data ?? []) as ActionRequestRow[]);
      } catch {
        if (!cancelled) {
          setItems([]);
          setError("Impossible de charger l'historique des interventions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900">
      <EnterpriseSidebar />
      <main className="relative z-10 flex-1 px-8 py-10 pl-[280px]">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-gray-500">Pilotage</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-950">Historique des interventions</h1>
            <p className="mt-2 text-sm text-gray-500">Toutes les actions validées et leur statut.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard/entreprise")}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            ← Retour au dashboard
          </button>
        </header>

        {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Action requests</div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-14 rounded-2xl border border-gray-200 bg-gray-50" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
                Aucune intervention enregistrée.
              </div>
            ) : (
              <div className="space-y-3">
                {rows.map((it) => {
                  const isGroup = it.action_type === "group_workshop";
                  const status = it.status ?? "unknown";
                  const isNotified = status === "expert_notified";
                  const isScheduled = status === "scheduled";
                  const certified = it.expert?.certification_status === "certified";
                  return (
                    <div
                      key={it.id}
                      className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
                        <span className="text-lg" aria-hidden>
                          {isGroup ? "👥" : "👤"}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold tracking-tight text-gray-950">
                          {it.target_label ?? "Cible"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                          <span>
                            Expert : {expertName(it.expert)} • {formatRelativeDate(it.created_at)}
                          </span>
                          {certified ? (
                            <>
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-700">
                                Certifié Beyond
                              </span>
                              <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-700">
                                Méthode Beyond validée (A|P|I)
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="ml-auto">
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/entreprise/actions/${encodeURIComponent(it.id)}`)}
                          className="mr-3 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-50"
                        >
                          Voir
                        </button>
                        {isNotified ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" aria-hidden />
                            Expert notifié
                          </span>
                        ) : isScheduled ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                            Planifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700">
                            <span className="h-2 w-2 rounded-full bg-gray-400" aria-hidden />
                            {status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

