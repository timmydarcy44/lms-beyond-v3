"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { EdgeSelect } from "@/components/ui/edge-select";
import { AddSkillDialog } from "@/components/hard-skills/add-skill-dialog";
import { HardSkillCatalogModal } from "@/components/hard-skills/hard-skill-catalog-modal";
import { HardSkillLevelModal } from "@/components/hard-skills/hard-skill-level-modal";
import { HardSkillProofChoiceModal } from "@/components/hard-skills/hard-skill-proof-choice-modal";
import { HardSkillInterviewModal } from "@/components/hard-skills/hard-skill-interview-modal";
import { HardSkillProofModal } from "@/components/hard-skills/hard-skill-proof-modal";
import { SkillCard } from "@/components/hard-skills/skill-card";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import {
  extractCareerTitleFromProject,
  mergeObjectiveDetailsIntoProject,
} from "@/lib/particulier/professional-project-fields";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import {
  buildHardSkillRecord,
  buildStoredMeta,
  computeHardSkillStats,
  HARD_SKILL_LEVELS,
  levelToSelfAssessment,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
  type HardSkillCatalogEntry,
  type HardSkillProof,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import { verdictToProofLevel } from "@/lib/hard-skills/skill-validation";
import {
  buildValidationSessionFromAnalysis,
  type SkillAnalysisApiResult,
} from "@/lib/hard-skills/skill-validation-analysis";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AnalysisPayload = SkillAnalysisApiResult;

type PendingAction =
  | { mode: "edit"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-choice"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-interview"; skillName: string; level: HardSkillLevel }
  | { mode: "proof-import"; skillName: string; level: HardSkillLevel };

export function ProfilEdgeHardSkillsSection() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, StoredHardSkillMeta>>({});
  const [careerTitle, setCareerTitle] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
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
    const declaredLevel = existing?.level ?? "Intermédiaire";
    const validation = buildValidationSessionFromAnalysis({
      method,
      declaredLevel: declaredLevel as HardSkillLevel,
      analysis,
      questions: qa?.questions,
      answers: qa?.answers,
      proofUrl: proof?.url,
      proofNote: proof?.note,
      previous: existing?.validation,
    });
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
    setFlash("Analyse enregistrée.");
  };

  const addFromCatalog = async (entry: HardSkillCatalogEntry, level: HardSkillLevel) => {
    if (hardSkills.some((s) => s.toLowerCase() === entry.name.toLowerCase())) return;
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
  };

  const [catalogPending, setCatalogPending] = useState<HardSkillCatalogEntry | null>(null);

  const handleCatalogSelect = (entry: HardSkillCatalogEntry) => {
    setCatalogOpen(false);
    setAddOpen(false);
    setCatalogPending(entry);
  };

  const saveCatalogPendingLevel = async (level: HardSkillLevel) => {
    if (!catalogPending) return;
    const name = catalogPending.name;
    await addFromCatalog(catalogPending, level);
    setCatalogPending(null);
    setFlash(`${name} ajouté · Auto-déclarée`);
  };

  const saveEditLevel = async (level: HardSkillLevel) => {
    if (!pending || pending.mode !== "edit") return;
    const existing = metadata[pending.skillName];
    const record = buildHardSkillRecord(pending.skillName, {
      ...existing,
      level,
      selfAssessment: levelToSelfAssessment(level),
    });
    const nextMeta = { ...metadata, [pending.skillName]: buildStoredMeta(record, existing?.validation) };
    await persist(hardSkills, nextMeta);
    setPending(null);
    setFlash("Niveau mis à jour.");
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
      title="Mes compétences"
      description="Ajoutez les compétences que vous possédez déjà. EDGE les utilise pour personnaliser votre profil et votre parcours."
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-2xl font-bold text-white">
              {stats.total} compétence{stats.total !== 1 ? "s" : ""}
            </p>
            <p className="mt-1.5 text-sm text-white/45">
              Niveau déclaré et statut (auto-déclarée, prouvée, évaluée, validée) sont distincts.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={`${CONNECT_BTN_PRIMARY} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
            >
              <Plus className="h-4 w-4" />
              Ajouter une compétence
            </button>
            <button
              type="button"
              onClick={() => setCatalogOpen(true)}
              className={`${CONNECT_BTN_SECONDARY} inline-flex w-full items-center justify-center gap-2 sm:w-auto`}
            >
              Explorer le catalogue
            </button>
          </div>
        </div>

        {records.length > 0 ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrer mes compétences…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#3D7BFF]/40"
              />
            </div>
            <div className="w-full sm:w-48">
              <EdgeSelect
                value={levelFilter}
                onChange={setLevelFilter}
                placeholder="Tous les niveaux"
                options={[
                  { value: "", label: "Tous les niveaux" },
                  ...HARD_SKILL_LEVELS.map((l) => ({ value: l, label: l })),
                ]}
              />
            </div>
          </div>
        ) : null}

        {filteredRecords.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <p className="text-[16px] font-semibold text-white/80">Aucune compétence pour l’instant</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
              Ajoutez une compétence que vous possédez déjà — elle sera enregistrée comme auto-déclarée.
            </p>
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={`${CONNECT_BTN_PRIMARY} mt-6 inline-flex items-center gap-2`}
            >
              <Plus className="h-4 w-4" />
              Ajouter une compétence
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((record) => (
              <SkillCard
                key={record.name}
                record={record}
                meta={metadata[record.name]}
                onEdit={() => setPending({ mode: "edit", skillName: record.name, level: record.level })}
                onProof={() =>
                  setPending({ mode: "proof-choice", skillName: record.name, level: record.level })
                }
                onEvaluate={() =>
                  setPending({ mode: "proof-interview", skillName: record.name, level: record.level })
                }
                onDelete={() => void remove(record.name)}
              />
            ))}
          </div>
        )}

        {saving ? (
          <p className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Enregistrement…
          </p>
        ) : flash ? (
          <p className="text-sm text-emerald-400">{flash}</p>
        ) : null}
      </div>

      <AddSkillDialog
        open={addOpen}
        existingSkills={hardSkills}
        saving={saving}
        onClose={() => setAddOpen(false)}
        onAdd={addFromCatalog}
        onExploreCatalog={() => {
          setAddOpen(false);
          setCatalogOpen(true);
        }}
        onProof={(skillName, level) => {
          setAddOpen(false);
          setPending({ mode: "proof-choice", skillName, level });
        }}
        onEvaluate={(skillName, level) => {
          setAddOpen(false);
          setPending({ mode: "proof-interview", skillName, level });
        }}
      />

      <HardSkillCatalogModal
        open={catalogOpen}
        existingSkills={hardSkills}
        onClose={() => setCatalogOpen(false)}
        onSelectSkill={handleCatalogSelect}
      />

      <HardSkillLevelModal
        open={Boolean(catalogPending) || pending?.mode === "edit"}
        skillName={
          catalogPending?.name ?? (pending?.mode === "edit" ? pending.skillName : null)
        }
        initialLevel={pending?.mode === "edit" ? pending.level : "Intermédiaire"}
        saving={saving}
        onClose={() => {
          setCatalogPending(null);
          if (pending?.mode === "edit") setPending(null);
        }}
        onSave={(level) => {
          if (catalogPending) void saveCatalogPendingLevel(level);
          else void saveEditLevel(level);
        }}
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
