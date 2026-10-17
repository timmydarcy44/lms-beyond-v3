"use client";

import { useEffect, useMemo, useState } from "react";

type SkillRow = {
  skill: string;
  category: string;
  declarations: number;
  withProof: number;
  hasBadge: boolean;
  lastActivity: string | null;
};

type Suggestion = {
  id: string;
  label: string;
  status: string;
  merged_into: string | null;
  created_at: string;
};

type Payload = {
  skills: SkillRow[];
  suggestions: Suggestion[];
  counts: { before: number; after: number; proofsBefore: number; proofsAfter: number };
};

export default function DeclaredSkillsAdminPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"skills" | "suggestions">("skills");
  const [withoutBadge, setWithoutBadge] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");

  const load = async () => {
    const res = await fetch("/api/super-admin/declared-skills");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Chargement impossible");
      return;
    }
    setData(json);
  };

  useEffect(() => {
    void load();
  }, []);

  const skills = useMemo(() => {
    const rows = data?.skills ?? [];
    return withoutBadge ? rows.filter((row) => !row.hasBadge) : rows;
  }, [data, withoutBadge]);

  const groups = useMemo(() => {
    const map = new Map<string, Suggestion[]>();
    for (const row of data?.suggestions ?? []) {
      if (row.status !== "pending") continue;
      const key = row.label.trim().toLocaleLowerCase("fr");
      const bucket = map.get(key) ?? [];
      bucket.push(row);
      map.set(key, bucket);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [data]);

  const act = async (action: "add" | "merge", ids: string[]) => {
    const res = await fetch("/api/super-admin/declared-skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids, category: "Autre", canonical: mergeTarget }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Action impossible");
      return;
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 text-neutral-950">
      <h1 className="text-2xl font-semibold">Compétences déclarées</h1>
      {data ? (
        <p className="mt-2 text-sm text-neutral-600">
          Déclarations avant fusion : {data.counts.before}. Après : {data.counts.after}. Preuves avant : {data.counts.proofsBefore}. Après : {data.counts.proofsAfter}.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setTab("skills")} className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm">
          Compétences
        </button>
        <button type="button" onClick={() => setTab("suggestions")} className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm">
          Suggestions
        </button>
        <a href="/api/super-admin/declared-skills?format=csv" className="rounded-full border border-neutral-900 px-3 py-1.5 text-sm">
          Export CSV
        </a>
        {tab === "skills" ? (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={withoutBadge} onChange={(event) => setWithoutBadge(event.target.checked)} />
            Sans badge
          </label>
        ) : null}
      </div>

      {tab === "skills" ? (
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 font-medium">Compétence</th>
              <th className="py-2 font-medium">Catégorie</th>
              <th className="py-2 font-medium">Déclarations</th>
              <th className="py-2 font-medium">Avec preuve</th>
              <th className="py-2 font-medium">Badge</th>
              <th className="py-2 font-medium">Dernière activité</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((row) => (
              <tr key={row.skill} className="border-b border-neutral-100">
                <td className="py-2">{row.skill}</td>
                <td className="py-2">{row.category}</td>
                <td className="py-2">{row.declarations}</td>
                <td className="py-2">{row.withProof}</td>
                <td className="py-2">{row.hasBadge ? "oui" : "non"}</td>
                <td className="py-2">{row.lastActivity ? new Date(row.lastActivity).toLocaleDateString("fr-FR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="mt-6 space-y-4">
          <label className="block text-sm">
            Fusionner avec
            <input
              value={mergeTarget}
              onChange={(event) => setMergeTarget(event.target.value)}
              className="mt-1 w-full max-w-md rounded-lg border border-neutral-300 px-3 py-2"
              placeholder="Nom déjà dans le catalogue"
            />
          </label>
          {groups.map(([label, rows]) => (
            <div key={label} className="rounded-xl border border-neutral-200 p-4">
              <p className="font-medium">{rows[0]?.label}</p>
              <p className="text-sm text-neutral-500">{rows.length} saisie{rows.length > 1 ? "s" : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void act("add", rows.map((row) => row.id))} className="rounded-full bg-neutral-950 px-3 py-1.5 text-sm text-white">
                  Ajouter au catalogue
                </button>
                <button type="button" onClick={() => void act("merge", rows.map((row) => row.id))} className="rounded-full border border-neutral-300 px-3 py-1.5 text-sm">
                  Fusionner avec…
                </button>
              </div>
            </div>
          ))}
          {groups.length === 0 ? <p className="text-sm text-neutral-500">Aucune suggestion en attente.</p> : null}
        </div>
      )}
    </div>
  );
}
