"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, BriefcaseBusiness, ChevronDown, Loader2, Pencil, Plus, Trash2, Wand2, X } from "lucide-react";

import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { viewerIsJade } from "@/lib/demo/jade-account";
import { JADE_METIERS } from "@/lib/demo/jade-dashboard-mocks";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { GLOBAL_SKILL_REFERENTIAL, referentialItemName } from "@/lib/profile/competency-referential";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

type JobRole = {
  id: string;
  title: string;
  description: string;
  hard_skills: string[];
  soft_skills: string[];
  created_at?: string | null;
};

type SoftSkillTarget = {
  label: string;
  score: number;
};

type BuildMode = "manual" | "ai";

type RoleFormState = {
  sector: string;
  title: string;
  description: string;
  hardSkills: string[];
  softSkills: SoftSkillTarget[];
};

const SOFT_SKILL_LIBRARY = Array.from(
  new Set([
    ...SOFT_SKILLS.map((skill) => skill.titre),
    "Communication",
    "Leadership",
    "Organisation",
    "Adaptabilité",
    "Collaboration",
    "Autonomie",
    "Rigueur",
    "Empathie",
    "Gestion du stress",
    "Résolution de problèmes",
    "Assertivité",
    "Créativité",
  ]),
).sort((a, b) => a.localeCompare(b, "fr"));

const HARD_SKILL_LIBRARY = Array.from(
  new Set([
    ...GLOBAL_SKILL_REFERENTIAL.flatMap((group) => group.items.map(referentialItemName)),
    "Excel",
    "PowerPoint",
    "Word",
    "Google Sheets",
    "CRM",
    "Salesforce",
    "HubSpot",
    "SQL",
    "Python",
    "Gestion de projet",
    "Agile/Scrum",
    "GPEC",
    "SIRH",
    "Prospection",
    "Négociation",
    "SEO",
    "Content marketing",
    "Reporting",
    "KPI",
    "People management",
  ]),
).sort((a, b) => a.localeCompare(b, "fr"));

/** Cible Soft Skill métier : échelle test Byound /15. */
const DEFAULT_SOFT_TARGET_ON_15 = 11;

const EMPTY_FORM: RoleFormState = {
  sector: "",
  title: "",
  description: "",
  hardSkills: [],
  softSkills: [],
};

function encodeSoftSkills(skills: SoftSkillTarget[]) {
  return skills
    .filter((skill) => skill.label.trim())
    .map(
      (skill) =>
        `${skill.label.trim()}::${Math.max(3, Math.min(15, Math.round(skill.score)))}`,
    );
}

function decodeSoftSkills(values: string[]) {
  return values.map((value) => {
    const [label, scoreRaw] = value.split("::");
    const parsed = Number(scoreRaw);
    let score = DEFAULT_SOFT_TARGET_ON_15;
    if (Number.isFinite(parsed)) {
      score = parsed > 15 ? Math.round((parsed / 100) * 15) : Math.round(parsed);
      score = Math.max(3, Math.min(15, score));
    }
    return {
      label: (label || value).trim(),
      score,
    };
  });
}

function formatRelativeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeHardSkill(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function EntrepriseMetiersPage() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buildMode, setBuildMode] = useState<BuildMode>("manual");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [hardSkillQuery, setHardSkillQuery] = useState("");
  const [softSkillQuery, setSoftSkillQuery] = useState("");
  const [customHardSkill, setCustomHardSkill] = useState("");

  const hardSkillOptions = useMemo(() => {
    const selected = new Set(form.hardSkills.map((s) => s.toLowerCase()));
    const merged = Array.from(new Set([...HARD_SKILL_LIBRARY, ...form.hardSkills]));
    const q = hardSkillQuery.trim().toLowerCase();
    return merged
      .filter((skill) => !q || skill.toLowerCase().includes(q))
      .sort((a, b) => {
        const aSel = selected.has(a.toLowerCase()) ? 0 : 1;
        const bSel = selected.has(b.toLowerCase()) ? 0 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.localeCompare(b, "fr");
      });
  }, [form.hardSkills, hardSkillQuery]);

  const softSkillOptions = useMemo(() => {
    const selected = new Set(form.softSkills.map((s) => s.label.toLowerCase()));
    const merged = Array.from(new Set([...SOFT_SKILL_LIBRARY, ...form.softSkills.map((s) => s.label)]));
    const q = softSkillQuery.trim().toLowerCase();
    return merged
      .filter((skill) => !q || skill.toLowerCase().includes(q))
      .sort((a, b) => {
        const aSel = selected.has(a.toLowerCase()) ? 0 : 1;
        const bSel = selected.has(b.toLowerCase()) ? 0 : 1;
        if (aSel !== bSel) return aSel - bSel;
        return a.localeCompare(b, "fr");
      });
  }, [form.softSkills, softSkillQuery]);

  const showSkillEditors = buildMode === "manual" || aiGenerated || Boolean(editingRoleId);
  const showAiBrief = buildMode === "ai" && !editingRoleId;

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      if (await viewerIsJade()) {
        setRoles(JADE_METIERS);
        return;
      }
      const response = await fetch("/api/dashboard/entreprise/metiers", { credentials: "include" });
      const payload = (await response.json()) as { roles?: JobRole[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Impossible de charger les métiers");
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les métiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const toggleHardSkill = (skill: string) => {
    const normalized = normalizeHardSkill(skill);
    if (!normalized) return;
    setForm((prev) => {
      const exists = prev.hardSkills.some((item) => item.toLowerCase() === normalized.toLowerCase());
      return {
        ...prev,
        hardSkills: exists
          ? prev.hardSkills.filter((item) => item.toLowerCase() !== normalized.toLowerCase())
          : [...prev.hardSkills, normalized],
      };
    });
  };

  const toggleSoftSkill = (label: string) => {
    const normalized = label.trim();
    if (!normalized) return;
    setForm((prev) => {
      const exists = prev.softSkills.some((item) => item.label.toLowerCase() === normalized.toLowerCase());
      return {
        ...prev,
        softSkills: exists
          ? prev.softSkills.filter((item) => item.label.toLowerCase() !== normalized.toLowerCase())
          : [...prev.softSkills, { label: normalized, score: DEFAULT_SOFT_TARGET_ON_15 }],
      };
    });
  };

  const addCustomHardSkill = () => {
    const normalized = normalizeHardSkill(customHardSkill);
    if (!normalized) return;
    setForm((prev) => {
      if (prev.hardSkills.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      return { ...prev, hardSkills: [...prev.hardSkills, normalized] };
    });
    setCustomHardSkill("");
  };

  const openManualCreate = () => {
    setBuildMode("manual");
    setAiGenerated(false);
    setEditingRoleId(null);
    setForm(EMPTY_FORM);
    setHardSkillQuery("");
    setSoftSkillQuery("");
    setCustomHardSkill("");
    setChoiceOpen(false);
    setEditorOpen(true);
    setError(null);
  };

  const openAiCreate = () => {
    setBuildMode("ai");
    setAiGenerated(false);
    setEditingRoleId(null);
    setForm(EMPTY_FORM);
    setHardSkillQuery("");
    setSoftSkillQuery("");
    setCustomHardSkill("");
    setChoiceOpen(false);
    setEditorOpen(true);
    setError(null);
  };

  const openEdit = (role: JobRole) => {
    setBuildMode("manual");
    setAiGenerated(false);
    setEditingRoleId(role.id);
    setForm({
      sector: "",
      title: role.title,
      description: role.description,
      hardSkills: Array.isArray(role.hard_skills) ? role.hard_skills : [],
      softSkills:
        role.soft_skills.some((skill) => skill.includes("::"))
          ? decodeSoftSkills(role.soft_skills)
          : role.soft_skills.map((skill) => ({ label: skill, score: DEFAULT_SOFT_TARGET_ON_15 })),
    });
    setHardSkillQuery("");
    setSoftSkillQuery("");
    setCustomHardSkill("");
    setEditorOpen(true);
    setError(null);
  };

  const handleAiGenerate = async () => {
    if (!form.title.trim()) {
      setError("Indiquez l’intitulé du métier.");
      return;
    }
    if (!form.sector.trim()) {
      setError("Indiquez le secteur d’activité.");
      return;
    }
    if (!form.description.trim()) {
      setError("Ajoutez une description pour que l’IA propose des compétences pertinentes.");
      return;
    }
    setAiLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/entreprise/metiers/ai-skills", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          sector: form.sector,
          description: form.description,
        }),
      });
      const payload = (await response.json()) as {
        description?: string;
        hard_skills?: string[];
        soft_skills?: SoftSkillTarget[];
        error?: string;
      };
      if (!response.ok) throw new Error(payload.error || "Génération IA impossible");
      setForm((prev) => ({
        ...prev,
        description: payload.description || prev.description,
        hardSkills: Array.isArray(payload.hard_skills) ? payload.hard_skills : [],
        softSkills:
          Array.isArray(payload.soft_skills) && payload.soft_skills.length > 0
            ? payload.soft_skills
            : [],
      }));
      setAiGenerated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Génération IA impossible");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("L’intitulé du métier est requis.");
      return;
    }
    if (buildMode === "ai" && !editingRoleId && !aiGenerated) {
      setError("Générez d’abord les compétences avec l’IA, puis ajustez-les si besoin.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        editingRoleId
          ? `/api/dashboard/entreprise/metiers/${editingRoleId}`
          : "/api/dashboard/entreprise/metiers",
        {
          method: editingRoleId ? "PUT" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            description: form.description,
            hard_skills: form.hardSkills,
            soft_skills: encodeSoftSkills(form.softSkills),
          }),
        },
      );
      const payload = (await response.json()) as { role?: JobRole; error?: string };
      if (!response.ok || !payload.role) throw new Error(payload.error || "Enregistrement impossible");
      await loadRoles();
      setEditorOpen(false);
      setEditingRoleId(null);
      setAiGenerated(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!window.confirm("Supprimer ce métier ?")) return;
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/entreprise/metiers/${roleId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Suppression impossible");
      setRoles((prev) => prev.filter((role) => role.id !== roleId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression impossible");
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8">
          <h1 className={ENTREPRISE_H1_CLASS}>Métiers</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Définissez vos rôles, leurs hard skills et les scores cibles de soft skills.
          </p>
        </header>

        <div className="mb-6 flex justify-end">
          <Button
            type="button"
            className="rounded-full bg-violet-600 px-5 text-white hover:bg-violet-700"
            onClick={() => setChoiceOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Ajouter un métier
          </Button>
        </div>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Chargement des métiers…</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fafafa] p-8 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">Aucun métier enregistré</h2>
              <p className="mt-2 text-sm text-gray-500">
                Créez un métier manuellement ou laissez l’IA proposer hard skills et soft skills.
              </p>
            </div>
          ) : (
            roles.map((role) => {
              const softSkills = role.soft_skills.some((skill) => skill.includes("::"))
                ? decodeSoftSkills(role.soft_skills)
                : role.soft_skills.map((skill) => ({
                    label: skill,
                    score: DEFAULT_SOFT_TARGET_ON_15,
                  }));

              return (
                <article
                  key={role.id}
                  className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{role.title}</h2>
                      {role.description ? (
                        <p className="mt-2 max-w-3xl text-sm text-gray-600">{role.description}</p>
                      ) : null}
                      {formatRelativeDate(role.created_at) ? (
                        <p className="mt-2 text-xs text-gray-400">
                          Créé le {formatRelativeDate(role.created_at)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(role)}>
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => void handleDelete(role.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Hard skills
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {role.hard_skills.length > 0 ? (
                          role.hard_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Aucune</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Soft skills cibles
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {softSkills.length > 0 ? (
                          softSkills.map((skill) => (
                            <span
                              key={`${skill.label}-${skill.score}`}
                              className="rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                            >
                              {skill.label} · {skill.score}/15
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">Aucune</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {error && !editorOpen ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      </main>

      <Dialog open={choiceOpen} onOpenChange={setChoiceOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle>Ajouter un métier</DialogTitle>
            <DialogDescription>
              Partez de zéro, ou laissez l’IA proposer hard skills et soft skills à partir d’un brief.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={openManualCreate}
              className="rounded-3xl border border-gray-200 bg-[#fafafa] p-6 text-left transition hover:border-violet-300 hover:bg-violet-50"
            >
              <Plus className="h-6 w-6 text-violet-600" />
              <p className="mt-4 text-lg font-semibold text-gray-900">Créer le métier à partir de 0</p>
              <p className="mt-2 text-sm text-gray-500">
                Intitulé, hard skills (choix multiple), soft skills (choix multiple + note cible).
              </p>
            </button>
            <button
              type="button"
              onClick={openAiCreate}
              className="rounded-3xl border border-gray-200 bg-[#fafafa] p-6 text-left transition hover:border-violet-300 hover:bg-violet-50"
            >
              <Bot className="h-6 w-6 text-violet-600" />
              <p className="mt-4 text-lg font-semibold text-gray-900">Créer avec l’IA</p>
              <p className="mt-2 text-sm text-gray-500">
                Secteur, intitulé et description → l’IA propose hard skills et soft skills (modifiables).
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setAiGenerated(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[28px] border-gray-200 bg-white">
          <DialogHeader>
            <DialogTitle>{editingRoleId ? "Modifier le métier" : "Construire une fiche métier"}</DialogTitle>
            <DialogDescription>
              {buildMode === "manual"
                ? "Choisissez vous-même les hard skills et soft skills, puis fixez les notes cibles."
                : aiGenerated
                  ? "Ajustez la proposition IA (compétences et notes), puis enregistrez."
                  : "Renseignez le brief : l’IA proposera ensuite hard skills et soft skills."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {showAiBrief ? (
              <>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Secteur d’activité</span>
                  <Input
                    value={form.sector}
                    onChange={(event) => setForm((prev) => ({ ...prev, sector: event.target.value }))}
                    placeholder="Ex. Industrie agroalimentaire, Retail, SaaS B2B…"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Intitulé du métier</span>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Ex. Business Developer"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Missions, contexte, équipe, enjeux…"
                    className="min-h-[120px]"
                  />
                </label>
                <Button
                  type="button"
                  className="w-full rounded-xl bg-violet-600 text-white hover:bg-violet-700"
                  onClick={() => void handleAiGenerate()}
                  disabled={aiLoading}
                >
                  {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Proposer hard skills & soft skills
                </Button>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Intitulé du métier</span>
                    <Input
                      value={form.title}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Ex. Business Developer"
                    />
                  </label>
                </div>

                {buildMode === "ai" && form.sector ? (
                  <p className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                    Secteur : <span className="font-semibold">{form.sector}</span>
                  </p>
                ) : null}

                <label className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    placeholder="Résumé du poste, contexte, missions principales…"
                    className="min-h-[100px]"
                  />
                </label>

                {buildMode === "ai" ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-violet-200 text-violet-700 hover:bg-violet-50"
                    onClick={() => void handleAiGenerate()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Regenerer avec l’IA
                  </Button>
                ) : null}
              </>
            )}

            {showSkillEditors ? (
              <>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hard skills</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Sélection multiple dans la liste, ou ajout d’une compétence personnalisée.
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between rounded-xl border-gray-200 font-normal"
                      >
                        <span className="truncate text-left text-gray-700">
                          {form.hardSkills.length > 0
                            ? `${form.hardSkills.length} compétence${form.hardSkills.length > 1 ? "s" : ""} sélectionnée${form.hardSkills.length > 1 ? "s" : ""}`
                            : "Choisir des hard skills"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
                      <DropdownMenuLabel>Catalogue</DropdownMenuLabel>
                      <div className="px-2 pb-2">
                        <Input
                          value={hardSkillQuery}
                          onChange={(event) => setHardSkillQuery(event.target.value)}
                          placeholder="Filtrer…"
                          className="h-8"
                          onKeyDown={(event) => event.stopPropagation()}
                        />
                      </div>
                      <DropdownMenuSeparator />
                      {hardSkillOptions.length === 0 ? (
                        <p className="px-2 py-3 text-sm text-gray-500">Aucun résultat</p>
                      ) : (
                        hardSkillOptions.map((skill) => (
                          <DropdownMenuCheckboxItem
                            key={skill}
                            checked={form.hardSkills.some(
                              (item) => item.toLowerCase() === skill.toLowerCase(),
                            )}
                            onCheckedChange={() => toggleHardSkill(skill)}
                            onSelect={(event) => event.preventDefault()}
                          >
                            {skill}
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {form.hardSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {form.hardSkills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {skill}
                          <button
                            type="button"
                            aria-label={`Retirer ${skill}`}
                            className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                            onClick={() => toggleHardSkill(skill)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex gap-2">
                    <Input
                      value={customHardSkill}
                      onChange={(event) => setCustomHardSkill(event.target.value)}
                      placeholder="Ajouter une hard skill absente…"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomHardSkill();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      onClick={addCustomHardSkill}
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Soft skills</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Choix multiple, puis note cible (échelle test Soft Skills : 3 à 15).
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between rounded-xl border-gray-200 font-normal"
                      >
                        <span className="truncate text-left text-gray-700">
                          {form.softSkills.length > 0
                            ? `${form.softSkills.length} soft skill${form.softSkills.length > 1 ? "s" : ""} sélectionnée${form.softSkills.length > 1 ? "s" : ""}`
                            : "Choisir des soft skills"}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto">
                      <DropdownMenuLabel>Catalogue</DropdownMenuLabel>
                      <div className="px-2 pb-2">
                        <Input
                          value={softSkillQuery}
                          onChange={(event) => setSoftSkillQuery(event.target.value)}
                          placeholder="Filtrer…"
                          className="h-8"
                          onKeyDown={(event) => event.stopPropagation()}
                        />
                      </div>
                      <DropdownMenuSeparator />
                      {softSkillOptions.length === 0 ? (
                        <p className="px-2 py-3 text-sm text-gray-500">Aucun résultat</p>
                      ) : (
                        softSkillOptions.map((skill) => (
                          <DropdownMenuCheckboxItem
                            key={skill}
                            checked={form.softSkills.some(
                              (item) => item.label.toLowerCase() === skill.toLowerCase(),
                            )}
                            onCheckedChange={() => toggleSoftSkill(skill)}
                            onSelect={(event) => event.preventDefault()}
                          >
                            {skill}
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {form.softSkills.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {form.softSkills.map((skill, index) => (
                        <div
                          key={`${skill.label}-${index}`}
                          className="rounded-2xl border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900">{skill.label}</p>
                            <button
                              type="button"
                              aria-label={`Retirer ${skill.label}`}
                              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                              onClick={() => toggleSoftSkill(skill.label)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <input
                              type="range"
                              min={3}
                              max={15}
                              value={skill.score}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  softSkills: prev.softSkills.map((item, itemIndex) =>
                                    itemIndex === index
                                      ? { ...item, score: Number(event.target.value) }
                                      : item,
                                  ),
                                }))
                              }
                              className="w-full accent-violet-600"
                            />
                            <span className="w-14 text-right text-sm font-semibold text-violet-700">
                              {skill.score}/15
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Aucune soft skill sélectionnée.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>

          {error && editorOpen ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
              Annuler
            </Button>
            {showSkillEditors ? (
              <Button
                type="button"
                className="bg-violet-600 text-white hover:bg-violet-700"
                disabled={saving}
                onClick={() => void handleSubmit()}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingRoleId ? "Enregistrer les modifications" : "Créer le métier"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
