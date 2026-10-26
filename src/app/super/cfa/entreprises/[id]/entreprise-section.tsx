"use client";

import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { cleanSiret, isValidSiret } from "@/lib/cfa/siret";

export type IdentityCompany = {
  id: string;
  company_name: string;
  siret?: string | null;
  trade_name?: string | null;
  address_line?: string | null;
  company_address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  naf_code?: string | null;
  naf_label?: string | null;
  headcount_range?: string | null;
  idcc?: string | null;
  idcc_label?: string | null;
  opco?: string | null;
  opco_source?: string | null;
  opco_checked_at?: string | null;
  registry_synced_at?: string | null;
  structure_type?: string | null;
};

type RegistryCompany = {
  siret: string;
  companyName: string;
  tradeName: string;
  addressLine: string;
  postalCode: string;
  city: string;
  nafCode: string;
  nafLabel: string;
  headcountRange: string;
  idcc: string;
  idccLabel: string;
};

const STRUCTURES = [
  ["independent", "Indépendant"],
  ["franchise", "Franchisé"],
  ["group", "Groupe / réseau"],
  ["association", "Association"],
  ["public", "Employeur public"],
] as const;

type Draft = {
  siret: string;
  company_name: string;
  trade_name: string;
  address_line: string;
  postal_code: string;
  city: string;
  naf_code: string;
  naf_label: string;
  headcount_range: string;
  idcc: string;
  idcc_label: string;
  structure_type: string;
  opco: string;
};

function toDraft(company: IdentityCompany): Draft {
  return {
    siret: company.siret ?? "",
    company_name: company.company_name ?? "",
    trade_name: company.trade_name ?? "",
    address_line: company.address_line || company.company_address || "",
    postal_code: company.postal_code ?? "",
    city: company.city ?? "",
    naf_code: company.naf_code ?? "",
    naf_label: company.naf_label ?? "",
    headcount_range: company.headcount_range ?? "",
    idcc: company.idcc ?? "",
    idcc_label: company.idcc_label ?? "",
    structure_type: company.structure_type ?? "",
    opco: company.opco ?? "",
  };
}

function countFields(draft: Draft) {
  return [draft.siret, draft.company_name, draft.trade_name, draft.address_line, draft.postal_code, draft.city, draft.naf_code, draft.headcount_range].filter((value) => value.trim()).length;
}

function fieldClass(value: string) {
  return `mt-1 w-full rounded-2xl border bg-[#0B1122] px-3 py-2 text-sm outline-none placeholder:text-[#8A7340] ${value.trim() ? "border-[#26304F]" : "border-[#5A4A1E]"}`;
}

