"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight } from "lucide-react";
import { KpiCard, SegmentedFilter, SidePanel, fieldClass } from "@/components/control/chrome";
import { DataTable, PageHeader, RolePill } from "@/components/control/ui";
import type { CompanyListItem } from "@/lib/control/companies";

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "E") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function EntreprisesClient({ items, schemaReady }: { items: CompanyListItem[]; schemaReady: boolean }) {
  const router = useRouter();
  const [filter, setFilter] = useState("toutes");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const demoCount = items.filter((item) => item.isDemo).length;
  const visible = items.filter((item) => showDemo || !item.isDemo);
  const sectors = [...new Set(visible.map((item) => item.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const counts = {
    toutes: visible.length,
    business: visible.filter((item) => item.roleBusiness && !item.roleCfa).length,
    cfa: visible.filter((item) => item.roleCfa && !item.roleBusiness).length,
    both: visible.filter((item) => item.roleBusiness && item.roleCfa).length,
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible.filter((item) => {
      if (filter === "business" && !(item.roleBusiness && !item.roleCfa)) return false;
      if (filter === "cfa" && !(item.roleCfa && !item.roleBusiness)) return false;
      if (filter === "both" && !(item.roleBusiness && item.roleCfa)) return false;
      if (sector && item.sector !== sector) return false;
      if (!q) return true;
      return [item.name, item.siret, item.city].join(" ").toLowerCase().includes(q);
    });
  }, [visible, filter, query, sector]);

  async function create(form: FormData) {
    setPending(true);
    setError("");
    const response = await fetch("/api/super/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        city: form.get("city"),
        siret: form.get("siret"),
        sector: form.get("sector"),
        roleBusiness: form.get("roleBusiness") === "on",
        roleCfa: form.get("roleCfa") === "on",
      }),
    });
    const result = (await response.json()) as { id?: string; error?: string };
    setPending(false);
    if (!response.ok || !result.id) {
      setError(result.error || "Création impossible");
      if (result.id) router.push(`/super/entreprises/${result.id}`);
      return;
    }
    router.push(`/super/entreprises/${result.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-6 py-8">
      <PageHeader
        title="Entreprises"
        subtitle={
          schemaReady
            ? "Une fiche, deux rôles possibles."
            : "Annuaire partiel : collez 20261104150000_companies.sql pour unifier Business et CFA."
        }
        actions={
          <>
            <a href="/super/entreprises/doublons" className="rounded-full border border-[#26304F] px-4 py-2 text-sm text-white">
              Doublons
            </a>
            <button type="button" onClick={() => setCreating(true)} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white">
              ＋ Entreprise
            </button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Toutes" value={String(counts.toutes)} icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Business" value={String(counts.business)} tone="#8B7BFF" icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="CFA" value={String(counts.cfa)} tone="#5EDCC3" icon={<Building2 className="h-4 w-4" />} />
        <KpiCard label="Business + CFA" value={String(counts.both)} tone="#8DB8FF" icon={<Building2 className="h-4 w-4" />} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedFilter
          value={filter}
          onChange={setFilter}
          items={[
            { id: "toutes", label: "Toutes", count: counts.toutes },
            { id: "business", label: "Business", count: counts.business },
            { id: "cfa", label: "CFA", count: counts.cfa },
            { id: "both", label: "Business + CFA", count: counts.both },
          ]}
        />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nom, SIRET, ville" className={`${fieldClass} max-w-xs`} />
        <select value={sector} onChange={(event) => setSector(event.target.value)} className={`${fieldClass} max-w-[220px]`}>
          <option value="">Secteur</option>
          {sectors.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#9AA3BD]">
          <input type="checkbox" checked={showDemo} onChange={(event) => setShowDemo(event.target.checked)} />
          Afficher les comptes de démo ({demoCount})
        </label>
      </div>
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        onRow={(row) => router.push(`/super/entreprises/${row.id}`)}
        empty={<p className="rounded-[22px] border border-[#1A2340] bg-[#111831] px-6 py-12 text-center text-sm text-[#9AA3BD]">Aucune entreprise pour ce filtre.</p>}
        columns={[
          {
            id: "name",
            header: "Entreprise",
            cell: (row) => (
              <span className="flex items-center gap-3">
                {row.logoUrl ? (
                  <img src={row.logoUrl} alt="" className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#241C4A] text-xs font-bold text-[#C4BAFF]">{initials(row.name)}</span>
                )}
                <span>
                  <span className="block font-semibold">{row.name}</span>
                  <span className="block text-[12px] text-[#9AA3BD]">{[row.city, row.sector].filter(Boolean).join(" · ") || "Ville non renseignée"}</span>
                </span>
              </span>
            ),
          },
          {
            id: "role",
            header: "Rôle",
            cell: (row) => (
              <span className="flex flex-nowrap gap-1">
                {row.roleBusiness ? <RolePill role="business" /> : null}
                {row.roleCfa ? <RolePill role="cfa" /> : null}
              </span>
            ),
          },
          { id: "business", header: "Business", cell: (row) => (row.roleBusiness ? row.businessLabel : "—") },
          {
            id: "cfa",
            header: "CFA",
            cell: (row) => (row.roleCfa ? `${row.apprentices} apprentis · ${row.offers} offres · ${row.candidates} candidats` : "—"),
          },
          { id: "owner", header: "Responsable", cell: (row) => row.owner },
          { id: "go", header: "", cell: () => <ChevronRight className="h-4 w-4 text-[#6C7593]" /> },
        ]}
      />
      {creating ? (
        <SidePanel title="Nouvelle entreprise" onClose={() => setCreating(false)}>
          <form action={(form) => void create(form)} className="space-y-3">
            <label className="block text-sm text-[#9AA3BD]">Nom<input name="name" required className={fieldClass} /></label>
            <label className="block text-sm text-[#9AA3BD]">Ville<input name="city" className={fieldClass} /></label>
            <label className="block text-sm text-[#9AA3BD]">SIRET<input name="siret" inputMode="numeric" className={fieldClass} /></label>
            <label className="block text-sm text-[#9AA3BD]">Secteur<input name="sector" className={fieldClass} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="roleBusiness" defaultChecked /> Business</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="roleCfa" /> CFA, entreprise d'accueil</label>
            {error ? <p className="text-sm text-[#FF8AA0]">{error}</p> : null}
            <button type="submit" disabled={pending || !schemaReady} className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {schemaReady ? "Créer la fiche" : "Script SQL requis"}
            </button>
          </form>
        </SidePanel>
      ) : null}
    </div>
  );
}
