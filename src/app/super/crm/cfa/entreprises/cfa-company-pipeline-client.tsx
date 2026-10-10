"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Plus, RefreshCw, X } from "lucide-react";

import { CFA_SPECIALIZATIONS, getCfaSpecializationLabel } from "@/lib/cfa-applications";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";
import {
  CFA_COMPANY_STATUSES,
  CFA_COMPANY_STATUS_LABELS,
  type CfaCompanyStatus,
} from "@/lib/cfa-companies";
import { cn } from "@/lib/utils";

type CfaCompany = {
  id: string;
  company_name: string;
  siret: string | null;
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_role: string | null;
  email: string | null;
  phone: string | null;
  company_address: string | null;
  soft_skills: string | null;
  apprentices_wanted: number | null;
  apprentice_track_1: string | null;
  status: CfaCompanyStatus;
  created_at: string;
};

const columns: { id: CfaCompanyStatus; label: string; accent: string }[] = [
  { id: "to_contact", label: "À contacter", accent: "bg-slate-400" },
  { id: "email_sent", label: "Mail envoyé", accent: "bg-sky-500" },
  { id: "appointment", label: "Rendez-vous programmé", accent: "bg-indigo-500" },
  { id: "pending_decision", label: "En attente de décision", accent: "bg-amber-500" },
  { id: "recruiting", label: "Recrutement en cours", accent: "bg-violet-500" },
  { id: "recruited", label: "Recrutement réussi", accent: "bg-emerald-500" },
  { id: "not_recruited", label: "Non recrutement", accent: "bg-rose-400" },
];

const fieldClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-indigo-400";

