"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCfaSpecializationLabel } from "@/lib/cfa-applications";
import type { BusinessDevLead } from "@/lib/cfa/business-dev";

const TERRITORY: Record<string, string> = {
  normandie: "Normandie",
  idf: "Région parisienne",
  france: "France",
};

type Run = { started_at?: string; finished_at?: string | null; found_count?: number; error?: string | null };

export function AgentBusinessDevClient() {
  const [leads, setLeads] = useState<BusinessDevLead[]>([]);
  const [run, setRun] = useState<Run | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [companyName, setCompanyName] = useState("");

  async function load() {
    const response = await fetch("/api/super-admin/crm/cfa/business-dev", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok && !result.leads) {
      setMessage(result.error || "Chargement impossible");
      return;
    }
    setLeads(result.leads ?? []);
    setRun(result.run ?? null);
    if (result.error) setMessage(result.error);
  }

  useEffect(() => {
    void load();
  }, []);

  async function send(body: Record<string, string>) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/super-admin/crm/cfa/business-dev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Action impossible");
      if (body.action === "run") setMessage(result.notice || (result.created ? `${result.created} entreprises ajoutées à la file.` : "Aucune nouvelle entreprise aujourd'hui."));
      if (body.action === "capture") {
        setMessage(`${result.companyName} ajoutée à la file.`);
        setPageUrl("");
        setCompanyName("");
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  const last = run?.started_at ? new Date(run.started_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Pas encore lancée";

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-500">Commercial · CFA</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-950">Agent Business Dev</h1>
          <p className="mt-1 text-sm text-gray-600">La recherche automatique lit les offres dès que la clé La bonne alternance est en place. En attendant, collez une page publique : elle entre dans la file seulement si elle cite une alternance pour septembre 2027. La Normandie et la région parisienne passent devant. Aucun e-mail, aucun appel, aucun message.</p>
        </div>
        <button type="button" disabled={busy} className="h-10 rounded-full bg-indigo-600 px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void send({ action: "run" })}>Lancer la recherche</button>
      </div>
      <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); if (pageUrl.trim()) void send({ action: "capture", url: pageUrl.trim(), companyName: companyName.trim() }); }}>
        <input value={pageUrl} onChange={(event) => setPageUrl(event.target.value)} placeholder="https://… page publique" className="h-10 min-w-[16rem] flex-1 rounded-full border border-gray-200 px-4 text-sm" />
        <input value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nom de l'entreprise" className="h-10 w-52 rounded-full border border-gray-200 px-4 text-sm" />
        <button type="submit" disabled={busy || !pageUrl.trim()} className="h-10 rounded-full border border-indigo-200 px-4 text-sm font-semibold text-indigo-700 disabled:opacity-50">Lire la page</button>
      </form>
      <p className="text-xs text-gray-500">Dernière recherche : {last}{typeof run?.found_count === "number" ? ` · ${run.found_count} trouvées` : ""}</p>
      {message ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">{message}</p> : null}
      <ul className="space-y-3">
        {leads.map((lead) => (
          <li key={lead.id} className="super-glass-panel rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-950">{lead.company_name}</p>
                <p className="mt-1 text-xs text-gray-500">{[lead.city, lead.siret, TERRITORY[lead.territory]].filter(Boolean).join(" · ")}</p>
                <p className="mt-2 text-sm text-gray-700">{lead.reason}</p>
                <p className="mt-1 text-xs text-gray-500">{lead.cursus_id ? getCfaSpecializationLabel(lead.cursus_id) : "Cursus à préciser"}{lead.naf_label ? ` · ${lead.naf_label}` : ""}{lead.mentions_title ? " · Titre pro mentionné" : ""}</p>
                {lead.source_url ? <a href={lead.source_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-indigo-600">Voir la source</a> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" disabled={busy} className="h-9 rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white" onClick={() => void send({ action: "accept", leadId: lead.id })}>Valider</button>
                <button type="button" disabled={busy} className="h-9 rounded-full border border-gray-200 px-3 text-xs font-semibold text-gray-700" onClick={() => void send({ action: "dismiss", leadId: lead.id })}>Écarter</button>
              </div>
            </div>
            {lead.company_id ? <Link href={`/super/cfa/entreprises/${lead.company_id}`} className="mt-2 inline-block text-xs font-semibold text-indigo-600">Ouvrir la fiche</Link> : null}
          </li>
        ))}
      </ul>
      {!leads.length ? <p className="text-sm text-gray-500">Aucune entreprise en attente. Collez une page publique, ou lancez la recherche quand la clé est en place.</p> : null}
    </div>
  );
}
