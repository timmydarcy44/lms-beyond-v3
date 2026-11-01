"use client";

import { useEffect, useState } from "react";
import { DOMAIN_COLORS } from "@/lib/openbadges/badge-catalog";

type Domain = { id: string; name: string; color: string; icon: string; archivedAt: string | null };

export function DomainManager() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(DOMAIN_COLORS[0]);

  const load = async () => {
    const response = await fetch("/api/super-admin/open-badges/catalog");
    const payload = await response.json();
    setDomains(Array.isArray(payload.domains) ? payload.domains : []);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (body: Record<string, unknown>) => {
    await fetch("/api/super-admin/open-badges/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); void save({ action: "upsert-domain", name, color, icon: "brain" }); setName(""); }}>
        <label className="text-sm">
          Nom
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block rounded-xl border px-3 py-2" />
        </label>
        <div className="flex gap-2">
          {DOMAIN_COLORS.map((item) => (
            <button key={item} type="button" aria-label={item} onClick={() => setColor(item)} className="h-7 w-7 rounded-full" style={{ background: item, outline: color === item ? "2px solid #111" : "none" }} />
          ))}
        </div>
        <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">Créer</button>
      </form>
      <ul className="divide-y rounded-2xl border">
        {domains.map((domain) => (
          <li key={domain.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: domain.color }} />
              {domain.name}{domain.archivedAt ? " · archivé" : ""}
            </span>
            <span className="flex gap-2 text-sm">
              <button type="button" onClick={() => {
                const next = window.prompt("Nouveau nom", domain.name);
                if (next?.trim()) void save({ action: "upsert-domain", id: domain.id, name: next.trim(), color: domain.color, icon: domain.icon });
              }}>Renommer</button>
              <button type="button" onClick={() => {
                const target = domains.find((item) => item.id !== domain.id && !item.archivedAt);
                if (!target) return;
                if (window.confirm(`Fusionner « ${domain.name} » dans « ${target.name} » ?`)) void save({ action: "merge-domains", sourceId: domain.id, targetId: target.id });
              }}>Fusionner</button>
              <button type="button" onClick={() => void save({ action: "upsert-domain", id: domain.id, name: domain.name, color: domain.color, icon: domain.icon, archived: !domain.archivedAt })}>
                {domain.archivedAt ? "Réactiver" : "Archiver"}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
