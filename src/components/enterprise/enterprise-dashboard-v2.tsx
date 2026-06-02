"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BookOpen,
  Brain,
  ChevronRight,
  Download,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { EmptyState } from "@/components/enterprise/empty-state";
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
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formationTab, setFormationTab] = useState<"presentiel" | "elearning">("presentiel");
  const [showAddModal, setShowAddModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    sample: Array<{ first_name: string; last_name: string; email: string | null }>;
    stats: { total: number };
  } | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "",
    job_title: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => {
    const prenom = overview?.viewer?.prenom?.trim();
    if (prenom) return `Bonjour ${prenom}`;
    const email = overview?.viewer?.email?.trim();
    return email ? `Bonjour ${email}` : "Bonjour";
  }, [overview]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/entreprise/overview", { credentials: "include" });
      const json = (await res.json()) as Overview & { error?: string };
      if (!res.ok) throw new Error(json.error ?? `Erreur (${res.status})`);
      setOverview(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const handleExportCSV = () => {
    if (!overview?.employees?.length) {
      toast.error("Aucun collaborateur à exporter");
      return;
    }
    const header = "Nom,Prénom,Email,Département,Poste,Date d'ajout,Statut diagnostic,Score IDMC";
    const rows = overview.employees.map((e) => {
      const diag = e.diagnostic_done ? "Complété" : "En attente";
      const score = e.idmc_score != null ? String(Math.round(e.idmc_score)) : "";
      const date = e.created_at ? new Date(e.created_at).toLocaleDateString("fr-FR") : "";
      return [
        e.last_name ?? "",
        e.first_name ?? "",
        e.email ?? "",
        e.department ?? "",
        e.job_title ?? "",
        date,
        diag,
        score,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collaborateurs-${overview.organisation.name || "entreprise"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV téléchargé");
  };

  const handleImportFile = async (file: File) => {
    if (!overview?.organisation?.id) return;
    setPendingFile(file);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("organisation_id", overview.organisation.id);
    fd.append("preview", "1");
    try {
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Aperçu impossible");
      setImportPreview({ sample: json.sample ?? [], stats: json.stats ?? { total: 0 } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
      setPendingFile(null);
    }
  };

  const confirmImport = async () => {
    if (!pendingFile || !overview?.organisation?.id) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", pendingFile);
      fd.append("organisation_id", overview.organisation.id);
      const res = await fetch("/api/onboarding/import-csv", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Import impossible");

      const inviteRes = await fetch("/api/onboarding/invite-collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: overview.organisation.id }),
      });
      const inviteJson = await inviteRes.json();
      const invited = inviteRes.ok ? Number(inviteJson.sent ?? 0) : 0;

      toast.success(
        `${json.employes_importes ?? 0} collaborateurs importés${invited > 0 ? `, ${invited} invitations envoyées` : ""}`,
      );
      setImportPreview(null);
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadOverview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEmployee = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/entreprise/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      toast.success(json.invite_sent ? "Collaborateur ajouté — invitation envoyée" : "Collaborateur ajouté");
      setShowAddModal(false);
      setAddForm({ first_name: "", last_name: "", email: "", department: "", job_title: "" });
      await loadOverview();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  };

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const e of overview?.employees ?? []) {
      if (e.department) set.add(e.department);
    }
    return Array.from(set).sort();
  }, [overview?.employees]);

  return (
    <div className="flex min-h-screen bg-[#fafaf8] font-sans text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Espace Entreprise</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">{greeting}</h1>
          <p className="mt-2 text-sm text-gray-400">
            {overview?.organisation?.name ? `${overview.organisation.name} · ` : ""}
            {formatDateLongFr()}
          </p>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500">Chargement…</div>
        ) : error ? (
          <EmptyState icon="⚠️" title="Impossible de charger le dashboard" description={error} />
        ) : overview?.configuration_required ? (
          <EmptyState
            icon="⚙️"
            title="Votre espace Beyond est en cours de configuration"
            description="Complétez l'onboarding pour activer votre organisation."
            action={{ label: "Continuer l'onboarding →", href: overview.onboarding_href ?? "/onboarding" }}
          />
        ) : overview ? (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <LightKpiCard
                iconBg="bg-violet-50"
                icon={<Users className="text-violet-600" size={22} />}
                label="Total collaborateurs"
                value={overview.kpis.employees_total}
                sub="équipe active"
              />
              <LightKpiCard
                iconBg="bg-rose-50"
                icon={<Brain className="text-rose-500" size={22} />}
                label="Diagnostics"
                value={`${overview.kpis.diagnostics_completed} / ${overview.kpis.diagnostics_total}`}
                sub={`${overview.kpis.diagnostics_pct}% complétés`}
                footer={<RoseProgressBar pct={overview.kpis.diagnostics_pct} />}
              />
              <LightKpiCard
                iconBg="bg-blue-50"
                icon={<BookOpen className="text-blue-600" size={22} />}
                label="Formations actives"
                value={overview.kpis.enrollments_active}
                sub="parcours en cours"
              />
              <LightKpiCard
                iconBg="bg-orange-50"
                icon={<Activity className="text-orange-500" size={22} />}
                label="Équipe Insight"
                value={
                  overview.kpis.attention_signals.insufficient ? (
                    <Link href="/dashboard/entreprise/equipe-insight" className="text-lg font-black text-orange-600">
                      En attente →
                    </Link>
                  ) : (
                    overview.kpis.attention_signals.attention
                  )
                }
                sub={
                  overview.kpis.attention_signals.insufficient
                    ? `${overview.kpis.attention_signals.completed}/${overview.kpis.attention_signals.threshold} diagnostics`
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
                    {overview.kpis.employees_total} membres · {overview.employees_pending} en attente
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <Upload size={15} />
                    Importer CSV
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleImportFile(f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Download size={15} />
                    Exporter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    <UserPlus size={15} />
                    Ajouter
                  </button>
                </div>
              </div>

              {importPreview ? (
                <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
                  <p className="font-semibold text-gray-900">
                    Aperçu import — {importPreview.stats.total} lignes détectées
                  </p>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-xs uppercase text-gray-400">
                          <th className="px-3 py-2">Prénom</th>
                          <th className="px-3 py-2">Nom</th>
                          <th className="px-3 py-2">Email</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.sample.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="px-3 py-2">{row.first_name}</td>
                            <td className="px-3 py-2">{row.last_name}</td>
                            <td className="px-3 py-2">{row.email ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreview(null);
                        setPendingFile(null);
                      }}
                      className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void confirmImport()}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                    >
                      Confirmer l&apos;import
                    </button>
                  </div>
                </div>
              ) : null}

              {overview.employees.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="Aucun collaborateur"
                  description="Importez un fichier CSV ou ajoutez vos collaborateurs manuellement."
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
                overview.formations.presentiel.length === 0 ? (
                  <EmptyState
                    icon="📋"
                    title="Aucune session planifiée"
                    description="Planifiez une formation pour vos équipes."
                    action={{ label: "Planifier une formation", href: "/dashboard/entreprise/marketplace" }}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {overview.formations.presentiel.map((s) => {
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
              ) : overview.formations.elearning.length === 0 ? (
                <EmptyState
                  icon="📚"
                  title="Aucun parcours eLearning"
                  description="Assignez des parcours LMS à vos collaborateurs."
                  action={{ label: "eLearning by EDGE", href: "https://edgebs.fr" }}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {overview.formations.elearning.map((p) => (
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
              {overview.this_week.recent_activity.length === 0 ? (
                <p className="mt-3 text-sm text-gray-400">Aucune activité récente.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {overview.this_week.recent_activity.map((x) => (
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

      {showAddModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Ajouter un collaborateur</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500">Prénom *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={addForm.first_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500">Nom *</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    value={addForm.last_name}
                    onChange={(e) => setAddForm((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Email *</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Département</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.department}
                  onChange={(e) => setAddForm((f) => ({ ...f, department: e.target.value }))}
                >
                  <option value="">—</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Poste</label>
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  value={addForm.job_title}
                  onChange={(e) => setAddForm((f) => ({ ...f, job_title: e.target.value }))}
                />
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-violet-50 px-3 py-2 text-xs text-violet-800">
              ✉️ Un email d&apos;invitation sera envoyé automatiquement
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleAddEmployee()}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Ajouter →
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
