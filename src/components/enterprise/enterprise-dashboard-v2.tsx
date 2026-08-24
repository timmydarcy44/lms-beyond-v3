"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ListTodo,
  Users,
} from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EmptyState } from "@/components/enterprise/empty-state";
import { EnterpriseEmployeeCsvActions } from "@/components/enterprise/enterprise-employee-csv-actions";
import { EntrepriseQuickAccess } from "@/components/enterprise/entreprise-quick-access";
import { EnterpriseLoadingOverlay } from "@/components/enterprise/enterprise-loading-overlay";
import { useEntrepriseOverview } from "@/hooks/use-entreprise-overview";
import { filterRealEntrepriseEmployees } from "@/lib/entreprise/demo-employee-id";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { cn } from "@/lib/utils";

type AlertLevel = "critical" | "attention" | "info";

type Overview = {
  configuration_required?: boolean;
  demo_enriched?: boolean;
  viewer: { email: string | null; prenom: string | null; nom: string | null };
  organisation: { id: string; name: string };
  kpis: {
    employees_total: number;
    diagnostics_completed: number;
    diagnostics_total: number;
    diagnostics_pct: number;
    enrollments_active: number;
    attention_signals?:
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
    diagnostic_done: boolean;
    formation_active: boolean;
  }>;
  employees_pending: number;
  equipe_insight?: {
    priority_alerts?: Array<{
      level: AlertLevel;
      text: string;
      employee_id?: string;
      href?: string;
    }>;
    recommended_actions?: Array<{
      id: string;
      title: string;
      detail?: string;
      href?: string;
    }>;
    ai_recommendations?: string[];
  };
};

function formatDateLongFr(d = new Date()) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function initials(first: string | null, last: string | null) {
  const a = (first ?? "").trim().slice(0, 1).toUpperCase();
  const b = (last ?? "").trim().slice(0, 1).toUpperCase();
  return (a + b).trim() || "—";
}

