"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import type { HardSkillLevel, LearnerHardSkillMeta } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const LEVELS: HardSkillLevel[] = ["Débutant", "Intermédiaire", "Confirmé", "Expert"];

export function ProfilEdgeHardSkillsSection() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, LearnerHardSkillMeta>>({});
  const [name, setName] = useState("");
  const [level, setLevel] = useState<HardSkillLevel>("Débutant");

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("profiles").select("hard_skills, skills_metadata").eq("id", uid).maybeSingle();
    const hs = Array.isArray(data?.hard_skills) ? (data.hard_skills as string[]) : [];
    const meta = (data?.skills_metadata as Record<string, LearnerHardSkillMeta>) ?? {};
    setHardSkills(hs);
    setMetadata(meta);
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const persist = async (nextHard: string[], nextMeta: Record<string, LearnerHardSkillMeta>) => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    await supabase
      .from("profiles")
      .update({ hard_skills: nextHard, skills_metadata: nextMeta })
      .eq("id", uid);
    setHardSkills(nextHard);
    setMetadata(nextMeta);
    setSaving(false);
  };

  const add = async () => {
    const skill = name.trim();
    if (!skill || hardSkills.includes(skill)) return;
    const nextHard = [...hardSkills, skill];
    const nextMeta = {
      ...metadata,
      [skill]: { level, validated: false, source: "manual" as const },
    };
    await persist(nextHard, nextMeta);
    setName("");
    setLevel("Débutant");
  };

  const remove = async (skill: string) => {
    const nextHard = hardSkills.filter((s) => s !== skill);
    const nextMeta = { ...metadata };
    delete nextMeta[skill];
    await persist(nextHard, nextMeta);
  };

  const updateLevel = async (skill: string, nextLevel: HardSkillLevel) => {
    const nextMeta = {
      ...metadata,
      [skill]: { ...metadata[skill], level: nextLevel, source: "manual" as const },
    };
    await persist(hardSkills, nextMeta);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <ProfilEdgeSectionShell title="Hard Skills" description="Compétences techniques et outils maîtrisés.">
      <ul className="space-y-3">
        {hardSkills.map((skill) => (
          <li key={skill} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 px-4 py-3">
            <span className="min-w-[120px] font-medium text-white">{skill}</span>
            <select
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-sm text-white"
              value={metadata[skill]?.level ?? "Débutant"}
              onChange={(e) => void updateLevel(skill, e.target.value as HardSkillLevel)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <button type="button" onClick={() => void remove(skill)} className="ml-auto text-white/40 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/5 p-4">
        <label className="block min-w-[180px] flex-1 text-sm">
          <span className="mb-1 block text-white/70">Nom</span>
          <input className={inputClass} placeholder="Excel, Python, SAP…" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Niveau</span>
          <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value as HardSkillLevel)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={saving || !name.trim()} onClick={() => void add()} className={`${CONNECT_BTN_PRIMARY} inline-flex items-center gap-2`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </button>
      </div>
    </ProfilEdgeSectionShell>
  );
}
