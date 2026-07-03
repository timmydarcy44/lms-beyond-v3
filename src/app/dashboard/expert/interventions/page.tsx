"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
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
      <span className="inline-flex items-center gap-2 rounded-full border border-[#635BFF]/20 bg-[#635BFF]/10 px-3 py-1.5 text-xs font-bold text-[#a8a3ff]">
        <span className="h-2 w-2 rounded-full bg-[#635BFF]" aria-hidden />
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
  const { isApproved } = useExpertAccess();

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
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-6xl px-6 py-10 pb-24">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Missions</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Interventions</h1>
            <p className="mt-3 text-sm text-[#050505]/55">Vos missions activées par les entreprises partenaires EDGE.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#635BFF]/20 bg-[#635BFF]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#635BFF]">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Réseau EDGE
            </span>
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-[#050505]/8 bg-white shadow-sm">
          <div className="border-b border-[#050505]/8 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#050505]/40">Liste</p>
            <p className="mt-1 text-sm text-[#050505]/55">Dernières demandes et planifications.</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-20 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5]" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-6 text-sm text-[#050505]/55">
                Aucune intervention pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {rows.map((it) => {
                  const clientName =
                    (typeof it?.metadata?.client_name === "string" && it.metadata.client_name) ||
                    (typeof it?.metadata?.organization_name === "string" && it.metadata.organization_name) ||
                    "Entreprise partenaire";
                  const logoLetter = clientName.trim()[0]?.toUpperCase() ?? "E";
                  const formatLabel = it.action_type === "group_workshop" ? "Atelier collectif" : it.action_type ?? "—";
                  const scheduledFor = it?.metadata?.scheduled_for as string | undefined;
                  return (
                    <div
                      key={it.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] p-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#635BFF]/20 bg-[#635BFF]/10 text-sm font-semibold text-[#635BFF]">
                          {logoLetter}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold tracking-tight text-[#050505]">
                            {it.target_label ?? "Cible"}{" "}
                            <span className="text-[#050505]/35">·</span>{" "}
                            <span className="text-[#050505]/55">{clientName}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#050505]/45">
                            <span className="inline-flex items-center gap-2">
                              <Sparkles className="h-3.5 w-3.5 text-[#635BFF]" aria-hidden />
                              {formatLabel}
                            </span>
                            <span className="text-[#050505]/25">•</span>
                            <span>{formatRelative(it.created_at)}</span>
                            {scheduledFor ? (
                              <>
                                <span className="text-[#050505]/25">•</span>
                                <span className="inline-flex items-center gap-2">
                                  <CalendarDays className="h-3.5 w-3.5 text-[#635BFF]" aria-hidden />
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
                            "rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition",
                            "bg-[#635BFF] text-white hover:bg-[#7B74FF]",
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
        </div>
      </main>
    </div>
  );
}

