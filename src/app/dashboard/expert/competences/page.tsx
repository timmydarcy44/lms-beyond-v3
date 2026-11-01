"use client";

import { useEffect, useState } from "react";
import { ExpertPageFrame, ExpertPageHeader } from "@/components/expert/expert-ui";
import type { ByoundCompetencyDraft } from "@/lib/openbadges/badge-builder";

export default function ExpertCompetenciesPage() {
  const [rows, setRows] = useState<ByoundCompetencyDraft[]>([]);
  const [definitions, setDefinitions] = useState<Record<string, string>>({});

  const load = async () => {
    const response = await fetch("/api/expert/competencies");
    const payload = await response.json();
    const competencies = Array.isArray(payload.competencies) ? payload.competencies as ByoundCompetencyDraft[] : [];
    setRows(competencies);
    setDefinitions(Object.fromEntries(competencies.map((item) => [item.id, item.definition])));
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Compétences à valider" subtitle="Relisez la définition, puis validez." />
      {rows.length === 0 ? <p className="text-sm text-[#B5BAC6]">Aucune compétence en attente.</p> : (
        <ul className="space-y-4">
          {rows.map((item) => (
            <li key={item.id} className="rounded-[28px] bg-[#12141A] p-6">
              <p className="text-xl font-bold text-[#F4F5F7]">{item.name}</p>
              <textarea value={definitions[item.id] ?? ""} onChange={(event) => setDefinitions((current) => ({ ...current, [item.id]: event.target.value }))} rows={4} className="mt-3 w-full rounded-2xl border border-white/10 bg-transparent px-3 py-2 text-sm" />
              <button
                type="button"
                className="mt-3 rounded-full bg-[#F4F5F7] px-4 py-2 text-sm font-semibold text-[#12141A]"
                onClick={() => {
                  void fetch("/api/expert/competencies", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: item.id, definition: definitions[item.id] }),
                  }).then(() => load());
                }}
              >
                Valider
              </button>
            </li>
          ))}
        </ul>
      )}
    </ExpertPageFrame>
  );
}
