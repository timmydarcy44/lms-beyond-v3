"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SidebarSalarie from "@/components/SidebarSalarie";
import { MicroCheckinWidget } from "@/components/radar-equipe/micro-checkin-widget";
import { ProfilPartageConsent } from "@/components/radar-equipe/profil-partage-consent";
import { Brain, Info, Sparkles, TrendingUp } from "lucide-react";

type ActionRequestRow = {
  id: string;
  action_type: string | null;
  target_label: string | null;
  status: string | null;
  created_at: string | null;
  scheduled_at: string | null;
  metadata: any;
};

function firstNameFromDisplayName(displayName: string) {
  const clean = displayName.trim();
  if (!clean) return "Vous";
  return clean.split(" ")[0] ?? clean;
}

function statusLabel(status: string | null) {
  if (status === "pending_hr_validation") return "En attente de validation RH";
  if (status === "expert_notified") return "Expert en cours de sélection";
  if (status === "scheduled") return "Session prévue";
  return status ?? "En cours";
}

function Gauge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "sky";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const color =
    tone === "emerald"
      ? "from-emerald-400/80 to-emerald-200/50"
      : tone === "amber"
        ? "from-amber-400/80 to-orange-200/50"
        : "from-sky-400/80 to-indigo-200/50";
  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
      <div className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">{clamped}%</div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full bg-gradient-to-r", color)} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const clamped = points.map((p) => Math.max(0, Math.min(100, p)));
  const w = 140;
  const h = 40;
  const step = clamped.length <= 1 ? 0 : w / (clamped.length - 1);
  const toY = (p: number) => h - (p / 100) * h;
  const d = clamped
    .map((p, i) => `${i === 0 ? "M" : "L"} ${Math.round(i * step)} ${Math.round(toY(p))}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-600" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="6" className="text-indigo-300/30" />
    </svg>
  );
}

function Stepper({ status, scheduledFor }: { status: string | null; scheduledFor?: string }) {
  const steps = ["Demande envoyée", "Validation RH", "Matching Expert", "Session planifiée"] as const;
  const idx =
    status === "scheduled"
      ? 3
      : status === "expert_notified"
        ? 2
        : status === "pending_hr_validation"
          ? 0
          : 0;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        {steps.map((s, i) => {
          const done = i <= idx;
          return (
            <div key={s} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={cn(
                  "h-2.5 w-full rounded-full",
                  done
                    ? "bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-500"
                    : "bg-white/10",
                )}
              />
              <div className="mt-2 truncate text-[11px] font-bold text-slate-400">{s}</div>
            </div>
          );
        })}
      </div>
      {status === "scheduled" && scheduledFor ? (
        <div className="mt-2 text-xs font-semibold text-slate-400">Session planifiée le {scheduledFor}</div>
      ) : null}
    </div>
  );
}

export default function SalarieDashboardPage() {
  const router = useRouter();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState("Vous");
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requests, setRequests] = useState<ActionRequestRow[]>([]);
  const [managerId, setManagerId] = useState<string | null>(null);

  // Mock visible (plein opacity) pour la section "Mon état actuel"
  const engagement = 75;
  const serenite = 40;
  const focus = 90;

  const message = useMemo(() => {
    if (serenite < 50) return "Vous semblez avoir un pic de charge, voici nos conseils...";
    if (focus < 50) return "Votre focus est en baisse : on peut le stabiliser avec des micro-rituels.";
    return "Votre dynamique est stable. Continuez avec un objectif clair cette semaine.";
  }, [focus, serenite]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = userData.user;
        if (!user) throw new Error("not_authenticated");
        if (!cancelled) setEmployeeId(user.id);

        // Best-effort: try profiles for display_name
        try {
          const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
          const dn = (profile as any)?.display_name as string | undefined;
          if (!cancelled) setEmployeeName(firstNameFromDisplayName(dn ?? user.email ?? ""));
        } catch {
          if (!cancelled) setEmployeeName(firstNameFromDisplayName(user.email ?? ""));
        }
      } catch {
        if (!cancelled) {
          setEmployeeId(null);
          setEmployeeName("Vous");
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
    void (async () => {
      try {
        const res = await fetch("/api/radar-equipe/partage");
        const json = (await res.json()) as { managerId?: string | null };
        if (json.managerId) setManagerId(json.managerId);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadRequests() {
      if (!employeeId) return;
      setRequestsLoading(true);
      try {
        const { data, error } = await supabase
          .from("action_requests")
          .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
          .order("created_at", { ascending: false })
          .limit(20);
        if (error) throw error;
        const all = (data ?? []) as ActionRequestRow[];
        const mine = all.filter((r) => r.metadata?.requester_type === "employee" && r.metadata?.requester_id === employeeId);
        if (!cancelled) setRequests(mine);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    }
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [employeeId, supabase]);

  const createEmployeeRequest = async (action: { title: string; action_type: string; topic: string }) => {
    if (!employeeId) {
      toast.error("Connexion requise.");
      return;
    }
    try {
      const base = {
        action_type: action.action_type,
        target_label: employeeName,
        status: "pending_hr_validation",
        requester_type: "employee",
      };

      // Best-effort inserts for schema differences:
      const payloads: Record<string, unknown>[] = [
        { ...base, requester_id: employeeId, metadata: { topic: action.topic } },
        { ...base, metadata: { requester_type: "employee", requester_id: employeeId, topic: action.topic, title: action.title } },
        { action_type: action.action_type, target_label: employeeName, status: "pending_hr_validation", metadata: { requester_type: "employee", requester_id: employeeId, topic: action.topic, title: action.title } },
      ];

      let ok = false;
      let lastErr: any = null;
      for (const p of payloads) {
        // eslint-disable-next-line no-await-in-loop
        const { error } = await supabase.from("action_requests").insert(p);
        if (!error) {
          ok = true;
          lastErr = null;
          break;
        }
        lastErr = error;
      }
      if (!ok && lastErr) throw lastErr;

      toast.success("Demande envoyée à votre RH.");
      // refresh list
      const { data } = await supabase
        .from("action_requests")
        .select("id,action_type,target_label,status,created_at,scheduled_at,metadata")
        .order("created_at", { ascending: false })
        .limit(20);
      const all = (data ?? []) as ActionRequestRow[];
      setRequests(all.filter((r) => r.metadata?.requester_type === "employee" && r.metadata?.requester_id === employeeId));
    } catch {
      toast.error("Impossible d'envoyer la demande.");
    }
  };

  const recommendations = [
    { title: "Atelier Gestion du temps", action_type: "group_workshop", topic: "Gestion du temps" },
    { title: "Coaching Focus", action_type: "coaching_focus", topic: "Focus & priorisation" },
  ];

  // Demo sparkline (4 weeks)
  const globalScores = [62, 64, 67, 70];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0a0a] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.10),rgba(255,255,255,0)_55%)]" />
        <div className="absolute -bottom-56 -left-56 h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.10),rgba(255,255,255,0)_62%)] blur-3xl" />
      </div>

      <SidebarSalarie />
      <main className="relative mx-auto max-w-5xl min-w-0 px-5 py-10 pb-40 pl-[232px] md:pl-[240px]">
        <header className="mb-10">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Espace Salarié</div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
            Bonjour {employeeName}, voici votre espace de croissance personnelle.
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-400">{message}</p>
        </header>

        <section className="mb-8 space-y-4">
          <MicroCheckinWidget />
          {managerId ? <ProfilPartageConsent managerId={managerId} /> : null}
        </section>

        {/* Cartes Apple : tests */}
        <section className="mb-12">
          <div className="grid gap-5 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/dashboard/salarie/test-idmc")}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#1a1a1a] shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
              style={{
                fontFamily:
                  '\"SF Pro Display\",\"SF Pro Text\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Inter,Roboto,Arial,sans-serif',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1600&q=80')",
                }}
              />
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
              <div className="relative p-7 text-left">
                <div className="text-[12px] font-black uppercase tracking-[0.28em] text-white/80">IDMC</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">Passer le test</div>
                <div className="mt-3 max-w-sm text-sm font-medium text-slate-200/80">
                  Cartographiez vos méthodes, votre organisation et votre progression au travail.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => router.push("/dashboard/salarie/test-soft-skills")}
              className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[#1a1a1a] shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition hover:shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
              style={{
                fontFamily:
                  '\"SF Pro Display\",\"SF Pro Text\",-apple-system,BlinkMacSystemFont,\"Segoe UI\",Inter,Roboto,Arial,sans-serif',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80')",
                }}
              />
              <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" />
              <div className="relative p-7 text-left">
                <div className="text-[12px] font-black uppercase tracking-[0.28em] text-white/80">SOFT SKILLS</div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">Passer le test</div>
                <div className="mt-3 max-w-sm text-sm font-medium text-slate-200/80">
                  Identifiez vos points forts relationnels et vos leviers de collaboration.
                </div>
              </div>
            </button>
          </div>
        </section>

        {/* Mon état actuel */}
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Mon état actuel</h2>
              <p className="mt-2 text-sm text-slate-400">3 signaux simples pour piloter votre semaine.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Gauge label="Engagement" value={engagement} tone="sky" />
            <Gauge label="Sérénité" value={serenite} tone="amber" />
            <Gauge label="Focus" value={focus} tone="emerald" />
          </div>
        </section>

        {/* Mon profil de fonctionnement */}
        <section className="mb-12">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold tracking-tight text-white">Comprendre mon équilibre</h2>
            <p className="mt-2 text-sm text-slate-400">Trois repères pédagogiques, simples et actionnables.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Ma Force</div>
              <div className="mt-3 text-lg font-extrabold tracking-tight text-white">Adaptabilité</div>
              <p className="mt-3 text-sm text-slate-400">Vous excellez dans les environnements mouvants.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Ma Vigilance</div>
              <div className="mt-3 text-lg font-extrabold tracking-tight text-white">Surcharge</div>
              <p className="mt-3 text-sm text-slate-400">
                Attention à maintenir des coupures nettes entre vie pro/perso.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
              <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Mon Levier</div>
              <div className="mt-3 text-lg font-extrabold tracking-tight text-white">Cadre clair</div>
              <p className="mt-3 text-sm text-slate-400">
                Vous gagnez en efficacité avec des objectifs découpés.
              </p>
            </div>
          </div>
        </section>

        {/* Recos */}
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Mes recommandations</h2>
              <p className="mt-2 text-sm text-slate-400">Des actions courtes, orientées progrès.</p>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {recommendations.map((r) => (
              <div key={r.title} className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                    <Sparkles className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <div className="text-lg font-extrabold tracking-tight text-white">{r.title}</div>
                    <div className="mt-2 text-sm text-slate-400">Objectif : gagner en clarté et en régularité.</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => createEmployeeRequest(r)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-extrabold text-slate-900 hover:bg-white/90"
                >
                  Demander cet accompagnement <TrendingUp className="h-4 w-4" aria-hidden />
                </button>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold">Pourquoi ce conseil ?</span>
                  <span>Basé sur l'évolution de votre score de sérénité ces 14 derniers jours.</span>
                  <span
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/85"
                    title="Nous détectons des variations de sérénité sur 14 jours et suggérons des actions concrètes pour stabiliser la charge."
                    aria-label="Informations"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* (déplacé) Les cartes IDMC/Soft Skills sont en haut */}

        {/* Évolution personnelle */}
        <section className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Évolution personnelle</h2>
              <p className="mt-2 text-sm text-slate-400">Score global — 4 semaines.</p>
            </div>
            <div className="text-sm font-extrabold text-emerald-300">+8% d'évolution positive observée.</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-7 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Score global</div>
                <div className="mt-2 text-2xl font-extrabold tracking-tight text-white">
                  {globalScores[globalScores.length - 1]}%
                </div>
              </div>
              <div className="text-indigo-300">
                <Sparkline points={globalScores} />
              </div>
            </div>
          </div>
        </section>

        {/* Mes prochaines étapes */}
        <section>
          <div className="mb-5 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Mes prochaines étapes</h2>
              <p className="mt-2 text-sm text-slate-400">Un tunnel clair jusqu’à la session.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-6 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
            {requestsLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((k) => (
                  <div key={k} className="h-14 rounded-2xl bg-white/10" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-sm text-slate-400">Aucune demande envoyée pour le moment.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => {
                  const scheduledFor = r.scheduled_at ?? null;
                  return (
                    <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-extrabold text-white">
                            {r.metadata?.title ?? r.action_type ?? "Demande"}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {r.status === "scheduled" && scheduledFor ? `Session prévue le ${scheduledFor}` : statusLabel(r.status)}
                          </div>
                        </div>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/85">
                          {statusLabel(r.status)}
                        </span>
                      </div>

                      <Stepper status={r.status} scheduledFor={scheduledFor ?? undefined} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="mt-10 text-xs text-slate-500">
          {loading ? "Connexion..." : employeeId ? "Connecté." : "Non connecté."}{" "}
          <button type="button" className="underline" onClick={() => router.push("/dashboard/entreprise")}>
            Aller au dashboard RH (démo)
          </button>
        </div>
      </main>
    </div>
  );
}

