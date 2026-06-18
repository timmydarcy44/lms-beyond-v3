"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, Brain, ChevronRight, Users } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EmptyState } from "@/components/enterprise/empty-state";
import { EnterpriseEmployeeCsvActions } from "@/components/enterprise/enterprise-employee-csv-actions";
import { EntrepriseQuickAccess } from "@/components/enterprise/entreprise-quick-access";
import { EnterpriseLoadingOverlay } from "@/components/enterprise/enterprise-loading-overlay";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";

type Overview = {
  configuration_required?: boolean;
  onboarding_href?: string;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation: { id: string; name: string };
  kpis: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    enrollments_active: number;
    attention_signals:
      | { insufficient: true; completed: number; threshold: number }
      | { insufficient: false; attention: number; critical: number };
  };
  employees: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    job_title: string | null;
    department: string | null;
    created_at: string | null;
    diagnostic_done: boolean;
    idmc_score: number | null;
    formation_active: boolean;
  }>;
  employees_pending: number;
  this_week: {
    recent_activity: Array<{ id: string; title: string; at: string; kind?: string }>;
  };
  formations: {
    presentiel: Array<{
      id: string;
      title: string;
      formateur: string;
      date: string;
      time: string;
      confirmed: number;
      total: number;
    }>;
    elearning: Array<{
      path_id: string;
      title: string;
      enrolled: number;
      completion_pct: number;
      avg_quiz_score: number | null;
      badges_count: number;
    }>;
  };
};

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-pink-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-emerald-500",
  "bg-rose-500",
];

function formatDateLongFr(d = new Date()) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSessionDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function initials(first: string | null, last: string | null) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return (a + b).trim() || "—";
}

function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function idmcTextClass(score: number | null) {
  if (score == null) return "text-gray-400";
  if (score > 75) return "text-emerald-600";
  if (score > 60) return "text-amber-600";
  return "text-red-600";
}

function LightKpiCard(props: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className={cn("rounded-xl p-3", props.iconBg)}>{props.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">{props.label}</p>
        <p className="text-3xl font-black text-gray-900">{props.value}</p>
        {props.sub ? <p className="mt-1 text-xs text-gray-400">{props.sub}</p> : null}
        {props.footer}
      </div>
    </div>
  );
}

function RoseProgressBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="mt-3 h-1 w-full rounded-full bg-rose-100">
      <div className="h-1 rounded-full bg-rose-500 transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

function BlueProgressBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-blue-100">
      <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${p}%` }} />
    </div>
  );
}

export function EnterpriseDashboardV2() {
  const { loading, data, fetchError, organisationId, configurationRequired, reload } =
    useEntrepriseOverview();
  const overview = data as Overview | null;
  const [formationTab, setFormationTab] = useState<"presentiel" | "elearning">("presentiel");

  const greeting = useMemo(() => {
    const prenom = overview?.viewer?.prenom?.trim();
    if (prenom) return `Bonjour ${prenom}`;
    const email = overview?.viewer?.email?.trim();
    return email ? `Bonjour ${email}` : "Bonjour";
  }, [overview]);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of overview?.employees ?? []) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [overview?.employees]);

  const kpis = overview?.kpis;
  const attentionSignals = overview?.kpis?.attention_signals;
  const formations = overview?.formations ?? { presentiel: [], elearning: [] };
  const recentActivity = overview?.this_week?.recent_activity ?? [];

  const showBlockingOverlay = loading && !overview;

  return (
    <div className="relative flex min-h-screen bg-white font-sans text-gray-900">
      {showBlockingOverlay ? <EnterpriseLoadingOverlay /> : null}
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Espace Entreprise</p>
          <h1 className={cn("mt-2", ENTREPRISE_H1_CLASS)}>{greeting}</h1>
          <p className="mt-2 text-sm text-gray-400">
            {overview?.organisation?.name ? `${overview.organisation.name} · ` : ""}
            {formatDateLongFr()}
          </p>
        </header>

        {loading ? null : fetchError ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">Connexion en cours — nouvelle tentative automatique…</p>
            <p className="mt-2 text-xs text-gray-400">{fetchError}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Réessayer maintenant
            </button>
          </div>
        ) : configurationRequired ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-8">
              <h2 className="text-xl font-bold text-gray-900">Bienvenue sur Beyond Enterprise</h2>
              <p className="mt-2 max-w-lg text-sm text-gray-600">
                Importez votre liste RH pour créer vos collaborateurs et lancer les diagnostics.
                Format : Nom, Prénom, Email, Département, Poste.
              </p>
              <div className="mt-6">
                <EnterpriseEmployeeCsvActions
                  organisationId={organisationId}
                  employees={[]}
                  onSuccess={() => void reload()}
                />
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Votre organisation n&apos;est pas encore liée ?{" "}
                <Link href="/onboarding" className="font-semibold text-violet-600 underline">
                  Compléter la configuration →
                </Link>
              </p>
            </div>
            <EntrepriseQuickAccess />
          </div>
        ) : overview && kpis ? (
          <>
            <EntrepriseQuickAccess />

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <LightKpiCard
                iconBg="bg-violet-50"
                icon={<Users className="text-violet-600" size={22} />}
                label="Total collaborateurs"
                value={kpis.employees_total}
                sub="équipe active"
              />
              <LightKpiCard
                iconBg="bg-rose-50"
                icon={<Brain className="text-rose-500" size={22} />}
                label="Diagnostics"
                value={`${kpis.diagnostics_completed} / ${kpis.diagnostics_total}`}
                sub={`${kpis.diagnostics_pct}% complétés`}
                footer={<RoseProgressBar pct={kpis.diagnostics_pct} />}
              />
              <LightKpiCard
                iconBg="bg-blue-50"
                icon={<BookOpen className="text-blue-600" size={22} />}
                label="Formations actives"
                value={kpis.enrollments_active}
                sub="parcours en cours"
              />
              <LightKpiCard
                iconBg="bg-orange-50"
                icon={<Activity className="text-orange-500" size={22} />}
                label="Équipe Insight"
                value={
                  attentionSignals?.insufficient ? (
                    <Link href="/dashboard/entreprise/equipe-insight" className="text-lg font-black text-orange-600">
                      En attente →
                    </Link>
                  ) : (
                    (attentionSignals as { attention?: number })?.attention ?? 0
                  )
                }
                sub={
                  attentionSignals?.insufficient
                    ? `${(attentionSignals as { completed: number }).completed}/${(attentionSignals as { threshold: number }).threshold} diagnostics`
                    : "signaux cette semaine"
                }
              />
            </section>

            {/* Collaborateurs */}
            <section className="mt-10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Collaborateurs</h2>
                  <p className="text-sm text-gray-400">
                    {overview.kpis.employees_total} membres · {overview.employees_pending ?? 0} en attente
                  </p>
                </div>
                <EnterpriseEmployeeCsvActions
                  organisationId={organisationId}
                  employees={overview.employees}
                  organisationName={overview.organisation?.name}
                  departments={departments}
                  onSuccess={() => void reload()}
                />
              </div>

              {overview.employees.length === 0 ? (
                <EmptyState
                  variant="light"
                  icon="👥"
                  title="Aucun collaborateur"
                  description="Importez un fichier CSV ou ajoutez vos collaborateurs manuellement."
                  onAction={() => document.getElementById("entreprise-csv-import")?.click()}
                />
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        <th className="px-4 py-3">Collaborateur</th>
                        <th className="px-4 py-3">Département</th>
                        <th className="px-4 py-3">Diagnostic</th>
                        <th className="px-4 py-3">Formation</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.employees.map((c) => {
                        const fullName = [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                        const color = avatarColor(fullName);
                        return (
                          <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="px-4 py-3">
                              <Link
                                href={`/dashboard/entreprise/salaries/${c.id}`}
                                className="flex items-center gap-3"
                              >
                                <div
                                  className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                                    color,
                                  )}
                                >
                                  {initials(c.first_name, c.last_name)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900">{fullName}</p>
                                  <p className="text-xs text-gray-400">{c.job_title ?? "—"}</p>
                                  {c.idmc_score != null ? (
                                    <p className={cn("text-xs font-semibold", idmcTextClass(c.idmc_score))}>
                                      IDMC {Math.round(c.idmc_score)}%
                                    </p>
                                  ) : null}
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{c.department ?? "—"}</td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                  c.diagnostic_done
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-gray-100 text-gray-500",
                                )}
                              >
                                {c.diagnostic_done ? "Complété" : "En attente"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                                  c.formation_active
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-gray-100 text-gray-500",
                                )}
                              >
                                {c.formation_active ? "En cours" : "Aucune"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                href={`/dashboard/entreprise/salaries/${c.id}`}
                                className="text-sm font-semibold text-violet-600 hover:text-violet-500"
                              >
                                Voir →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Formations */}
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Formations</h2>
              <div className="mb-4 flex gap-2">
                {(["presentiel", "elearning"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFormationTab(tab)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold transition",
                      formationTab === tab
                        ? "bg-violet-600 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {tab === "presentiel" ? "Présentiel" : "eLearning"}
                  </button>
                ))}
              </div>

              {formationTab === "presentiel" ? (
                formations.presentiel.length === 0 ? (
                  <EmptyState
                    variant="light"
                    icon="📋"
                    title="Aucune session planifiée"
                    description="Planifiez une formation pour vos équipes."
                    action={{ label: "Planifier une formation", href: "/dashboard/entreprise/marketplace" }}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {formations.presentiel.map((s) => {
                      const pct =
                        s.total > 0 ? Math.round((s.confirmed / s.total) * 100) : 0;
                      return (
                        <div
                          key={s.id}
                          className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                        >
                          <p className="font-bold text-gray-900">📋 {s.title}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            Formateur : {s.formateur} · {formatSessionDate(s.date)}
                            {s.time ? ` · ${s.time}` : ""}
                          </p>
                          <p className="mt-3 text-sm text-gray-600">
                            Présences : {s.confirmed} / {s.total} confirmées
                          </p>
                          <BlueProgressBar pct={pct} />
                          <p className="mt-1 text-xs text-gray-400">{pct}%</p>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : formations.elearning.length === 0 ? (
                <EmptyState
                  variant="light"
                  icon="📚"
                  title="Aucun parcours eLearning"
                  description="Assignez des parcours LMS à vos collaborateurs."
                  action={{ label: "eLearning by EDGE", href: "https://edgebs.fr" }}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {formations.elearning.map((p) => (
                    <div key={p.path_id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="font-bold text-gray-900">📚 {p.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{p.enrolled} apprenants inscrits</p>
                      <p className="mt-3 text-sm font-semibold text-gray-700">
                        Taux complétion : {p.completion_pct}%
                      </p>
                      <BlueProgressBar pct={p.completion_pct} />
                      {p.avg_quiz_score != null ? (
                        <p className="mt-2 text-sm text-gray-500">
                          Score moyen quiz : {p.avg_quiz_score}%
                        </p>
                      ) : null}
                      {p.badges_count > 0 ? (
                        <p className="text-sm text-gray-500">Badges obtenus : {p.badges_count}</p>
                      ) : null}
                      <Link
                        href={`/dashboard/formateur`}
                        className="mt-4 inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-500"
                      >
                        Voir le détail <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Activité récente */}
            <section className="mt-10 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900">Activité récente</p>
              {recentActivity.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Aucune activité récente.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recentActivity.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 rounded-xl border border-gray-50 bg-gray-50/50 p-3 text-sm">
                      <Brain className="h-4 w-4 text-violet-500" />
                      <div>
                        <p className="font-semibold text-gray-900">{x.title}</p>
                        <p className="text-gray-400">
                          {new Date(x.at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
