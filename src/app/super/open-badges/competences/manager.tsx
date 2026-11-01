"use client";

import { useEffect, useMemo, useState } from "react";
import type { ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";

export function CompetencyManager() {
  const [competencies, setCompetencies] = useState<ByoundCompetencyDraft[]>([]);
  const [query, setQuery] = useState("");

  const load = async () => {
    const response = await fetch("/api/super-admin/open-badges/catalog");
    const payload = await response.json();
    setCompetencies(Array.isArray(payload.competencies) ? payload.competencies : []);
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return competencies.filter((item) => !text || `${item.name} ${item.definition}`.toLowerCase().includes(text));
  }, [competencies, query]);

  const save = async (body: Record<string, unknown>) => {
    await fetch("/api/super-admin/open-badges/catalog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  return (
    <div className="space-y-4">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher une compétence" className="w-full max-w-md rounded-xl border px-3 py-2" />
      <ul className="divide-y rounded-2xl border">
        {visible.map((item) => (
          <li key={item.id} className="space-y-2 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-slate-600">{item.definition}</p>
                <p className="text-xs text-slate-500">{item.status === "validated" ? `Validée${item.validatedBy ? ` par ${item.validatedBy}` : ""}` : "Brouillon"}{item.archivedAt ? " · archivée" : ""}</p>
              </div>
              <span className="flex gap-2 text-sm">
                <button type="button" onClick={() => {
                  const target = competencies.find((row) => row.id !== item.id && !row.archivedAt);
                  if (target && window.confirm(`Fusionner « ${item.name} » dans « ${target.name} » ?`)) void save({ action: "merge-competencies", sourceId: item.id, targetId: target.id });
                }}>Fusionner</button>
                <button type="button" onClick={() => void save({ action: "upsert-competency", ...item, archived: !item.archivedAt })}>
                  {item.archivedAt ? "Réactiver" : "Archiver"}
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
