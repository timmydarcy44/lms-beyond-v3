"use client";

import { useEffect, useMemo, useState } from "react";

type Group = { raw_label: string; count: number; ids: string[]; kind: string };
type SkillOpt = { id: string; label: string; is_soft: boolean; domain: string };
type DomainOpt = { id: string; slug: string; label: string };

export default function SkillsReviewPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [skills, setSkills] = useState<SkillOpt[]>([]);
  const [domains, setDomains] = useState<DomainOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attachId, setAttachId] = useState("");
  const [createDomainId, setCreateDomainId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch("/api/super-admin/skills-review");
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Chargement impossible");
      return;
    }
    setGroups(json.groups ?? []);
    setSkills(json.skills ?? []);
    setDomains(json.domains ?? []);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  const skillOptions = useMemo(
    () => [...skills].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [skills],
  );

  const act = async (action: "attach" | "ignore" | "create", group: Group) => {
    setBusy(group.raw_label);
    const body: Record<string, unknown> = { action, ids: group.ids };
    if (action === "attach") body.skill_id = attachId;
    if (action === "create") {
      if (!createDomainId) {
        setError("Choisis un domaine avant de créer.");
        setBusy(null);
        return;
      }
      body.label = group.raw_label;
      body.domain_id = createDomainId;
      body.description = "";
      body.is_soft = group.kind === "soft";
    }
    const res = await fetch("/api/super-admin/skills-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(json.error || "Action impossible");
      return;
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8 text-[#F2F4FA]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA3BD]">Référentiel</p>
        <h1 className="mt-1 text-3xl font-extrabold">À classer</h1>
        <p className="mt-2 text-sm text-[#9AA3BD]">
          Formulations libres des apprenants, regroupées. Invisible côté apprenant.
        </p>
      </div>
      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}
      <div className="overflow-hidden rounded-3xl border border-[#1A2340] bg-[#111831]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#1A2340] text-[#6C7593]">
            <tr>
              <th className="px-4 py-3 font-semibold">Formulation</th>
              <th className="px-4 py-3 font-semibold">Occurrences</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.raw_label} className="border-t border-[#1A2340]">
                <td className="px-4 py-3 font-medium">{group.raw_label}</td>
                <td className="px-4 py-3 tabular-nums">{group.count}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={attachId}
                      onChange={(e) => setAttachId(e.target.value)}
                      className="max-w-[220px] rounded-xl border border-[#26304F] bg-[#0B1122] px-2 py-1.5 text-xs"
                    >
                      <option value="">Rattacher à…</option>
                      {skillOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!attachId || busy === group.raw_label}
                      onClick={() => void act("attach", group)}
                      className="rounded-full bg-[#6E5BFF] px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                    >
                      Rattacher
                    </button>
                    <select
                      value={createDomainId}
                      onChange={(e) => setCreateDomainId(e.target.value)}
                      className="max-w-[180px] rounded-xl border border-[#26304F] bg-[#0B1122] px-2 py-1.5 text-xs"
                    >
                      <option value="">Domaine (créer)</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!createDomainId || busy === group.raw_label}
                      onClick={() => void act("create", group)}
                      className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                    >
                      Créer
                    </button>
                    <button
                      type="button"
                      disabled={busy === group.raw_label}
                      onClick={() => void act("ignore", group)}
                      className="rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-semibold"
                    >
                      Ignorer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {groups.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-[#6C7593]">
                  Aucune formulation en attente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
