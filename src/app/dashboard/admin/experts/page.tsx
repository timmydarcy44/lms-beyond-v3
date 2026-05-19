"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type CertificationStatus = "none" | "training" | "certified";

type ExpertRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  certification_status: CertificationStatus | null;
};

function fullName(e: ExpertRow) {
  const name = `${e.first_name ?? ""} ${e.last_name ?? ""}`.trim();
  return name || "Expert Beyond";
}

function StatusBadge({ status }: { status: CertificationStatus }) {
  if (status === "certified") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/15 px-3 py-1.5 text-xs font-bold text-violet-100">
        <span className="h-2 w-2 rounded-full bg-violet-400" aria-hidden />
        Certifié Beyond
      </span>
    );
  }
  if (status === "training") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-100">
        <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
        En cours
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70">
      <span className="h-2 w-2 rounded-full bg-white/30" aria-hidden />
      Non certifié
    </span>
  );
}

export default function AdminExpertsPage() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ExpertRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [certifyingId, setCertifyingId] = useState<string | null>(null);
  const [modules, setModules] = useState<Record<string, { analyse: boolean; posture: boolean; impact: boolean }>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("experts")
          .select("id,first_name,last_name,headline,certification_status")
          .order("last_name", { ascending: true })
          .limit(100);
        if (error) throw error;
        if (!cancelled) setItems((data ?? []) as ExpertRow[]);
      } catch {
        if (!cancelled) {
          setItems([]);
          setError("Impossible de charger la liste des experts.");
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

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("admin_expert_modules_v1");
      if (raw) setModules(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("admin_expert_modules_v1", JSON.stringify(modules));
    } catch {
      // ignore
    }
  }, [modules]);

  const rows = useMemo(
    () =>
      items.map((e) => ({
        ...e,
        certification_status: (e.certification_status ?? "none") as CertificationStatus,
      })),
    [items],
  );

  const handleCertify = async (id: string) => {
    if (certifyingId) return;
    setCertifyingId(id);
    try {
      const { error } = await supabase.from("experts").update({ certification_status: "certified" }).eq("id", id);
      if (error) throw error;
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, certification_status: "certified" } : e)));
      toast.success("Expert certifié avec succès. Le badge est désormais visible côté RH.");
    } catch {
      toast.error("Impossible de certifier cet expert.");
    } finally {
      setCertifyingId(null);
    }
  };

  const applyModuleAndMaybeCertify = async (
    expert: ExpertRow,
    key: "analyse" | "posture" | "impact",
    value: boolean,
  ) => {
    const current = modules[expert.id] ?? { analyse: false, posture: false, impact: false };
    const next = { ...current, [key]: value };
    setModules((prev) => ({ ...prev, [expert.id]: next }));

    const all = next.analyse && next.posture && next.impact;
    if (!all) return;
    if ((expert.certification_status ?? "none") === "certified") return;

    if (certifyingId) return;
    setCertifyingId(expert.id);
    try {
      // Best-effort: update both fields. If schema doesn't have is_certified_beyond, fall back.
      const first = await supabase
        .from("experts")
        .update({ certification_status: "certified", is_certified_beyond: true })
        .eq("id", expert.id);
      if (first.error) {
        const second = await supabase.from("experts").update({ certification_status: "certified" }).eq("id", expert.id);
        if (second.error) throw second.error;
      }
      setItems((prev) => prev.map((e) => (e.id === expert.id ? { ...e, certification_status: "certified" } : e)));
      toast.success("Expert certifié avec succès. Le badge est désormais visible côté RH.");
    } catch {
      toast.error("Impossible de certifier cet expert.");
    } finally {
      setCertifyingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#05060a]" />
        <div className="absolute -bottom-64 -left-64 h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.30),rgba(99,102,241,0.12),rgba(2,6,23,0)_60%)] blur-3xl" />
        <div className="absolute -top-64 -right-64 h-[680px] w-[680px] rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.14),rgba(2,6,23,0)_62%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
      </div>

      <EnterpriseSidebar />
      <main className="relative px-8 py-10 pb-24 pl-[280px]">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Admin</div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">Gestion des certifications</h1>
            <p className="mt-3 text-sm text-white/70">
              Certifiez un expert pour rendre visible le badge côté RH.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Pilotage
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100/90">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_22px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
          <div className="border-b border-white/10 bg-white/5 px-6 py-5">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Experts</div>
            <div className="mt-1 text-sm font-semibold text-white/80">Liste et statut de certification.</div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((k) => (
                  <div key={k} className="h-14 rounded-2xl border border-white/10 bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-[11px] font-black uppercase tracking-[0.22em] text-white/55">
                      <th className="px-4 py-2">Expert</th>
                      <th className="px-4 py-2">Headline</th>
                      <th className="px-4 py-2">Statut Certification</th>
                      <th className="px-4 py-2 text-center">Analyse</th>
                      <th className="px-4 py-2 text-center">Posture</th>
                      <th className="px-4 py-2 text-center">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((e) => {
                      const status = (e.certification_status ?? "none") as CertificationStatus;
                      const busy = certifyingId === e.id;
                      const m = modules[e.id] ?? { analyse: false, posture: false, impact: false };
                      return (
                        <tr key={e.id} className="rounded-2xl border border-white/10 bg-white/5">
                          <td className="px-4 py-4 align-middle">
                            <div className="text-sm font-extrabold text-white">{fullName(e)}</div>
                            <div className="mt-1 text-xs text-white/55">{e.id}</div>
                          </td>
                          <td className="px-4 py-4 align-middle text-sm text-white/70">
                            {e.headline ?? <span className="text-white/45">—</span>}
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <StatusBadge status={status} />
                          </td>
                          <td className="px-4 py-4 align-middle text-center">
                            <input
                              type="checkbox"
                              checked={m.analyse}
                              disabled={busy}
                              onChange={async (ev) => {
                                await applyModuleAndMaybeCertify(e, "analyse", ev.target.checked);
                              }}
                              className="h-4 w-4 accent-violet-400"
                              aria-label="Analyse"
                            />
                          </td>
                          <td className="px-4 py-4 align-middle text-center">
                            <input
                              type="checkbox"
                              checked={m.posture}
                              disabled={busy}
                              onChange={async (ev) => {
                                await applyModuleAndMaybeCertify(e, "posture", ev.target.checked);
                              }}
                              className="h-4 w-4 accent-violet-400"
                              aria-label="Posture"
                            />
                          </td>
                          <td className="px-4 py-4 align-middle text-center">
                            <input
                              type="checkbox"
                              checked={m.impact}
                              disabled={busy}
                              onChange={async (ev) => {
                                await applyModuleAndMaybeCertify(e, "impact", ev.target.checked);
                              }}
                              className="h-4 w-4 accent-violet-400"
                              aria-label="Impact"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