function syncedLabel(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function EntrepriseSection({
  company,
  onCompany,
  onMessage,
}: {
  company: IdentityCompany;
  onCompany: (company: IdentityCompany) => void;
  onMessage: (message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(company));
  const [source, setSource] = useState(company.opco_source ?? null);
  const [syncedAt, setSyncedAt] = useState(company.registry_synced_at ?? null);
  const [matches, setMatches] = useState<RegistryCompany[]>([]);
  const [lookupBusy, setLookupBusy] = useState(false);
  const firstSave = useRef(true);
  const fromRegistry = useRef(false);
  const opcoTouched = useRef(false);
  const registryKey = useRef("");
  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    if (opcoTouched.current) return;
    setDraft((current) => (current.opco === (company.opco ?? "") ? current : { ...current, opco: company.opco ?? "" }));
    setSource(company.opco_source ?? null);
  }, [company.opco, company.opco_source]);

  useEffect(() => {
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      void persist(draft);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft]);

  async function persist(snapshot: Draft) {
    const response = await fetch(`/api/super-admin/crm/cfa/companies/${company.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "identity",
        ...snapshot,
        structure_type: snapshot.structure_type || null,
        fromRegistry: fromRegistry.current,
        opcoTouched: opcoTouched.current,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      onMessage(result.error || "Enregistrement impossible");
      return;
    }
    fromRegistry.current = false;
    if (opcoTouched.current && snapshot.opco.trim() === String(result.company?.opco ?? "").trim()) opcoTouched.current = false;
    const next = result.company as IdentityCompany;
    setSource(next.opco_source ?? null);
    setSyncedAt(next.registry_synced_at ?? null);
    onCompany({ ...company, ...next });
    onMessage("");
  }

  async function search(query: string) {
    const key = query.trim();
    if (!key || key === registryKey.current) return;
    registryKey.current = key;
    setLookupBusy(true);
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/registry?q=${encodeURIComponent(key)}`);
      const result = await response.json();
      if (!response.ok) {
        onMessage(result.error || "L'annuaire des entreprises est indisponible.");
        return;
      }
      const companies = (result.companies ?? []) as RegistryCompany[];
      if (companies.length === 1) applyRegistry(companies[0]);
      else setMatches(companies);
      if (!companies.length) onMessage("Aucune entreprise trouvée dans l'annuaire.");
    } finally {
      setLookupBusy(false);
    }
  }

  function applyRegistry(match: RegistryCompany) {
    fromRegistry.current = true;
    setMatches([]);
    setDraft((current) => ({
      ...current,
      siret: match.siret,
      company_name: match.companyName || current.company_name,
      trade_name: match.tradeName,
      address_line: match.addressLine,
      postal_code: match.postalCode,
      city: match.city,
      naf_code: match.nafCode,
      naf_label: match.nafLabel,
      headcount_range: match.headcountRange,
      idcc: match.idcc,
      idcc_label: match.idccLabel,
    }));
  }

  function edit(name: keyof Draft, value: string) {
    setDraft((current) => ({ ...current, [name]: value }));
    if (name === "opco") {
      opcoTouched.current = true;
      setSource(value.trim() ? "manual" : null);
    }
    if (name === "siret" || name === "company_name") {
      const next = name === "siret" ? value : draft.siret;
      const label = name === "company_name" ? value : draft.company_name;
      const digits = cleanSiret(next);
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
      if (isValidSiret(digits)) searchTimer.current = window.setTimeout(() => void search(digits), 400);
      else if (name === "company_name" && label.trim().length >= 3) searchTimer.current = window.setTimeout(() => void search(label.trim()), 800);
    }
  }

  async function retryOpco() {
    setLookupBusy(true);
    onMessage("");
    try {
      const response = await fetch(`/api/super-admin/crm/cfa/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refresh_opco" }),
      });
      const result = await response.json();
      if (!response.ok) {
        onMessage(result.error || "La recherche OPCO a échoué.");
        return;
      }
      const next = result.company as IdentityCompany;
      if (!opcoTouched.current) setDraft((current) => ({ ...current, opco: next.opco ?? "" }));
      setSource(next.opco_source ?? null);
      onCompany({ ...company, ...next });
    } finally {
      setLookupBusy(false);
    }
  }

  const opco = draft.opco.trim();
  const synced = syncedLabel(syncedAt);
  const count = countFields(draft);

  return (
    <section id="entreprise" className="scroll-mt-28 rounded-[26px] border border-[#1A2340] bg-[#111831] p-5" style={{ borderTop: "4px solid #6E5BFF" }}>
      <header className="-mx-5 -mt-5 mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-[#1A2340] px-5 py-4" style={{ background: "linear-gradient(90deg, #6E5BFF2E, transparent 75%)" }}>
        <div className="flex gap-3">
          <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[#6E5BFF] text-white"><Building2 className="h-5 w-5" /></span>
          <div>
            <p className="text-xs font-extrabold text-[#C9C1FF]">1 · Entreprise</p>
            <h2 className="text-xl font-extrabold">Entreprise</h2>
            <p className="text-xs text-[#AEB6CC]">Identité, annuaire et OPCO.</p>
          </div>
        </div>
        <span className="rounded-full bg-[#6E5BFF24] px-3 py-1 text-xs font-extrabold text-[#C9C1FF]">{count} / 8 champs</span>
      </header>

      {synced ? (
        <p className="mb-4 rounded-2xl bg-[#14233A] px-4 py-3 text-sm text-[#B9AFFF]">Rempli depuis l'annuaire des entreprises · {synced}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label id="champ-siret" className="block scroll-mt-28 text-sm">SIRET
          <input value={draft.siret} inputMode="numeric" placeholder="À compléter" onChange={(event) => edit("siret", event.target.value)} className={fieldClass(draft.siret)} />
        </label>
        <label className="block text-sm">Raison sociale
          <input value={draft.company_name} placeholder="À compléter" onChange={(event) => edit("company_name", event.target.value)} className={fieldClass(draft.company_name)} />
        </label>
        <label className="block text-sm">Enseigne
          <input value={draft.trade_name} placeholder="À compléter" onChange={(event) => edit("trade_name", event.target.value)} className={fieldClass(draft.trade_name)} />
        </label>
        <label className="block text-sm sm:col-span-2">Adresse
          <input value={draft.address_line} placeholder="À compléter" onChange={(event) => edit("address_line", event.target.value)} className={fieldClass(draft.address_line)} />
        </label>
        <label className="block text-sm">Code postal
          <input value={draft.postal_code} inputMode="numeric" placeholder="À compléter" onChange={(event) => edit("postal_code", event.target.value)} className={fieldClass(draft.postal_code)} />
        </label>
        <label className="block text-sm">Ville
          <input value={draft.city} placeholder="À compléter" onChange={(event) => edit("city", event.target.value)} className={fieldClass(draft.city)} />
        </label>
        <label id="champ-naf" className="block scroll-mt-28 text-sm">Code NAF
          <input value={draft.naf_code} placeholder="À compléter" onChange={(event) => edit("naf_code", event.target.value)} className={fieldClass(draft.naf_code)} />
        </label>
        <label className="block text-sm">Libellé NAF
          <input value={draft.naf_label} placeholder="À compléter" onChange={(event) => edit("naf_label", event.target.value)} className={fieldClass(draft.naf_label)} />
        </label>
        <label className="block text-sm">Effectif
          <input value={draft.headcount_range} placeholder="À compléter" onChange={(event) => edit("headcount_range", event.target.value)} className={fieldClass(draft.headcount_range)} />
        </label>
        <label className="block text-sm">IDCC
          <input value={draft.idcc} placeholder="À compléter" onChange={(event) => edit("idcc", event.target.value)} className={fieldClass(draft.idcc)} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="h-9 rounded-full border border-[#26304F] px-4 text-xs font-semibold" onClick={() => { registryKey.current = ""; void search(isValidSiret(cleanSiret(draft.siret)) ? cleanSiret(draft.siret) : draft.company_name); }}>
          {lookupBusy ? "Recherche…" : "Actualiser"}
        </button>
        {matches.length > 1 ? <p className="text-xs text-[#AEB6CC]">{matches.length} entreprises correspondent. Choisissez-en une.</p> : null}
      </div>
      {matches.length > 1 ? (
        <ul className="mt-3 space-y-2">
          {matches.map((match) => (
            <li key={match.siret}>
              <button type="button" className="w-full rounded-2xl border border-[#26304F] px-3 py-2 text-left text-sm" onClick={() => applyRegistry(match)}>
                {match.companyName} · {match.siret} · {match.city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <fieldset className="mt-5">
        <legend className="text-sm font-extrabold">Type de structure</legend>
        <div role="radiogroup" aria-label="Type de structure" className="mt-2 flex flex-wrap gap-2">
          {STRUCTURES.map(([value, label]) => {
            const active = draft.structure_type === value;
            return (
              <button key={value} type="button" role="radio" aria-checked={active} onClick={() => edit("structure_type", active ? "" : value)} className={`h-9 rounded-full px-3 text-xs font-extrabold ${active ? "bg-[#6E5BFF] text-white" : "bg-[#0B1122] text-[#AEB6CC]"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div id="champ-opco" className="mt-5 scroll-mt-28 rounded-2xl border border-[#1A2340] bg-[#0B1122] p-4">
        <label className="block text-sm font-extrabold">OPCO
          <input value={draft.opco} placeholder="À compléter" onChange={(event) => edit("opco", event.target.value)} className={fieldClass(draft.opco)} />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          {source === "cfadock" && opco ? <span className="text-xs text-[#AEB6CC]">source CFADock</span> : null}
          {source === "manual" && opco ? <span className="text-xs text-[#AEB6CC]">saisie manuelle</span> : null}
          {source === "idcc" && opco ? <span className="text-xs text-[#AEB6CC]">d'après la convention collective</span> : null}
          {source === "naf" ? (
            <>
              <span className="rounded-full bg-[#3A2A0E] px-3 py-1 text-xs font-extrabold text-[#F6D68B]">à confirmer</span>
              <span className="text-xs text-[#AEB6CC]">estimé d'après le code NAF</span>
            </>
          ) : null}
          {!opco && source !== "naf" ? (
            <>
              <span className="rounded-full bg-[#3A2A0E] px-3 py-1 text-xs font-extrabold text-[#F6D68B]">OPCO à confirmer</span>
              <button type="button" disabled={lookupBusy} className="h-8 rounded-full border border-[#26304F] px-3 text-xs font-semibold" onClick={() => void retryOpco()}>Relancer la recherche</button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
