"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { HardSkillCatalogModal } from "@/components/hard-skills/hard-skill-catalog-modal";
import { HardSkillLevelModal } from "@/components/hard-skills/hard-skill-level-modal";
import { HardSkillProofModal } from "@/components/hard-skills/hard-skill-proof-modal";
import { HardSkillsPortfolioTable } from "@/components/hard-skills/hard-skills-portfolio-table";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import {
  buildHardSkillRecord,
  buildStoredMeta,
  computeHardSkillStats,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
  levelToSelfAssessment,
  type HardSkillCatalogEntry,
  type HardSkillProof,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type PendingAction =
  | { mode: "add"; entry: HardSkillCatalogEntry }
  | { mode: "edit"; skillName: string; level: HardSkillLevel }
  | { mode: "proof"; skillName: string; proof?: HardSkillProof };

export function ProfilEdgeHardSkillsSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, StoredHardSkillMeta>>({});
  const [search, setSearch] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("profiles").select("hard_skills, skills_metadata").eq("id", uid).maybeSingle();
    const hs = Array.isArray(data?.hard_skills) ? (data.hard_skills as string[]) : [];
    const meta = (data?.skills_metadata as Record<string, StoredHardSkillMeta>) ?? {};
    setHardSkills(hs);
    setMetadata(meta);
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const persist = async (nextHard: string[], nextMeta: Record<string, StoredHardSkillMeta>) => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    await supabase.from("profiles").update({ hard_skills: nextHard, skills_metadata: nextMeta }).eq("id", uid);
    setHardSkills(nextHard);
    setMetadata(nextMeta);
    setSaving(false);
  };

  const records = useMemo(() => parseHardSkillPortfolio(hardSkills, metadata), [hardSkills, metadata]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.level.toLowerCase().includes(q) ||
        r.referentialCategory.toLowerCase().includes(q),
    );
  }, [records, search]);

  const stats = useMemo(() => computeHardSkillStats(records), [records]);

  const handleCatalogSelect = (entry: HardSkillCatalogEntry) => {
    setCatalogOpen(false);
    setPending({ mode: "add", entry });
  };

  const saveLevel = async (level: HardSkillLevel) => {
    if (!pending || pending.mode === "proof") return;

    if (pending.mode === "add") {
      const { entry } = pending;
      if (hardSkills.includes(entry.name)) {
        setPending(null);
        return;
      }
      const record = buildHardSkillRecord(entry.name, {
        level,
        selfAssessment: levelToSelfAssessment(level),
        category: resolveDisplayCategory(entry.name, entry.category),
        referentialCategory: entry.category,
        proofLevel: "declared",
        source: "catalog",
      });
      const nextHard = [...hardSkills, entry.name];
      const nextMeta = { ...metadata, [entry.name]: buildStoredMeta(record) };
      await persist(nextHard, nextMeta);
      setPending(null);
      finishSave();
    } else {
      const existing = metadata[pending.skillName];
      const record = buildHardSkillRecord(pending.skillName, {
        ...existing,
        level,
        selfAssessment: levelToSelfAssessment(level),
      });
      const nextMeta = { ...metadata, [pending.skillName]: buildStoredMeta(record) };
      await persist(hardSkills, nextMeta);
      setPending(null);
      finishSave();
    }
  };

  const saveProof = async (proof: HardSkillProof) => {
    if (!pending || pending.mode !== "proof") return;
    const existing = metadata[pending.skillName];
    const record = buildHardSkillRecord(pending.skillName, {
      ...existing,
      proof,
      proofLevel: "justified",
    });
    const nextMeta = { ...metadata, [pending.skillName]: buildStoredMeta(record) };
    await persist(hardSkills, nextMeta);
    setPending(null);
    finishSave();
  };

  const remove = async (skill: string) => {
    const nextHard = hardSkills.filter((s) => s !== skill);
    const nextMeta = { ...metadata };
    delete nextMeta[skill];
    await persist(nextHard, nextMeta);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  return (
    <ProfilEdgeSectionShell
      title="Hard Skills"
      description="Portefeuille de compétences — sélectionnez depuis le catalogue EDGE pour un référentiel homogène."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-2xl font-bold text-white">{stats.total} compétence{stats.total !== 1 ? "s" : ""}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/55">
              <span>
                <span className="text-emerald-300">Expert</span> : {stats.byLevel.Expert}
              </span>
              <span>
                <span className="text-amber-300">Confirmé</span> : {stats.byLevel.Confirmé}
              </span>
              <span>
                <span className="text-sky-300">Intermédiaire</span> : {stats.byLevel.Intermédiaire}
              </span>
              <span>
                <span className="text-slate-300">Débutant</span> : {stats.byLevel.Débutant}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCatalogOpen(true)}
            className={`${CONNECT_BTN_PRIMARY} inline-flex shrink-0 items-center gap-2`}
          >
            <Plus className="h-4 w-4" />
            Ajouter une compétence
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une compétence, catégorie ou niveau…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#3D7BFF]/40"
          />
        </div>

        <HardSkillsPortfolioTable
          records={filteredRecords}
          onEdit={(record) => setPending({ mode: "edit", skillName: record.name, level: record.level })}
          onAddProof={(record) =>
            setPending({ mode: "proof", skillName: record.name, proof: record.proof })
          }
          onDelete={(name) => void remove(name)}
        />

        {saving ? (
          <p className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Enregistrement…
          </p>
        ) : savedMessage ? (
          <p className="text-sm text-emerald-400">{savedMessage}</p>
        ) : null}
      </div>

      <HardSkillCatalogModal
        open={catalogOpen}
        existingSkills={hardSkills}
        onClose={() => setCatalogOpen(false)}
        onSelectSkill={handleCatalogSelect}
      />

      <HardSkillLevelModal
        open={pending?.mode === "add" || pending?.mode === "edit"}
        skillName={
          pending?.mode === "add" ? pending.entry.name : pending?.mode === "edit" ? pending.skillName : null
        }
        initialLevel={pending?.mode === "edit" ? pending.level : "Intermédiaire"}
        saving={saving}
        onClose={() => setPending(null)}
        onSave={(level) => void saveLevel(level)}
      />

      <HardSkillProofModal
        open={pending?.mode === "proof"}
        skillName={pending?.mode === "proof" ? pending.skillName : null}
        initialProof={pending?.mode === "proof" ? pending.proof : undefined}
        saving={saving}
        onClose={() => setPending(null)}
        onSave={(proof) => void saveProof(proof)}
      />
    </ProfilEdgeSectionShell>
  );
}