export function CfaCompanyPipelineClient() {
  const [companies, setCompanies] = useState<CfaCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [migrationRequired, setMigrationRequired] = useState(false);
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [siret, setSiret] = useState("");
  const [lookup, setLookup] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [track1, setTrack1] = useState("");
  const [softSkills, setSoftSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState<CfaCompany | null>(null);

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
      toContact: companies.filter((item) => item.status === "to_contact").length,
      recruiting: companies.filter((item) => item.status === "recruiting").length,
      recruited: companies.filter((item) => item.status === "recruited").length,
    }),
    [companies],
  );

  async function changeStatus(company: CfaCompany, status: CfaCompanyStatus) {
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

  function resetForm() {
    setCompanyName("");
    setCompanyAddress("");
    setSiret("");
    setLookup("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setContactRole("");
    setQuantity(1);
    setTrack1("");
    setSoftSkills([]);
  }

  function toggleSkill(skill: string) {
    setSoftSkills((current) => (current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]));
  }

  async function lookupSiret(value: string) {
    const digits = value.replace(/\s/g, "");
    setSiret(digits);
    setLookup("");
    if (!/^\d{14}$/.test(digits)) return;
    setLookup("Recherche du SIRET…");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/lookup?siret=${digits}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Entreprise introuvable");
      if (result.companyName) setCompanyName(result.companyName);
      if (result.address) setCompanyAddress(result.address);
      setLookup(result.companyName ? `Entreprise trouvée : ${result.companyName}` : "SIRET reconnu");
    } catch (lookupError) {
      setLookup(lookupError instanceof Error ? lookupError.message : "Recherche impossible");
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
        body: JSON.stringify({
          companyName,
          companyAddress,
          siret,
          firstName,
          lastName,
          contactRole,
          email,
          phone,
          apprenticesWanted: quantity,
          apprenticeTrack1: track1,
          softSkills: softSkills.join(" · "),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      setCompanies((current) => [result.company, ...current]);
      resetForm();
      setOpen(false);
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
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Du premier contact au recrutement des alternants.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#635BFF] px-4 text-sm font-semibold text-white hover:bg-[#554ee6]"
          >
            <Plus className="h-4 w-4" />
            Entreprise
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#10243f] px-4 text-sm font-semibold text-[#f8fbff] hover:bg-[#16325c]"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#050d1d]/75 p-4 sm:items-center">
          <form onSubmit={(event) => void createCompany(event)} className="super-nav-dropdown my-8 w-full max-w-2xl rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">CRM Entreprise</p>
                <h2 className="mt-1 text-xl font-bold text-[#f8fbff]">Nouvelle entreprise</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#d5e0f2] hover:bg-white/10" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#d5e0f2] sm:col-span-2">
                Numéro SIRET
                <input
                  value={siret}
                  onChange={(event) => void lookupSiret(event.target.value)}
                  required
                  inputMode="numeric"
                  minLength={14}
                  maxLength={14}
                  placeholder="14 chiffres"
                  className={cn(fieldClass, "mt-1")}
                />
                {lookup ? <span className="mt-1 block text-[11px] font-medium text-indigo-200">{lookup}</span> : null}
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2] sm:col-span-2">
                Entreprise
                <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} required placeholder="Raison sociale" className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Prénom
                <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Nom
                <input value={lastName} onChange={(event) => setLastName(event.target.value)} required className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Adresse mail
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Numéro de téléphone
                <input value={phone} onChange={(event) => setPhone(event.target.value)} className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Qualité
                <input value={contactRole} onChange={(event) => setContactRole(event.target.value)} placeholder="Dirigeant, RH, tuteur…" className={cn(fieldClass, "mt-1")} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Quantité
                <input
                  value={quantity}
                  onChange={(event) => setQuantity(Math.min(30, Math.max(1, Number(event.target.value) || 1)))}
                  type="number"
                  min={1}
                  max={30}
                  required
                  className={cn(fieldClass, "mt-1")}
                />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2] sm:col-span-2">
                Besoin cursus
                <select value={track1} onChange={(event) => setTrack1(event.target.value)} required className={cn(fieldClass, "mt-1")}>
                  <option value="">Choisir le cursus</option>
                  {CFA_SPECIALIZATIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.group} — {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className="sm:col-span-2">
                <legend className="text-xs font-semibold text-[#d5e0f2]">Soft skills pour le ou les postes</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SOFT_SKILLS.map((skill) => {
                    const active = softSkills.includes(skill.titre);
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.titre)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-medium",
                          active ? "border-[#635BFF] bg-[#635BFF] text-white" : "border-white/15 text-[#d5e0f2] hover:bg-white/10",
                        )}
                      >
                        {skill.titre}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg px-4 text-sm font-semibold text-[#d5e0f2] hover:bg-white/10">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#635BFF] px-4 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Création…" : "Créer l’entreprise"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {selected ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#050d1d]/75 p-4 sm:items-center">
          <div className="super-nav-dropdown my-8 w-full max-w-lg rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Fiche entreprise</p>
                <h2 className="mt-1 text-xl font-bold text-[#f8fbff]">{selected.company_name}</h2>
                <p className="mt-1 text-sm text-[#9eb0cc]">{selected.siret}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-full p-2 text-[#d5e0f2] hover:bg-white/10" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-5 space-y-3 text-sm text-[#d5e0f2]">
              {[
                ["Contact", [selected.contact_first_name, selected.contact_last_name].filter(Boolean).join(" ") || selected.contact_name],
                ["Qualité", selected.contact_role],
                ["Email", selected.email],
                ["Téléphone", selected.phone],
                ["Adresse", selected.company_address],
                ["Cursus", selected.apprentice_track_1 ? getCfaSpecializationLabel(selected.apprentice_track_1) : null],
                ["Quantité", selected.apprentices_wanted ? String(selected.apprentices_wanted) : null],
                ["Statut", CFA_COMPANY_STATUS_LABELS[selected.status]],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9eb0cc]">{label}</dt>
                  <dd className="mt-0.5 text-[#f8fbff]">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9eb0cc]">Soft skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(selected.soft_skills ?? "").split("·").map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                  <span key={skill} className="rounded-full bg-[#635BFF] px-3 py-1 text-xs font-medium text-white">{skill}</span>
                ))}
                {!selected.soft_skills ? <span className="text-sm text-[#9eb0cc]">Aucune soft skill</span> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Entreprises", counts.total],
          ["À contacter", counts.toContact],
          ["Recrutement en cours", counts.recruiting],
          ["Recrutements réussis", counts.recruited],
        ].map(([label, value]) => (
          <div key={String(label)} className="super-glass-panel rounded-2xl border border-white/10 p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          </div>
        ))}
      </div>

      {migrationRequired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Applique la migration 20261010120000_cfa_companies_contact.sql.
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
              const items = companies.filter((company) => company.status === column.id);
              return (
                <section key={column.id} className="super-glass-panel flex h-[min(72vh,760px)] w-[280px] min-w-[280px] max-w-[280px] shrink-0 flex-col rounded-2xl border border-white/10 p-3">
                  <header className="flex shrink-0 items-center justify-between gap-2 px-1 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", column.accent)} />
                      <h2 className="text-sm font-semibold leading-tight text-gray-800">{column.label}</h2>
                    </div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500">{items.length}</span>
                  </header>
                  <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {items.map((company) => (
                      <article
                        key={company.id}
                        onClick={() => setSelected(company)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(company);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className="cursor-pointer rounded-xl border border-white/10 bg-[#10284d]/80 p-4 text-left shadow-sm hover:border-[#635BFF]/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-gray-950">{company.company_name}</h3>
                            <p className="mt-1 truncate text-xs text-gray-500">{company.siret || "SIRET à préciser"}</p>
                          </div>
                          <Building2 className="h-4 w-4 shrink-0 text-indigo-500" />
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-gray-600">
                          <p>{company.contact_name || "Contact à préciser"}{company.contact_role ? ` · ${company.contact_role}` : ""}</p>
                          <p>
                            {company.apprentices_wanted ?? "—"} · {company.apprentice_track_1 ? getCfaSpecializationLabel(company.apprentice_track_1) : "Cursus à préciser"}
                          </p>
                          {company.soft_skills ? (
                            <p className="line-clamp-2">{company.soft_skills}</p>
                          ) : null}
                        </div>
                        <div className="mt-4 border-t border-gray-100 pt-3" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Statut</label>
                          <select
                            value={company.status}
                            disabled={updating === company.id}
                            onChange={(event) => void changeStatus(company, event.target.value as CfaCompanyStatus)}
                            className="mt-1 h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs font-medium text-gray-700 outline-none focus:border-indigo-400"
                          >
                            {CFA_COMPANY_STATUSES.map((status) => (
                              <option key={status} value={status}>{CFA_COMPANY_STATUS_LABELS[status]}</option>
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
