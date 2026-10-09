"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Clock3, Loader2, Mail, RefreshCw } from "lucide-react";

import {
  CFA_APPLICATION_STATUSES,
  CFA_STATUS_LABELS,
  type CfaApplicationStatus,
} from "@/lib/cfa-applications";
import { cn } from "@/lib/utils";

type CfaCompany = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: CfaApplicationStatus;
  created_at: string;
};

const columns: {
  id: string;
  label: string;
  statuses: CfaApplicationStatus[];
  accent: string;
}[] = [
  { id: "application", label: "Application", statuses: ["profile", "challenge", "dossier"], accent: "bg-slate-400" },
  { id: "interview", label: "Interview", statuses: ["interview"], accent: "bg-sky-500" },
  { id: "review", label: "Review", statuses: ["review"], accent: "bg-amber-500" },
  { id: "administrative", label: "Éléments administratifs", statuses: ["administrative"], accent: "bg-violet-500" },
  { id: "admitted", label: "Admitted", statuses: ["admitted"], accent: "bg-emerald-500" },
  { id: "rejected", label: "Non retenu", statuses: ["rejected"], accent: "bg-rose-400" },
];

export function CfaCompanyPipelineClient() {
  const [companies, setCompanies] = useState<CfaCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/companies", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible");
      setCompanies(result.companies ?? []);
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
      total: companies.length,
      fresh: companies.filter((item) => ["profile", "challenge", "dossier"].includes(item.status)).length,
      review: companies.filter((item) => item.status === "review").length,
      admitted: companies.filter((item) => item.status === "admitted").length,
    }),
    [companies],
  );

  async function changeStatus(company: CfaCompany, status: CfaApplicationStatus) {
    setUpdating(company.id);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: company.id, status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Mise à jour impossible");
      setCompanies((current) => current.map((item) => (item.id === company.id ? result.company : item)));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Mise à jour impossible");
    } finally {
      setUpdating(null);
    }
  }

  async function createCompany(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, contactName, email, phone }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      setCompanies((current) => [result.company, ...current]);
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 px-3 py-6 text-white sm:px-6 sm:py-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">CRM Entreprise · CFA</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">Entreprises partenaires</h1>
          <p className="mt-2 text-sm text-gray-500">
            Même pipeline que les apprenants : application, entretien, review, administratif, admission.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualiser
        </button>
      </div>

      <form onSubmit={(event) => void createCompany(event)} className="grid gap-3 rounded-2xl border border-white/10 bg-white/80 p-4 sm:grid-cols-5">
        <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required placeholder="Entreprise" className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900" />
        <input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Contact" className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900" />
        <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Téléphone" className="h-10 rounded-lg border border-gray-200 px-3 text-sm text-gray-900" />
        <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#070b1f] text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Ajout…" : "Ajouter"}
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Entreprises", counts.total],
          ["À qualifier", counts.fresh],
          ["En review", counts.review],
          ["Partenaires", counts.admitted],
        ].map(([label, value]) => (
          <div key={String(label)} className="super-glass-panel rounded-2xl border border-white/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </div>

      {migrationRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Applique la migration 20261009190000_cfa_companies.sql pour activer le CRM entreprises.
        </div>
      ) : null}
      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="-mx-3 min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-2 sm:-mx-6">
          <div className="flex w-max min-w-full flex-nowrap gap-4 px-3 pb-5 sm:px-6">
            {columns.map((column) => {
              const items = companies.filter((company) => column.statuses.includes(company.status));
              return (
                <section key={column.id} className="super-glass-panel flex h-[min(72vh,760px)] w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 p-3">
                  <header className="flex shrink-0 items-center justify-between px-1 py-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", column.accent)} />
                      <h2 className="text-sm font-semibold text-gray-800">{column.label}</h2>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">{items.length}</span>
                  </header>
                  <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {items.map((company) => (
                      <article key={company.id} className="rounded-xl border border-white/10 bg-[#10284d]/80 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-gray-950">{company.company_name}</h3>
                            <p className="mt-1 truncate text-xs text-gray-500">{company.contact_name || "Contact à préciser"}</p>
                          </div>
                          <Building2 className="h-4 w-4 shrink-0 text-indigo-500" />
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-gray-500">
                          {company.email ? (
                            <a href={`mailto:${company.email}`} className="flex items-center gap-2 truncate hover:text-indigo-600">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              {company.email}
                            </a>
                          ) : null}
                          <p className="flex items-center gap-2">
                            <Clock3 className="h-3.5 w-3.5 shrink-0" />
                            {new Date(company.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <div className="mt-4 border-t border-gray-100 pt-3">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Statut</label>
                          <select
                            value={company.status}
                            disabled={updating === company.id}
                            onChange={(event) => void changeStatus(company, event.target.value as CfaApplicationStatus)}
                            className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none focus:border-indigo-400"
                          >
                            {CFA_APPLICATION_STATUSES.map((status) => (
                              <option key={status} value={status}>{CFA_STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </div>
                      </article>
                    ))}
                    {items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 px-3 py-8 text-center text-xs text-gray-400">
                        Aucune entreprise
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
