"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

type RadarEmployeeCard = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  idmc_score: number | null;
  dimensions: Record<string, unknown> | null;
};

const idmcBadge = (score: number) =>
  score >= 80 ? "bg-emerald-400/20 text-emerald-200" : score >= 60 ? "bg-amber-400/20 text-amber-200" : "bg-rose-500/20 text-rose-200";

function initials(firstName: string | null, lastName: string | null) {
  const a = (firstName?.trim()[0] ?? "").toUpperCase();
  const b = (lastName?.trim()[0] ?? "").toUpperCase();
  const value = `${a}${b}` || "BC";
  return value.slice(0, 2);
}

function AvatarInitials({ firstName, lastName }: { firstName: string | null; lastName: string | null }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-extrabold text-white/90 ring-1 ring-white/10">
      {initials(firstName, lastName)}
    </div>
  );
}

function getDimNumber(dimensions: Record<string, unknown> | null, key: string) {
  const v = dimensions?.[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function dimLabel(key: string) {
  const k = key.toLowerCase();
  if (k.includes("stress")) return "Stress";
  if (k.includes("orga")) return "Organisation";
  if (k.includes("comm")) return "Communication";
  if (k.includes("decis")) return "Décision";
  if (k.includes("leader")) return "Leadership";
  return key;
}

function buildTags(dimensions: Record<string, unknown> | null) {
  const keys = ["stress", "organisation", "communication", "decision", "leadership"];
  const list = keys
    .map((k) => ({ k, v: getDimNumber(dimensions, k) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .map((x) => `${dimLabel(x.k)} ${Math.round(x.v)}%`);
  return list.length > 0 ? list : ["Dimensions en cours", "Données à compléter", "Beyond IA"];
}

function BeyondIaBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#050505]" />
      <div className="absolute -bottom-56 -left-56 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.35),rgba(99,102,241,0.15),rgba(2,6,23,0)_60%)] blur-2xl" />
      <div className="absolute -top-56 -right-56 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),rgba(2,6,23,0)_62%)] blur-2xl" />
    </div>
  );
}

export default function EquipeRadarPage() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<RadarEmployeeCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: qErr } = await supabase
          .from("view_radar_interne")
          .select("id,first_name,last_name,department,idmc_score,dimensions")
          .order("idmc_score", { ascending: false })
          .limit(24);

        if (qErr) throw qErr;
        if (!cancelled) setCards((data ?? []) as RadarEmployeeCard[]);
      } catch (e) {
        if (!cancelled) {
          setCards([]);
          setError("Impossible de charger le Radar Équipe.");
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

  const shown = useMemo(() => cards.slice(0, 3), [cards]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <BeyondIaBackground />
      <EnterpriseSidebar />

      <main className="relative min-h-screen px-8 py-10 pl-[280px]">
        <div className="space-y-8">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[28px] font-extrabold tracking-[-0.5px]">Radar Équipe</h1>
              <p className="mt-1 text-[13px] text-white/60">Vue collective des signaux et de la disponibilité (IDMC)</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] text-white/70">
                Interne uniquement <Lock size={12} className="text-white/40" aria-hidden />
              </div>
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-100">
              {error}
            </div>
          )}

          <section className="grid gap-6 lg:grid-cols-3">
            {(loading ? [0, 1, 2] : shown).map((card: any, idx: number) => {
              if (loading) {
                return (
                  <div key={idx} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5 shadow-[0_12px_30px_rgba(0,0,0,0.4)]">
                    <div className="h-56 w-full bg-white/5" />
                    <div className="p-6">
                      <div className="h-5 w-40 rounded bg-white/10" />
                      <div className="mt-3 h-4 w-28 rounded bg-white/10" />
                      <div className="mt-5 h-10 w-full rounded-xl bg-white/10" />
                    </div>
                  </div>
                );
              }

              const c = card as RadarEmployeeCard;
              const stress = getDimNumber(c.dimensions, "stress");
              const glow =
                stress < 30
                  ? "shadow-[0_0_0_1px_rgba(244,63,94,0.22),0_18px_50px_rgba(244,63,94,0.18)]"
                  : "shadow-[0_12px_30px_rgba(0,0,0,0.4)]";
              const tags = buildTags(c.dimensions);
              const idmc = Math.round(c.idmc_score ?? 0);

              return (
                <div
                  key={c.id}
                  className={cn(
                    "relative overflow-hidden rounded-[24px] border border-white/10 bg-white/5",
                    glow,
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/35 to-black/70" />

                  <div className="relative z-10 flex h-full flex-col gap-4 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <AvatarInitials firstName={c.first_name} lastName={c.last_name} />
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold text-white">
                              {c.first_name ?? "—"} {c.last_name ?? ""}
                            </p>
                            <p className="mt-1 text-xs text-white/60">{c.department ?? "Département"}</p>
                          </div>
                        </div>
                      </div>
                      <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", idmcBadge(idmc))}>
                        IDMC {idmc}%
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <Link
                        href={`/dashboard/entreprise/salaries/${c.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-white/90"
                      >
                        Voir la fiche Insight
                      </Link>
                      <span className="text-[11px] text-white/50">Beyond IA</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}

