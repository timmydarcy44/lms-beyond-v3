"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Users, Zap, Brain, AlertTriangle } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { useSupabase } from "@/components/providers/supabase-provider";
import { EmptyState } from "@/components/enterprise/empty-state";

type Overview = {
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation: { id: string; name: string };
  kpis: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_pct: number;
    trainings_in_progress: number | null;
    attention_signals:
      | { insufficient: true; completed: number; threshold: number }
      | { insufficient: false; attention: number; critical: number };
  };
  this_week: {
    from: string;
    to: string;
    agenda: Array<{ id: string; date: string; time: string; status: string | null }>;
    recent_activity: Array<{ id: string; title: string; at: string }>;
  };
  equipe_insight: {
    week_end: string | null;
    insight: string | null;
    idmc: number | null;
    stress: number | null;
    cohesion: number | null;
    insufficient: boolean;
    completed: number;
    threshold: number;
  };
  collaborators_preview: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    job_title: string | null;
    diagnostic_done: boolean | null;
  }>;
  mobility: { enabled: boolean; completed: number; threshold: number };
};

function formatDateLongFr(d = new Date()) {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function initials(first: string | null, last: string | null) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return (a + b).trim() || "—";
}

function KpiCard(props: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5 transition hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {props.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">{props.label}</p>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-[#1a1a2e]">{props.value}</div>
          {props.sub ? <div className="mt-1 text-sm text-slate-600">{props.sub}</div> : null}
        </div>
      </div>
      {props.footer ? <div className="mt-4">{props.footer}</div> : null}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div className="h-1.5 rounded-full bg-indigo-600" style={{ width: `${p}%` }} />
    </div>
  );
}

