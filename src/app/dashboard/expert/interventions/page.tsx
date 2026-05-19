"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import SidebarExpert from "@/components/SidebarExpert";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ShieldCheck, Sparkles } from "lucide-react";

type ActionRequestRow = {
  id: string;
  action_type: string | null;
  target_label: string | null;
  target_count: number | null;
  status: string | null;
  created_at: string | null;
  metadata: any;
};

function formatRelative(dateIso: string | null) {
  if (!dateIso) return "date inconnue";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "date inconnue";
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "unknown";
  if (s === "expert_notified") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1.5 text-xs font-bold text-sky-100/90">
        <span className="h-2 w-2 animate-pulse rounded-full bg-sky-400" aria-hidden />
        Nouveau
      </span>
    );
  }
  if (s === "scheduled") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-100/90">
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        Planifié
      </span>
    );
  }
  if (s === "accepted") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-100/90">
        <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
        Accepté
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
      <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />
      {s}
    </span>
  );
}

export default function ExpertInterventionsPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [expertId, setExpertId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ActionRequestRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        const user = userData.user;
        const id = user?.id ?? null;
        if (!id) throw new Error("not_authenticated");
        if (!cancelled) setExpertId(id);

        const { data, error } = await supabase
          .from("action_requests")
          .select("id,action_type,target_label,target_count,status,created_at,metadata")
          .eq("expert_id", id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        if (!cancelled) setItems((data ?? []) as ActionRequestRow[]);
      } catch {
        if (!cancelled) {
          setItems([]);
          setError("Impossible de charger vos interventions (connexion requise).");
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
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.22),rgba(99,102,241,0.10),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <SidebarExpert />
      <main className="relative mx-auto max-w-6xl px-6 py-10 pb-24 pl-[280px]">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Espace Expert</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Interventions</h1>
            <p className="mt-3 text-sm text-white/70">Vos missions activées par les équipes RH Beyond.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-100/90">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Ops
            </span>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_22px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-white/5 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Missions</div>
            <div className="mt-1 text-sm font-semibold text-white/80">Dernières demandes et planifications.</div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-20 rounded-2xl border border-white/10 bg-white/5" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/75">
                Aucune intervention pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((it) => {
                  const clientName = "Beyond Demo";
                  const logoLetter = "B";
                  const formatLabel = it.action_type === "group_workshop" ? "Atelier collectif" : it.action_type ?? "—";
                  const scheduledFor = it?.metadata?.scheduled_for as string | undefined;
                  return (
                    <div
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-sm font-extrabold text-emerald-100/90">
                          {logoLetter}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold tracking-tight text-white">
                            {it.target_label ?? "Cible"}{" "}
                            <span className="text-white/45">·</span>{" "}
                            <span className="text-white/70">{clientName}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-white/50" aria-hidden />
                              {formatLabel}
                            </span>
                            <span className="text-white/35">•</span>
                            <span>{formatRelative(it.created_at)}</span>
                            {scheduledFor ? (
                              <>
                                <span className="text-white/35">•</span>
                                <span className="inline-flex items-center gap-2">
                                  <CalendarDays className="h-3.5 w-3.5 text-white/50" aria-hidden />
                                  {scheduledFor}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={it.status} />
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/expert/interventions/${encodeURIComponent(it.id)}`)}
                          className={cn(
                            "rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition",
                            "bg-white text-black hover:bg-white/90",
                          )}
                        >
                          Gérer l'intervention
                        </button>
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