function KpiCard(props: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub?: string;
  href?: string;
}) {
  const body = (
    <div className="flex h-full items-start gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-violet-200">
      <div className={cn("rounded-xl p-3", props.iconBg)}>{props.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {props.label}
        </p>
        <p className="text-3xl font-black text-gray-900">{props.value}</p>
        {props.sub ? <p className="mt-1 text-xs text-gray-400">{props.sub}</p> : null}
      </div>
    </div>
  );
  if (props.href) {
    return <Link href={props.href}>{body}</Link>;
  }
  return body;
}

function alertStyles(level: AlertLevel) {
  if (level === "critical") {
    return {
      wrap: "border-red-100 bg-red-50/70",
      badge: "bg-red-100 text-red-700",
      label: "Critique",
    };
  }
  if (level === "attention") {
    return {
      wrap: "border-amber-100 bg-amber-50/70",
      badge: "bg-amber-100 text-amber-800",
      label: "Attention",
    };
  }
  return {
    wrap: "border-blue-100 bg-blue-50/60",
    badge: "bg-blue-100 text-blue-700",
    label: "Info",
  };
}

export function EnterpriseDashboardV2() {
  const { loading, data, fetchError, organisationId, configurationRequired, reload } =
    useEntrepriseOverview();
  const overview = data as Overview | null;

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

  const employees = useMemo(() => {
    const all = overview?.employees ?? [];
    if (overview?.demo_enriched) return all;
    return filterRealEntrepriseEmployees(all);
  }, [overview?.employees, overview?.demo_enriched]);

  const pendingDiagnostics = useMemo(
    () => employees.filter((e) => !e.diagnostic_done),
    [employees],
  );

  const alerts = useMemo(() => {
    const fromInsight = overview?.equipe_insight?.priority_alerts ?? [];
    if (fromInsight.length > 0) {
      return fromInsight.filter((a) => a.level !== "info");
    }
    const derived: Array<{
      level: AlertLevel;
      text: string;
      employee_id?: string;
      href?: string;
    }> = [];
    if (pendingDiagnostics.length > 0) {
      derived.push({
        level: pendingDiagnostics.length >= 5 ? "attention" : "info",
        text: `${pendingDiagnostics.length} collaborateur${pendingDiagnostics.length > 1 ? "s" : ""} sans diagnostic complété`,
        href: "/dashboard/entreprise/salaries",
      });
    }
    const signals = overview?.kpis?.attention_signals;
    if (signals && !signals.insufficient) {
      if (signals.critical > 0) {
        derived.push({
          level: "critical",
          text: `${signals.critical} signal${signals.critical > 1 ? "aux" : ""} critique${signals.critical > 1 ? "s" : ""} détecté${signals.critical > 1 ? "s" : ""}`,
          href: "/dashboard/entreprise/equipe-insight",
        });
      }
      if (signals.attention > 0) {
        derived.push({
          level: "attention",
          text: `${signals.attention} signal${signals.attention > 1 ? "aux" : ""} d’attention cette semaine`,
          href: "/dashboard/entreprise/equipe-insight",
        });
      }
    }
    return derived;
  }, [overview, pendingDiagnostics.length]);

  const actions = useMemo(() => {
    const structured = overview?.equipe_insight?.recommended_actions ?? [];
    if (structured.length > 0) return structured;
    const fromAi = (overview?.equipe_insight?.ai_recommendations ?? []).map((text, i) => ({
      id: `ai-${i}`,
      title: text,
      detail: undefined as string | undefined,
      href: "/dashboard/entreprise/formations/demander",
    }));
    if (fromAi.length > 0) return fromAi;
    const fallback = [];
    if (pendingDiagnostics.length > 0) {
      fallback.push({
        id: "diag",
        title: "Relancer les diagnostics en attente",
        detail: `${pendingDiagnostics.length} collaborateur${pendingDiagnostics.length > 1 ? "s" : ""}`,
        href: "/dashboard/entreprise/salaries",
      });
    }
    fallback.push({
      id: "offer",
      title: "Publier une offre d’emploi",
      detail: "Recruter via le job board interne",
      href: "/dashboard/entreprise/offres/creer",
    });
    fallback.push({
      id: "train",
      title: "Demander une formation EDGE",
      detail: "Catalogue business pour vos équipes",
      href: "/dashboard/entreprise/formations/demander",
    });
    return fallback;
  }, [overview, pendingDiagnostics.length]);

  const kpis = overview?.kpis;
  const actionsCount = actions.length;
  const alertsCount = alerts.length;
  const showBlockingOverlay = loading && !overview;

  return (
    <div className="relative flex min-h-screen bg-[#f7f5fb] font-sans text-gray-900">
      {showBlockingOverlay ? <EnterpriseLoadingOverlay /> : null}
      <EnterpriseSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-violet-500">
            Espace Entreprise
          </p>
          <h1 className={cn("mt-2 text-left", ENTREPRISE_H1_CLASS)}>{greeting}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {overview?.organisation?.name ? `${overview.organisation.name} · ` : ""}
            {formatDateLongFr()}
          </p>
        </header>

        {loading ? null : fetchError ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
            <p className="text-sm text-gray-600">Impossible de charger le tableau de bord.</p>
            <p className="mt-2 text-xs text-gray-400">{fetchError}</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              Réessayer
            </button>
          </div>
        ) : configurationRequired ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-violet-100 bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">Bienvenue sur EDGE Entreprise</h2>
              <p className="mt-2 max-w-lg text-sm text-gray-600">
                Importez votre liste RH pour créer vos collaborateurs et lancer les diagnostics.
              </p>
              <div className="mt-6">
                <EnterpriseEmployeeCsvActions
                  organisationId={organisationId}
                  employees={[]}
                  onSuccess={() => void reload()}
                />
              </div>
            </div>
            <EntrepriseQuickAccess />
          </div>
        ) : overview && kpis ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                iconBg="bg-violet-50"
                icon={<Users className="text-violet-600" size={22} />}
                label="Collaborateurs"
                value={kpis.employees_total}
                sub={`${overview.employees_pending ?? 0} invitation${(overview.employees_pending ?? 0) > 1 ? "s" : ""} en attente`}
                href="/dashboard/entreprise/salaries"
              />
              <KpiCard
                iconBg="bg-emerald-50"
                icon={<CheckCircle2 className="text-emerald-600" size={22} />}
                label="Diagnostics réalisés"
                value={`${kpis.diagnostics_completed}`}
                sub={`${kpis.diagnostics_pct}% · ${kpis.diagnostics_completed}/${kpis.diagnostics_total}`}
                href="/dashboard/entreprise/salaries"
              />
              <KpiCard
                iconBg="bg-blue-50"
                icon={<ListTodo className="text-blue-600" size={22} />}
                label="Actions à mettre en place"
                value={actionsCount}
                sub="priorités RH recommandées"
                href="#actions"
              />
              <KpiCard
                iconBg="bg-amber-50"
                icon={<AlertTriangle className="text-amber-600" size={22} />}
                label="Alertes écarts"
                value={alertsCount}
                sub="écarts significatifs détectés"
                href="#alertes"
              />
            </section>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section id="alertes" className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Alertes</h2>
                    <p className="text-sm text-gray-400">
                      Écarts importants vs fiche métier ou signaux à traiter
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                {alerts.length === 0 ? (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-6 text-sm text-emerald-800">
                    Aucune alerte critique pour le moment.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {alerts.map((alert, index) => {
                      const style = alertStyles(alert.level);
                      const href =
                        alert.href ??
                        (alert.employee_id
                          ? `/dashboard/entreprise/salaries/${alert.employee_id}`
                          : undefined);
                      const inner = (
                        <div
                          className={cn(
                            "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3",
                            style.wrap,
                          )}
                        >
                          <div className="min-w-0">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                style.badge,
                              )}
                            >
                              {style.label}
                            </span>
                            <p className="mt-2 text-sm font-medium text-gray-900">{alert.text}</p>
                          </div>
                          {href ? (
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" />
                          ) : null}
                        </div>
                      );
                      return (
                        <li key={`${alert.text}-${index}`}>
                          {href ? <Link href={href}>{inner}</Link> : inner}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section id="actions" className="rounded-[24px] border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Actions à mettre en place</h2>
                    <p className="text-sm text-gray-400">Priorités concrètes pour vos équipes</p>
                  </div>
                  <ClipboardList className="h-5 w-5 text-blue-500" />
                </div>
                <ul className="space-y-3">
                  {actions.map((action) => {
                    const inner = (
                      <div className="group flex items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/40">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{action.title}</p>
                          {action.detail ? (
                            <p className="mt-1 text-xs text-gray-500">{action.detail}</p>
                          ) : null}
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 group-hover:text-violet-500" />
                      </div>
                    );
                    return (
                      <li key={action.id}>
                        {action.href ? <Link href={action.href}>{inner}</Link> : inner}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <div className="mt-8">
              <EntrepriseQuickAccess />
            </div>

            <section className="mt-8">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Diagnostics en attente</h2>
                  <p className="text-sm text-gray-400">
                    {pendingDiagnostics.length} collaborateur
                    {pendingDiagnostics.length > 1 ? "s" : ""} à relancer
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <EnterpriseEmployeeCsvActions
                    organisationId={organisationId}
                    employees={employees}
                    organisationName={overview.organisation?.name}
                    departments={departments}
                    onSuccess={() => void reload()}
                  />
                  <Link
                    href="/dashboard/entreprise/salaries"
                    className="text-sm font-semibold text-violet-600 hover:text-violet-500"
                  >
                    Voir tous →
                  </Link>
                </div>
              </div>

              {employees.length === 0 ? (
                <EmptyState
                  variant="light"
                  icon="👥"
                  title="Aucun collaborateur"
                  description="Importez un fichier CSV ou invitez vos collaborateurs."
                  onAction={() => document.getElementById("entreprise-csv-import")?.click()}
                />
              ) : pendingDiagnostics.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-6 text-sm text-emerald-800">
                  Tous les collaborateurs visibles ont complété leur diagnostic.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <ul className="divide-y divide-gray-50">
                    {pendingDiagnostics.slice(0, 8).map((c) => {
                      const fullName =
                        [c.first_name, c.last_name].filter(Boolean).join(" ") || "—";
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/dashboard/entreprise/salaries/${c.id}`}
                            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50/80"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                                {initials(c.first_name, c.last_name)}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-900">{fullName}</p>
                                <p className="truncate text-xs text-gray-400">
                                  {c.job_title ?? "—"}
                                  {c.department ? ` · ${c.department}` : ""}
                                </p>
                              </div>
                            </div>
                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-gray-500">
                              En attente
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
