"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock3, GraduationCap, Loader2, Mail, RefreshCw } from "lucide-react";
import { EmptyState, SegmentedFilter } from "@/components/control/chrome";
import { DataTable, PageHeader, StatusPill } from "@/components/control/ui";
import { looksLikeTestAccount } from "@/lib/control/test-account";

import {
  CFA_APPLICATION_STATUSES,
  CFA_STATUS_LABELS,
  getCfaSpecializationLabel,
  type CfaApplication,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

const columns: {
  id: "brochure" | "application" | "interview" | "review" | "administrative" | "admitted" | "rejected";
  label: string;
  statuses: CfaApplicationStatus[];
  accent: string;
}[] = [
  {
    id: "brochure",
    label: "Téléchargement fiche cursus",
    statuses: ["brochure"],
    accent: "bg-cyan-400",
  },
  {
    id: "application",
    label: "Application",
    statuses: ["profile", "challenge", "dossier"],
    accent: "bg-slate-400",
  },
  { id: "interview", label: "Interview", statuses: ["interview"], accent: "bg-sky-500" },
  { id: "review", label: "À relire", statuses: ["review"], accent: "bg-amber-500" },
  {
    id: "administrative",
    label: "Éléments administratifs",
    statuses: ["administrative"],
    accent: "bg-violet-500",
  },
  { id: "admitted", label: "Admis", statuses: ["admitted", "contract"], accent: "bg-emerald-500" },
  { id: "rejected", label: "Non retenu", statuses: ["rejected"], accent: "bg-rose-400" },
];

export function CfaPipelineClient({
  apiPath = "/api/super-admin/crm/cfa",
  readOnly = false,
}: {
  apiPath?: string;
  readOnly?: boolean;
} = {}) {
  const [applications, setApplications] = useState<CfaApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [view, setView] = useState("liste");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showTests, setShowTests] = useState(false);
  const [page, setPage] = useState(1);
  const router = useRouter();

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(apiPath, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      setApplications(result.applications ?? []);
      setMigrationRequired(Boolean(result.migrationRequired));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const counts = useMemo(
    () => ({
      total: applications.length,
      new: applications.filter((item) => ["profile", "challenge", "dossier"].includes(item.status))
        .length,
      review: applications.filter((item) => item.status === "review").length,
      admitted: applications.filter((item) => item.status === "admitted").length,
    }),
    [applications],
  );

  async function changeStatus(application: CfaApplication, status: CfaApplicationStatus) {
    setUpdating(application.id);
    setError("");
    try {
      const response = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: application.id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mise à jour impossible");
      setApplications((current) =>
        current.map((item) => (item.id === application.id ? result.application : item)),
      );
      if (status === "administrative" && result.emailSent === false) {
        setError("Le statut est enregistré, mais l’email au candidat n’a pas pu être envoyé.");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Mise à jour impossible");
    } finally {
      setUpdating(null);
    }
  }

  const tests = applications.filter((item) => looksLikeTestAccount({ email: item.email, name: `${item.first_name} ${item.last_name}` }));
  const pool = showTests ? applications : applications.filter((item) => !tests.some((test) => test.id === item.id));
  const query = search.trim().toLowerCase();
  const listRows = pool.filter((item) => {
    const column = columns.find((entry) => entry.id === statusFilter);
    if (column && !column.statuses.includes(item.status)) return false;
    if (!query) return true;
    return `${item.first_name} ${item.last_name} ${item.email}`.toLowerCase().includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(listRows.length / 40));
  const visibleRows = listRows.slice((page - 1) * 40, page * 40);

  return (
    <div className="mx-auto max-w-[1240px] space-y-5 px-6 py-8 text-white">
      <PageHeader
        title="Admissions"
        subtitle={`${pool.length} candidature${pool.length > 1 ? "s" : ""} · ${counts.review} à relire`}
        actions={
          <>
            <SegmentedFilter value={view} onChange={setView} items={[{ id: "liste", label: "Liste" }, { id: "tableau", label: "Tableau" }]} />
            <button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-full border border-[#26304F] px-4 text-sm font-semibold text-[#C9D2E8]">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Actualiser
            </button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Candidatures CFA", counts.total],
          ["À compléter", counts.new],
          ["À relire", counts.review],
          ["Admis", counts.admitted],
        ].map(([label, value]) => (
          <div key={label} className="super-glass-panel rounded-2xl border border-white/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </div>

      {migrationRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Les candidatures ne sont pas encore activées.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {view === "liste" && !loading ? (
        <div className="space-y-3">
          <SegmentedFilter
            value={statusFilter}
            onChange={(id) => { setStatusFilter(id); setPage(1); }}
            items={[{ id: "all", label: "Tous", count: pool.length }, ...columns.map((column) => ({ id: column.id, label: column.label, count: pool.filter((item) => column.statuses.includes(item.status)).length }))]}
          />
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un candidat" className="h-10 min-w-[240px] flex-1 rounded-full border border-[#26304F] bg-[#0B1122] px-4 text-sm outline-none" />
            <label className="flex items-center gap-2 text-sm text-[#C9D2E8]">
              <input type="checkbox" checked={showTests} onChange={(event) => { setShowTests(event.target.checked); setPage(1); }} />
              Afficher les comptes de test ({tests.length})
            </label>
          </div>
          <DataTable
            columns={[
              { id: "name", header: "Candidat", cell: (item) => <span><span className="block font-semibold">{item.first_name} {item.last_name}</span><span className="block truncate text-[12px] text-[#9AA3BD]">{item.email}</span></span> },
              { id: "track", header: "Spécialité", cell: (item) => getCfaSpecializationLabel(item.specialization) },
              { id: "status", header: "Statut", cell: (item) => <StatusPill label={item.status === "review" ? "À relire" : CFA_STATUS_LABELS[item.status]} tone={item.status === "admitted" || item.status === "contract" ? "success" : item.status === "rejected" ? "danger" : item.status === "review" ? "warning" : "neutral"} /> },
              { id: "date", header: "Inscrit le", cell: (item) => new Date(item.created_at).toLocaleDateString("fr-FR") },
              { id: "open", header: "", cell: () => <ChevronRight className="h-4 w-4 text-[#6C7593]" /> },
            ]}
            rows={visibleRows}
            rowKey={(item) => item.id}
            onRow={(item) => router.push(`/super/crm/cfa/apprenants/${item.id}`)}
            empty={<EmptyState title="Aucune candidature pour ce filtre." />}
            page={page}
            pageCount={pageCount}
            onPage={setPage}
          />
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : view === "tableau" ? (
        <div className="-mx-3 min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-2 sm:-mx-6">
          <div className="flex w-max min-w-full flex-nowrap gap-4 px-3 pb-5 sm:px-6">
          {columns.map((column) => {
            const items = applications.filter((application) =>
              column.statuses.includes(application.status),
            );
            return (
              <section
                key={column.id}
                className="super-glass-panel flex h-[min(72vh,760px)] w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 p-3"
              >
                <header className="flex shrink-0 items-center justify-between px-1 py-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", column.accent)} />
                    <h2 className="text-sm font-semibold text-gray-800">{column.label}</h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">
                    {items.length}
                  </span>
                </header>
                <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {items.map((application) => (
                    <article
                      key={application.id}
                      onClick={() => router.push(`/super/crm/cfa/apprenants/${application.id}`)}
                      className="cursor-pointer rounded-xl border border-white/10 bg-[#10284d]/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400/50 hover:bg-[#153461] hover:shadow-xl"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-gray-950">
                            {application.first_name} {application.last_name}
                          </h3>
                          <p className="mt-1 truncate text-xs text-gray-500">
                            {getCfaSpecializationLabel(application.specialization)}
                          </p>
                        </div>
                        <GraduationCap className="h-4 w-4 shrink-0 text-indigo-500" />
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-gray-500">
                        <a
                          href={`mailto:${application.email}`}
                          onClick={(event) => event.stopPropagation()}
                          className="flex items-center gap-2 truncate hover:text-indigo-600"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {application.email}
                        </a>
                        <p className="flex items-center gap-2">
                          <Clock3 className="h-3.5 w-3.5 shrink-0" />
                          {new Date(application.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <p className="mt-4 border-t border-gray-100 pt-3 text-xs font-semibold text-indigo-600">
                        Ouvrir la fiche complète
                      </p>
                      <div className="mt-4 border-t border-gray-100 pt-3">
                        <label className="text-[10px] font-semibold text-gray-400">
                          Statut
                        </label>
                        {readOnly ? (
                          <p className="mt-1 text-xs font-medium text-gray-700">{CFA_STATUS_LABELS[application.status]}</p>
                        ) : (
                          <select
                            value={application.status}
                            disabled={updating === application.id}
                            onChange={(event) =>
                              void changeStatus(
                                application,
                                event.target.value as CfaApplicationStatus,
                              )
                            }
                            onClick={(event) => event.stopPropagation()}
                            className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none focus:border-indigo-400"
                          >
                            {CFA_APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {CFA_STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </article>
                  ))}
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-xs text-gray-400">
                      {column.id === "brochure" ? "Aucun téléchargement" : "Aucun candidat"}
                    </div>
                  ) : null}
                </div>
              </section>
            );
          })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
