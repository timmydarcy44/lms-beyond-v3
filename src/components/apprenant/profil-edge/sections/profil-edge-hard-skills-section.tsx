"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { EdgeSelect } from "@/components/ui/edge-select";
import { HardSkillCatalogModal } from "@/components/hard-skills/hard-skill-catalog-modal";
import { HardSkillLevelModal } from "@/components/hard-skills/hard-skill-level-modal";
import { HardSkillManualAddModal } from "@/components/hard-skills/hard-skill-manual-add-modal";
import { HardSkillProofChoiceModal } from "@/components/hard-skills/hard-skill-proof-choice-modal";
import { HardSkillInterviewModal } from "@/components/hard-skills/hard-skill-interview-modal";
import { HardSkillProofModal } from "@/components/hard-skills/hard-skill-proof-modal";
import { HardSkillsPortfolioTable } from "@/components/hard-skills/hard-skills-portfolio-table";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { extractCareerTitleFromProject, mergeObjectiveDetailsIntoProject } from "@/lib/particulier/professional-project-fields";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import {
  buildHardSkillRecord,
  buildStoredMeta,
  computeHardSkillStats,
  HARD_SKILL_LEVELS,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
  levelToSelfAssessment,
  type HardSkillCatalogEntry,
  type HardSkillProof,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import type { SkillValidationSession, SkillValidationVerdict } from "@/lib/hard-skills/skill-validation";
import { verdictToProofLevel } from "@/lib/hard-skills/skill-validation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AnalysisPayload = {
  confidenceScore: number;
  verdict: SkillValidationVerdict;
  analysis: string;
  opinion: string;
  badgeSuggested?: boolean;
};