export function EnterpriseDashboardV2() {
  const supabase = useSupabase();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const greeting = useMemo(() => {
    const prenom = overview?.viewer?.prenom?.trim();
    if (prenom) return `Bonjour ${prenom}`;
    const email = overview?.viewer?.email?.trim();
    return `Bonjour ${email || "—"}`;
  }, [overview]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        // Priority absolute: user from active session only.
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr || !userData.user?.id) throw new Error("Non authentifié");

        const res = await fetch("/api/dashboard/entreprise/overview");
        const json = (await res.json()) as Overview & { error?: string };
        if (!res.ok) throw new Error(json.error ?? `Erreur (${res.status})`);
        if (!cancelled) setOverview(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="flex min-h-screen bg-[#f8f8f6] font-sans text-[#1a1a2e]">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Espace Entreprise</p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{greeting}</h1>
              <p className="mt-1 text-sm text-slate-600">
                {overview?.organisation?.name ? `${overview.organisation.name} · ` : ""}
                {formatDateLongFr()}
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-[#e8e8e0] bg-white p-6 text-sm text-slate-600">
            Chargement…
          </div>
        ) : error ? (
          <EmptyState
            icon="⚠️"
            title="Impossible de charger le dashboard"
            description={error}
          />
        ) : overview ? (
          <>
            {/* BLOC 1 — ÉTAT DES ÉQUIPES */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">État des équipes</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard icon={<Users className="h-5 w-5" />} label="Collaborateurs" value={overview.kpis.employees_total} />
                <KpiCard
                  icon={<Brain className="h-5 w-5" />}
                  label="Diagnostics complétés"
                  value={`${overview.kpis.diagnostics_completed} / ${overview.kpis.employees_total}`}
                  sub={`(${overview.kpis.diagnostics_pct}%)`}
                  footer={<ProgressBar pct={overview.kpis.diagnostics_pct} />}
                />
                <KpiCard
                  icon={<CalendarDays className="h-5 w-5" />}
                  label="Formations en cours"
                  value={overview.kpis.trainings_in_progress ?? "—"}
                  sub="(bientôt disponible)"
                />
                <KpiCard
                  icon={<Zap className="h-5 w-5" />}
                  label="Signaux d'attention"
                  value={
                    overview.kpis.attention_signals.insufficient
                      ? "Données insuffisantes"
                      : overview.kpis.attention_signals.attention
                  }
                  sub={
                    overview.kpis.attention_signals.insufficient
                      ? `${overview.kpis.attention_signals.completed}/${overview.kpis.attention_signals.threshold} diagnostics`
                      : overview.kpis.attention_signals.critical > 0
                        ? `${overview.kpis.attention_signals.critical} critiques`
                        : "—"
                  }
                />
              </div>
            </section>

            {/* BLOC 2 — CETTE SEMAINE */}
            <section className="mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Cette semaine</p>
              <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">📅 Agenda de la semaine</p>
                    <Link className="text-sm font-semibold text-indigo-600 hover:underline" href="/dashboard/entreprise/marketplace">
                      Voir →
                    </Link>
                  </div>
                  {overview.this_week.agenda.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState
                        icon="📭"
                        title="Aucun événement cette semaine"
                        description="Commencez par lancer les premiers diagnostics de vos collaborateurs."
                        action={{ label: "Inviter les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                      />
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2 text-sm">
                      {overview.this_week.agenda.map((a) => (
                        <li key={a.id} className="rounded-xl border border-[#e8e8e0] bg-[#f8f8f6] p-3">
                          <p className="font-semibold">{a.date} · {a.time}</p>
                          <p className="text-slate-600">Session BCT {a.status ? `— ${a.status}` : ""}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">⚡ Activité récente</p>
                  </div>
                  {overview.this_week.recent_activity.length === 0 ? (
                    <div className="mt-4">
                      <EmptyState
                        icon="📭"
                        title="Aucune activité récente"
                        description="Cette section se remplira au fur et à mesure que vos collaborateurs utilisent Beyond."
                        action={{ label: "Inviter les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                      />
                    </div>
                  ) : (
                    <ul className="mt-4 space-y-2 text-sm">
                      {overview.this_week.recent_activity.map((x) => (
                        <li key={x.id} className="rounded-xl border border-[#e8e8e0] bg-[#f8f8f6] p-3">
                          <p className="font-semibold">{x.title}</p>
                          <p className="text-slate-600">{x.at}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            {/* BLOC 3 — ÉQUIPE INSIGHT */}
            <section className="mt-10">
              <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">🔍 Équipe Insight</p>
                    <p className="mt-1 text-xs text-slate-500">Données agrégées et anonymisées — RGPD</p>
                  </div>
                  <Link href="/dashboard/entreprise/equipe-radar" className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline">
                    Voir l'analyse complète <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                {overview.equipe_insight.insufficient ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="🔒"
                      title="Données insuffisantes"
                      description={`Équipe Insight s'active à partir de ${overview.equipe_insight.threshold} diagnostics complétés. (${overview.equipe_insight.completed}/${overview.equipe_insight.threshold})`}
                      action={{ label: "Inviter les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                    />
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-[#e8e8e0] bg-[#f8f8f6] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">💡 Insight du moment</p>
                      <p className="mt-2 text-sm text-slate-700">
                        “{overview.equipe_insight.insight ?? "—"}”
                      </p>
                      <p className="mt-2 text-xs text-slate-500">(généré par IA)</p>
                    </div>
                    <div className="rounded-2xl border border-[#e8e8e0] bg-[#f8f8f6] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">📊 État cognitif</p>
                      <div className="mt-3 space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">IDMC moyen</span>
                          <span className="font-semibold">{overview.equipe_insight.idmc ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Stress moyen</span>
                          <span className="font-semibold">{overview.equipe_insight.stress ?? "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Cohésion</span>
                          <span className="font-semibold">{overview.equipe_insight.cohesion ?? "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-2 rounded-2xl border border-[#e8e8e0] bg-amber-50 p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
                        <p className="text-sm text-amber-900">
                          Signaux d&apos;attention anonymisés cette semaine. Consultez l&apos;analyse complète.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* COLLABORATEURS PREVIEW */}
            <section className="mt-10">
              <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">👥 Collaborateurs (aperçu)</p>
                  <Link href="/dashboard/entreprise/salaries" className="text-sm font-semibold text-indigo-600 hover:underline">
                    Voir tous →
                  </Link>
                </div>
                {overview.collaborators_preview.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      icon="📭"
                      title="Aucun collaborateur"
                      description="Importez ou invitez vos collaborateurs pour démarrer."
                      action={{ label: "Gérer les collaborateurs →", href: "/dashboard/entreprise/salaries" }}
                    />
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-[#e8e8e0]">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#f8f8f6]">
                        <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                          <th className="px-4 py-3">Collaborateur</th>
                          <th className="px-4 py-3">Poste</th>
                          <th className="px-4 py-3">Diagnostic</th>
                          <th className="px-4 py-3">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overview.collaborators_preview.map((c) => (
                          <tr key={c.id} className="border-t border-[#e8e8e0]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
                                  {initials(c.first_name, c.last_name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold">
                                    {[c.first_name, c.last_name].filter(Boolean).join(" ") || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{c.job_title ?? "—"}</td>
                            <td className="px-4 py-3 text-slate-600">—</td>
                            <td className="px-4 py-3 text-slate-600">—</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            {/* MOBILITÉ (conditionnelle) */}
            {overview.mobility.enabled ? (
              <section className="mt-10">
                <div className="rounded-2xl border border-[#e8e8e0] bg-white p-5">
                  <p className="text-sm font-semibold">🚀 Suggestions de mobilité interne</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Basé sur les profils cognitifs Beyond (DISC & IDMC).
                  </p>
                  <div className="mt-4">
                    <Link className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:underline" href="/dashboard/entreprise/equipe-radar">
                      Voir les suggestions <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}