type PendingAction =
  | { mode: "add-catalog"; entry: HardSkillCatalogEntry }
  | { mode: "add-manual" }
  | { mode: "edit"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-choice"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-interview"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-import"; skillName: string; level: HardSkillLevel };

export function ProfilEdgeHardSkillsSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, StoredHardSkillMeta>>({});
  const [careerTitle, setCareerTitle] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("hard_skills, skills_metadata, professional_project, objective_details, type_profil")
      .eq("id", uid)
      .maybeSingle();
    const hs = Array.isArray(data?.hard_skills) ? (data.hard_skills as string[]) : [];
    const meta = (data?.skills_metadata as Record<string, StoredHardSkillMeta>) ?? {};
    setHardSkills(hs);
    setMetadata(meta);

    const project = mergeObjectiveDetailsIntoProject(
      data?.type_profil,
      parseProfessionalProject(data?.professional_project),
      (data?.objective_details as Record<string, string>) ?? {},
    );
    setCareerTitle(extractCareerTitleFromProject(data?.type_profil, project));
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
    return records.filter((r) => {
      if (levelFilter && r.level !== levelFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.level.toLowerCase().includes(q) ||
        r.referentialCategory.toLowerCase().includes(q)
      );
    });
  }, [records, search, levelFilter]);

  const stats = useMemo(() => computeHardSkillStats(records), [records]);

  const saveValidation = async (
    skillName: string,
    method: "interview" | "import",
    analysis: AnalysisPayload,
    proof?: HardSkillProof,
    qa?: { questions: string[]; answers: string[] },
  ) => {
    const existing = metadata[skillName];
    const validation: SkillValidationSession = {
      method,
      status: "analyzed",
      verdict: analysis.verdict,
      confidenceScore: analysis.confidenceScore,
      analysis: analysis.analysis,
      opinion: analysis.opinion,
      questions: qa?.questions,
      answers: qa?.answers,
      proofUrl: proof?.url,
      proofNote: proof?.note,
      analyzedAt: new Date().toISOString(),
      badgeSuggested: analysis.badgeSuggested,
    };
    const record = buildHardSkillRecord(skillName, {
      ...existing,
      proof: proof ?? existing?.proof,
      proofLevel: verdictToProofLevel(analysis.verdict),
    });
    const nextMeta = {
      ...metadata,
      [skillName]: buildStoredMeta(record, validation),
    };
    await persist(hardSkills, nextMeta);
    setPending(null);
    finishSave();
  };

  const handleCatalogSelect = (entry: HardSkillCatalogEntry) => {
    setCatalogOpen(false);
    setPending({ mode: "add-catalog", entry });
  };

  const saveManual = async (name: string, level: HardSkillLevel) => {
    if (hardSkills.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setManualOpen(false);
      return;
    }
    const record = buildHardSkillRecord(name, {
      level,
      selfAssessment: levelToSelfAssessment(level),
      category: resolveDisplayCategory(name, "Autre"),
      referentialCategory: "Autre",
      proofLevel: "declared",
      source: "manual",
    });
    const nextHard = [...hardSkills, name];
    const nextMeta = { ...metadata, [name]: buildStoredMeta(record) };
    await persist(nextHard, nextMeta);
    setManualOpen(false);
    finishSave();
  };

  const saveLevel = async (level: HardSkillLevel) => {
    if (!pending || pending.mode === "proof-choice" || pending.mode === "proof-interview" || pending.mode === "proof-import") return;

    if (pending.mode === "add-catalog") {
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
    } else if (pending.mode === "edit") {
      const existing = metadata[pending.skillName];
      const record = buildHardSkillRecord(pending.skillName, {
        ...existing,
        level,
        selfAssessment: levelToSelfAssessment(level),
      });
      const nextMeta = { ...metadata, [pending.skillName]: buildStoredMeta(record, existing?.validation) };
      await persist(hardSkills, nextMeta);
      setPending(null);
      finishSave();
    }
  };

  const remove = async (skill: string) => {
    const nextHard = hardSkills.filter((s) => s !== skill);
    const nextMeta = { ...metadata };
    delete nextMeta[skill];
    await persist(nextHard, nextMeta);
  };

  const reorder = async (name: string, direction: "up" | "down") => {
    const idx = hardSkills.indexOf(name);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= hardSkills.length) return;
    const next = [...hardSkills];
    [next[idx], next[target]] = [next[target], next[idx]];
    await persist(next, metadata);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const levelModalOpen = pending?.mode === "add-catalog" || pending?.mode === "edit";

  return (
    <ProfilEdgeSectionShell
      title="Hard Skills"
      description="Portefeuille de compétences — déclarez, prouvez et validez vos compétences avec EDGE."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              {stats.total} compétence{stats.total !== 1 ? "s" : ""}
            </p>
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
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-2`}
            >
              <Plus className="h-4 w-4" />
              Ajouter manuellement
            </button>
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className={`${CONNECT_BTN_PRIMARY} inline-flex items-center gap-2`}
            >
              <Plus className="h-4 w-4" />
              Catalogue EDGE
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une compétence, catégorie ou niveau…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#3D7BFF]/40"
            />
          </div>
          <div className="w-full sm:w-48">
            <EdgeSelect
              value={levelFilter}
              onChange={setLevelFilter}
              placeholder="Tous les niveaux"
              options={[{ value: "", label: "Tous les niveaux" }, ...HARD_SKILL_LEVELS.map((l) => ({ value: l, label: l }))]}
            />
          </div>
        </div>

        <HardSkillsPortfolioTable
          records={filteredRecords}
          validationMeta={metadata}
          onEdit={(record) => setPending({ mode: "edit", skillName: record.name, level: record.level })}
          onAddProof={(record) =>
            setPending({ mode: "proof-choice", skillName: record.name, level: record.level })
          }
          onDelete={(name) => void remove(name)}
          onMoveUp={(name) => void reorder(name, "up")}
          onMoveDown={(name) => void reorder(name, "down")}
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

      <HardSkillManualAddModal
        open={manualOpen}
        existingSkills={hardSkills}
        saving={saving}
        onClose={() => setManualOpen(false)}
        onSave={(name, level) => void saveManual(name, level)}
      />

      <HardSkillLevelModal
        open={levelModalOpen}
        skillName={
          pending?.mode === "add-catalog"
            ? pending.entry.name
            : pending?.mode === "edit"
              ? pending.skillName
              : null
        }
        initialLevel={pending?.mode === "edit" ? pending.level : "Intermédiaire"}
        saving={saving}
        onClose={() => setPending(null)}
        onSave={(level) => void saveLevel(level)}
      />

      <HardSkillProofChoiceModal
        open={pending?.mode === "proof-choice"}
        skillName={pending?.mode === "proof-choice" ? pending.skillName : null}
        onClose={() => setPending(null)}
        onChooseInterview={() => {
          if (pending?.mode !== "proof-choice") return;
          setPending({ mode: "proof-interview", skillName: pending.skillName, level: pending.level });
        }}
        onChooseImport={() => {
          if (pending?.mode !== "proof-choice") return;
          setPending({ mode: "proof-import", skillName: pending.skillName, level: pending.level });
        }}
      />

      <HardSkillInterviewModal
        open={pending?.mode === "proof-interview"}
        skillName={pending?.mode === "proof-interview" ? pending.skillName : null}
        level={pending?.mode === "proof-interview" ? pending.level : "Intermédiaire"}
        careerTitle={careerTitle}
        onClose={() => setPending(null)}
        onComplete={(result, qa) => {
          if (pending?.mode !== "proof-interview") return;
          void saveValidation(pending.skillName, "interview", result, undefined, qa);
        }}
      />

      <HardSkillProofModal
        open={pending?.mode === "proof-import"}
        skillName={pending?.mode === "proof-import" ? pending.skillName : null}
        level={pending?.mode === "proof-import" ? pending.level : "Intermédiaire"}
        onClose={() => setPending(null)}
        onComplete={(result, proof) => {
          if (pending?.mode !== "proof-import") return;
          void saveValidation(pending.skillName, "import", result, proof);
        }}
      />
    </ProfilEdgeSectionShell>
  );
}
