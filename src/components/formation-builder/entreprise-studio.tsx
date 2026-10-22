"use client";

import { Manrope } from "next/font/google";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CourseBuilderWorkspace } from "@/components/formateur/course-builder/course-builder-workspace";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { COURSE_LEVEL_BUILDER_OPTIONS } from "@/lib/course-level-options";
import { COURSE_TOOL_OPTIONS, normalizeCourseTools } from "@/lib/course-tools";
import { ficheScore } from "@/lib/courses/fiche-checklist";
import type { CourseBuilderChapter, CourseBuilderSubchapter } from "@/types/course-builder";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const FORMATS = ["Présentiel", "Distanciel", "Mixte", "E-learning"] as const;
const AUDIENCES = ["Managers", "Commerciaux", "Équipes RH", "Direction", "Nouveaux arrivants", "Tous les collaborateurs"];

type Org = { id: string; name: string };
type Named = { id: string; name: string };
type PathRow = { id: string; title: string };

function minutesOf(value: string | undefined) {
  const match = String(value ?? "").match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function formatMinutes(total: number) {
  if (total <= 0) return "0 min";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (!hours) return `${mins} min`;
  if (!mins) return `${hours} h`;
  return `${hours} h ${mins}`;
}

function pillFor(item: { type?: string; kind?: string }) {
  if (item.kind === "quiz") return { label: "Quiz", bg: "#FFF1E2", fg: "#8A4B0F" };
  if (item.kind === "resource") return { label: "Ressource", bg: "#E3F6EC", fg: "#126B3B" };
  if (item.type === "video") return { label: "Vidéo", bg: "#E8EEF8", fg: "#2F5FB3" };
  return { label: "Leçon", bg: "#EEEBFF", fg: "#4B3BD1" };
}

function isReady(item: { content?: string; duration?: string; type?: string; kind?: string; quiz_id?: string; resource_id?: string }) {
  const filled = Boolean(item.kind || item.quiz_id || item.resource_id || String(item.content ?? "").trim());
  if (!filled) return false;
  if (item.type === "video" || item.type === "text") return minutesOf(item.duration) > 0;
  return true;
}

export function EntrepriseFormationStudio({
  courseId,
  organizations,
  thematics,
  instructors,
  paths,
  validators,
  isTimmy,
  byoundOwned,
  saving,
  publishing,
  backHref,
  onSave,
  onPublish,
  onOpenAi,
  onCreateValidator,
}: {
  courseId?: string;
  organizations: Org[];
  thematics: Named[] | null;
  instructors: Named[];
  paths: PathRow[];
  validators: Named[];
  isTimmy: boolean;
  byoundOwned: boolean;
  saving: boolean;
  publishing: boolean;
  backHref: string;
  onSave: (silent?: boolean) => Promise<boolean | void>;
  onPublish: () => void;
  onOpenAi: () => void;
  onCreateValidator: () => void;
}) {
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const updateGeneral = useCourseBuilder((s) => s.updateGeneral);
  const addSection = useCourseBuilder((s) => s.addSection);
  const updateSection = useCourseBuilder((s) => s.updateSection);
  const reorderSections = useCourseBuilder((s) => s.reorderSections);
  const addChapter = useCourseBuilder((s) => s.addChapter);
  const updateChapter = useCourseBuilder((s) => s.updateChapter);
  const reorderChapters = useCourseBuilder((s) => s.reorderChapters);
  const addSubchapter = useCourseBuilder((s) => s.addSubchapter);
  const updateSubchapter = useCourseBuilder((s) => s.updateSubchapter);
  const selectSubchapter = useCourseBuilder((s) => s.selectSubchapter);

  const [tab, setTab] = useState<"fiche" | "contenu">("fiche");
  const [step, setStep] = useState(1);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [advanced, setAdvanced] = useState(false);
  const [saveLabel, setSaveLabel] = useState("Brouillon");
  const [skillDraft, setSkillDraft] = useState("");
  const [skillIdeas, setSkillIdeas] = useState<string[]>([]);
  const [undo, setUndo] = useState<{ label: string; apply: () => void } | null>(null);
  const [confirm, setConfirm] = useState<{ label: string; run: () => void } | null>(null);
  const [edit, setEdit] = useState<
    | { level: "chapter"; sectionId: string; chapterId: string }
    | { level: "sub"; sectionId: string; chapterId: string; subId: string }
    | null
  >(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const skipAutosave = useRef(true);

  const general = snapshot.general;
  const sections = (snapshot.sections ?? []).filter((section) => !section.deleted_at);
  const score = ficheScore(snapshot);
  const totalMinutes = sections.reduce((sum, section) => {
    return (
      sum +
      (section.chapters ?? [])
        .filter((chapter) => !chapter.deleted_at)
        .reduce((inner, chapter) => {
          const subs = (chapter.subchapters ?? []).filter((sub) => !sub.deleted_at);
          return inner + minutesOf(chapter.duration) + subs.reduce((n, sub) => n + minutesOf(sub.duration), 0);
        }, 0)
    );
  }, 0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTab = params.get("tab");
    if (nextTab === "fiche" || nextTab === "contenu") setTab(nextTab);
    const nextStep = Number(params.get("step"));
    if (nextStep >= 1 && nextStep <= 4) setStep(nextStep);
    const moduleId = params.get("module");
    if (moduleId) setOpenModules((prev) => ({ ...prev, [moduleId]: true }));
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    if (tab === "fiche") url.searchParams.set("step", String(step));
    window.history.replaceState(null, "", url.toString());
  }, [tab, step]);

  const snapshotKey = useMemo(() => JSON.stringify(snapshot), [snapshot]);
  useEffect(() => {
    if (skipAutosave.current) {
      skipAutosave.current = false;
      return;
    }
    if (!general.title?.trim()) return;
    setSaveLabel("Enregistrement…");
    const timer = window.setTimeout(() => {
      void saveRef.current(true).then((ok) => setSaveLabel(ok === false ? "Non enregistré" : "Enregistré"));
    }, 800);
    return () => window.clearTimeout(timer);
  }, [snapshotKey, general.title]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), 8000);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEdit(null);
        setConfirm(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = skillDraft.trim();
    if (q.length < 2) {
      setSkillIdeas([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/skills/catalog-extras?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          const names = Array.isArray(data?.entries)
            ? data.entries.map((row: { name?: string }) => String(row.name ?? "")).filter((name: string) => name.toLowerCase().includes(q.toLowerCase()))
            : [];
          setSkillIdeas(names.slice(0, 6));
        })
        .catch(() => setSkillIdeas([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [skillDraft]);

  const addSkill = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    const current = general.competencies ?? [];
    if (current.some((item) => item.toLowerCase() === clean.toLowerCase())) return;
    updateGeneral({ competencies: [...current, clean] });
    setSkillDraft("");
    setSkillIdeas([]);
  };

  const scheduleUndo = (label: string, apply: () => void) => setUndo({ label, apply });

  const askDelete = (label: string, run: () => void) => setConfirm({ label, run });

  const move = (ids: string[], id: string, dir: -1 | 1, apply: (active: string, over: string) => void) => {
    const index = ids.indexOf(id);
    const next = ids[index + dir];
    if (!next) return;
    apply(id, next);
  };

  return (
    <div className={`${manrope.className} min-h-screen bg-[#F4F4F1] text-[#07080B]`}>
      <header className="sticky top-0 z-30 border-b border-[#E3E0D8] bg-[#F4F4F1]/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3">
          <a href={backHref} className="rounded-full border border-[#E3E0D8] bg-white px-4 py-2 text-sm font-semibold">
            Retour
          </a>
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{general.title?.trim() || "Nouvelle formation"}</p>
          <div className="flex rounded-full bg-[#ECE9E1] p-1" role="tablist" aria-label="Fiche ou contenu">
            {(["fiche", "contenu"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === key ? "bg-[#07080B] text-white" : "text-[#3A3D45]"}`}
              >
                {key === "fiche" ? "Fiche" : "Contenu"}
              </button>
            ))}
          </div>
          <span className="text-sm text-[#6B6F7A]" aria-live="polite">
            {saving ? "Enregistrement…" : saveLabel}
          </span>
          <button type="button" onClick={() => void onSave(false)} className="rounded-full border border-[#E3E0D8] bg-white px-4 py-2 text-sm font-semibold">
            Enregistrer
          </button>
          <button
            type="button"
            disabled={publishing || score.done < score.total}
            onClick={onPublish}
            className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-[#1A0C04] disabled:opacity-40"
          >
            {publishing ? "Publication…" : "Publier"}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {tab === "fiche" ? (
            <section className="rounded-[28px] bg-white p-6">
              <div className="mb-6 flex flex-wrap gap-2">
                {["Identité", "Objectifs et public", "Modalités", "Visuel"].map((label, index) => {
                  const n = index + 1;
                  const active = step === n;
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-current={active ? "step" : undefined}
                      onClick={() => setStep(n)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                    >
                      {n}. {label}
                    </button>
                  );
                })}
              </div>

              {step === 1 ? (
                <div className="space-y-5">
                  <Field label="Titre">
                    <input className={fieldClass} value={general.title ?? ""} onChange={(e) => updateGeneral({ title: e.target.value })} />
                  </Field>
                  {byoundOwned ? (
                    <Field label="Où la formation apparaît">
                      <p className="mb-2 text-sm text-[#6B6F7A]">Cochez les espaces. L&apos;espace expert met la formation en vente sur le dashboard expert.</p>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["apprenant", "Catalogue apprenant"],
                            ["entreprise", "Espace entreprise"],
                            ["expert", "Espace expert"],
                          ] as const
                        ).map(([id, label]) => {
                          const selected = (general.visible_surfaces ?? []).includes(id);
                          return (
                            <button
                              key={id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                const current = general.visible_surfaces ?? [];
                                const next = selected ? current.filter((item) => item !== id) : [...current, id];
                                const learner = next.includes("apprenant");
                                const company = next.includes("entreprise");
                                updateGeneral({
                                  visible_surfaces: next,
                                  target_audience: learner && company ? "all" : learner ? "apprenant" : company ? "pro" : undefined,
                                });
                              }}
                              className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  ) : null}
                  <Field label="Présentation">
                    <textarea className={`${fieldClass} min-h-28`} value={general.presentation ?? ""} onChange={(e) => updateGeneral({ presentation: e.target.value })} />
                    <button type="button" onClick={onOpenAi} className="mt-2 rounded-full bg-[#EEEBFF] px-4 py-2 text-sm font-semibold text-[#4B3BD1]">
                      Générer avec l'IA
                    </button>
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Thématique">
                      <select
                        className={fieldClass}
                        value={general.category_id ?? ""}
                        onChange={(e) => {
                          const id = e.target.value;
                          const name = (thematics ?? []).find((row) => row.id === id)?.name ?? "";
                          updateGeneral({ category_id: id || null, category: name });
                        }}
                      >
                        <option value="">{thematics === null ? "Chargement…" : "Choisir"}</option>
                        {(thematics ?? []).map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Format">
                      <div className="flex flex-wrap gap-2">
                        {FORMATS.map((format) => (
                          <button
                            key={format}
                            type="button"
                            aria-pressed={general.delivery_format === format}
                            onClick={() => updateGeneral({ delivery_format: format })}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${general.delivery_format === format ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                          >
                            {format}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                  <Field label="Entreprise">
                    <select
                      className={fieldClass}
                      disabled={!byoundOwned && Boolean(general.assigned_organization_id) && organizations.length <= 1}
                      value={general.assigned_organization_id ?? ""}
                      onChange={(e) => updateGeneral({ assigned_organization_id: e.target.value, assignment_type: "organization" } as never)}
                    >
                      <option value="">Choisir</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {byoundOwned ? null : (
                    <Field label="Formateurs">
                      <div className="flex flex-wrap gap-2">
                        {instructors.map((person) => {
                          const selected = (general.instructor_ids ?? []).includes(person.id);
                          return (
                            <button
                              key={person.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => {
                                const current = general.instructor_ids ?? [];
                                updateGeneral({
                                  instructor_ids: selected ? current.filter((id) => id !== person.id) : [...current, person.id],
                                });
                              }}
                              className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                            >
                              {person.name}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  )}
                  <Field label="Les outils">
                    <div className="flex flex-wrap gap-2">
                      {COURSE_TOOL_OPTIONS.map((tool) => {
                        const selected = normalizeCourseTools(general.tools).includes(tool);
                        return (
                          <button
                            key={tool}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              const current = normalizeCourseTools(general.tools);
                              updateGeneral({ tools: selected ? current.filter((item) => item !== tool) : [...current, tool] });
                            }}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                          >
                            {tool}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                  <Field label="Compétences visées">
                    <div className="mb-2 flex flex-wrap gap-2">
                      {(general.competencies ?? []).map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => updateGeneral({ competencies: (general.competencies ?? []).filter((item) => item !== skill) })}
                          className="rounded-full bg-[#EEEBFF] px-3 py-1 text-sm font-semibold text-[#4B3BD1]"
                        >
                          {skill} ×
                        </button>
                      ))}
                    </div>
                    <input
                      className={fieldClass}
                      value={skillDraft}
                      placeholder="Ajouter une compétence, puis Entrée"
                      onChange={(e) => setSkillDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillDraft);
                        }
                      }}
                    />
                    {skillIdeas.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {skillIdeas.map((idea) => (
                          <button key={idea} type="button" onClick={() => addSkill(idea)} className="rounded-full border border-[#E3E0D8] px-3 py-1 text-sm">
                            {idea}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </Field>
                  {isTimmy ? (
                    <Field label="Validé par">
                      <select
                        className={fieldClass}
                        value={String((general as { validated_by_peer_id?: string }).validated_by_peer_id ?? "")}
                        onChange={(e) => {
                          if (e.target.value === "__create__") {
                            onCreateValidator();
                            return;
                          }
                          updateGeneral({ validated_by_peer_id: e.target.value } as never);
                        }}
                      >
                        <option value="">—</option>
                        <option value="__create__">+ Créer un pair</option>
                        {validators.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <LineEditor
                    label="Objectifs pédagogiques"
                    value={general.objectifs ?? []}
                    onChange={(objectifs) => updateGeneral({ objectifs })}
                  />
                  <LineEditor
                    label="Prérequis"
                    value={general.prerequisites ?? []}
                    onChange={(prerequisites) => updateGeneral({ prerequisites })}
                  />
                  <Field label="Niveau">
                    <select className={fieldClass} value={general.level ?? ""} onChange={(e) => updateGeneral({ level: e.target.value })}>
                      <option value="">—</option>
                      {COURSE_LEVEL_BUILDER_OPTIONS.map((row) => (
                        <option key={row.value} value={row.value}>
                          {row.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Public visé">
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCES.map((audience) => {
                        const selected = (general.audiences ?? []).includes(audience);
                        return (
                          <button
                            key={audience}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              const current = general.audiences ?? [];
                              updateGeneral({
                                audiences: selected ? current.filter((item) => item !== audience) : [...current, audience],
                              });
                            }}
                            className={`rounded-full px-3 py-2 text-sm font-semibold ${selected ? "bg-[#07080B] text-white" : "border border-[#E3E0D8] bg-white"}`}
                          >
                            {audience}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-5">
                  {byoundOwned ? (
                    <Field label="Prix de vente">
                      <input
                        className={fieldClass}
                        type="number"
                        min={0}
                        value={general.price ?? ""}
                        onChange={(e) => updateGeneral({ price: e.target.value === "" ? undefined : Number(e.target.value) })}
                      />
                    </Field>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Début d'accès">
                      <input className={fieldClass} type="date" value={general.access_start_date ?? ""} onChange={(e) => updateGeneral({ access_start_date: e.target.value })} />
                    </Field>
                    <Field label="Fin d'accès">
                      <input className={fieldClass} type="date" value={general.access_end_date ?? ""} onChange={(e) => updateGeneral({ access_end_date: e.target.value })} />
                    </Field>
                  </div>
                  <Field label="Délai d'accès">
                    <input className={fieldClass} value={general.access_delay ?? ""} onChange={(e) => updateGeneral({ access_delay: e.target.value })} />
                    <p className="mt-2 inline-flex rounded-full bg-[#FFF1E2] px-3 py-1 text-xs font-semibold text-[#8A4B0F]">Qualiopi</p>
                  </Field>
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(general.parcours_only)}
                      onChange={(e) => updateGeneral({ parcours_only: e.target.checked })}
                    />
                    Uniquement dans un parcours
                  </label>
                  {general.parcours_only ? (
                    <Field label="Parcours">
                      <select
                        className={fieldClass}
                        value={general.parcours_only_path_id ?? ""}
                        onChange={(e) => updateGeneral({ parcours_only_path_id: e.target.value || null })}
                      >
                        <option value="">Choisir</option>
                        {paths.map((path) => (
                          <option key={path.id} value={path.id}>
                            {path.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : null}
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={Boolean(general.linear_progression)}
                      onChange={(e) => updateGeneral({ linear_progression: e.target.checked })}
                    />
                    Progression linéaire
                  </label>
                  <Field label="Modalités d'évaluation">
                    <textarea className={`${fieldClass} min-h-24`} value={general.evaluation_modalities ?? ""} onChange={(e) => updateGeneral({ evaluation_modalities: e.target.value })} />
                  </Field>
                  <Field label="Accessibilité">
                    <textarea className={`${fieldClass} min-h-24`} value={general.accessibility ?? ""} onChange={(e) => updateGeneral({ accessibility: e.target.value })} />
                  </Field>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-5">
                  <Field label="Photo de couverture">
                    <input
                      className={fieldClass}
                      type="file"
                      accept="image/*,video/mp4"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const form = new FormData();
                        form.set("file", file);
                        const res = await fetch("/api/upload/cover", { method: "POST", body: form });
                        const data = await res.json().catch(() => null);
                        const url = data?.url || data?.publicUrl;
                        if (url) updateGeneral({ cover_image: url });
                      }}
                    />
                    <input
                      className={`${fieldClass} mt-2`}
                      placeholder="Ou coller une URL"
                      value={general.cover_image ?? ""}
                      onChange={(e) => updateGeneral({ cover_image: e.target.value })}
                    />
                  </Field>
                  {general.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={general.cover_image} alt={general.cover_alt || ""} className="max-h-56 rounded-[24px] object-cover" />
                  ) : null}
                  <Field label="Texte alternatif">
                    <input className={fieldClass} value={general.cover_alt ?? ""} onChange={(e) => updateGeneral({ cover_alt: e.target.value })} />
                  </Field>
                </div>
              ) : null}

              <div className="mt-8 flex justify-between">
                <button type="button" disabled={step === 1} onClick={() => setStep((n) => Math.max(1, n - 1))} className="rounded-full border border-[#E3E0D8] px-4 py-2 text-sm font-semibold disabled:opacity-40">
                  Précédent
                </button>
                <button type="button" disabled={step === 4} onClick={() => setStep((n) => Math.min(4, n + 1))} className="rounded-full bg-[#07080B] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                  Suivant
                </button>
              </div>
            </section>
          ) : (
            <section className="space-y-4">
              <div className="rounded-[32px] bg-[#070C1C] p-6 text-white shadow-[0_0_80px_#6E5BFF59]">
                <p className="text-sm text-white/70">Durée du parcours</p>
                <p className="mt-1 text-3xl font-extrabold">{formatMinutes(totalMinutes)}</p>
                <p className="mt-2 text-sm text-white/70">{sections.length} module{sections.length > 1 ? "s" : ""}</p>
              </div>
              {sections.map((section, index) => {
                const chapters = (section.chapters ?? []).filter((chapter) => !chapter.deleted_at);
                const leaves = chapters.flatMap((chapter) => {
                  const subs = (chapter.subchapters ?? []).filter((sub) => !sub.deleted_at);
                  return subs.length ? subs : [chapter];
                });
                const ready = leaves.length > 0 && leaves.every(isReady);
                const open = openModules[section.id] ?? false;
                return (
                  <article key={section.id} className="rounded-[28px] bg-white">
                    <div className="flex items-center gap-3 p-4">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setOpenModules((prev) => ({ ...prev, [section.id]: !open }))}>
                        <span className="block font-semibold">{section.title || `Module ${index + 1}`}</span>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${ready ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#FFF1E2] text-[#8A4B0F]"}`}>
                          {ready ? "Prêt" : leaves.length ? "À compléter" : "Brouillon"}
                        </span>
                      </button>
                      <button type="button" className={roundBtn} aria-label="Monter le module" onClick={() => move(sections.map((row) => row.id), section.id, -1, reorderSections)}>
                        ↑
                      </button>
                      <button type="button" className={roundBtn} aria-label="Descendre le module" onClick={() => move(sections.map((row) => row.id), section.id, 1, reorderSections)}>
                        ↓
                      </button>
                      <button
                        type="button"
                        className="rounded-full bg-[#FDECEC] px-3 py-2 text-sm font-semibold text-[#B42318]"
                        onClick={() =>
                          askDelete(`Supprimer le module « ${section.title || "sans titre"} » ?`, () => {
                            const stamp = new Date().toISOString();
                            updateSection(section.id, { deleted_at: stamp });
                            scheduleUndo("Module supprimé", () => updateSection(section.id, { deleted_at: null }));
                          })
                        }
                      >
                        Supprimer
                      </button>
                    </div>
                    {open ? (
                      <div className="border-t border-[#F1EFE9] p-4">
                        <input
                          className={`${fieldClass} mb-3`}
                          value={section.title}
                          aria-label="Titre du module"
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        />
                        {chapters.map((chapter) => (
                          <ChapterBlock
                            key={chapter.id}
                            chapter={chapter}
                            sectionId={section.id}
                            onEditChapter={() => setEdit({ level: "chapter", sectionId: section.id, chapterId: chapter.id })}
                            onEditSub={(subId) => {
                              const sub = (chapter.subchapters ?? []).find((row) => row.id === subId);
                              selectSubchapter(section.id, chapter.id, subId);
                              if (sub?.kind === "quiz" || sub?.kind === "resource") {
                                setEdit(null);
                                setAdvanced(true);
                                return;
                              }
                              setEdit({ level: "sub", sectionId: section.id, chapterId: chapter.id, subId });
                            }}
                            onDeleteChapter={() =>
                              askDelete(`Supprimer « ${chapter.title || "contenu"} » ?`, () => {
                                updateChapter(section.id, chapter.id, { deleted_at: new Date().toISOString() });
                                scheduleUndo("Contenu supprimé", () => updateChapter(section.id, chapter.id, { deleted_at: null }));
                              })
                            }
                            onDeleteSub={(sub) =>
                              askDelete(`Supprimer « ${sub.title || "contenu"} » ?`, () => {
                                updateSubchapter(section.id, chapter.id, sub.id, { deleted_at: new Date().toISOString() });
                                scheduleUndo("Contenu supprimé", () => updateSubchapter(section.id, chapter.id, sub.id, { deleted_at: null }));
                              })
                            }
                            onMove={(dir) => move(chapters.map((row) => row.id), chapter.id, dir, (active, over) => reorderChapters(section.id, active, over))}
                          />
                        ))}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold" onClick={() => addChapter(section.id)}>
                            + Chapitre
                          </button>
                          {chapters[0] ? (
                            <>
                              <button type="button" className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold" onClick={() => addSubchapter(section.id, chapters[0].id, { type: "text", title: "Leçon", duration: "10 min" })}>
                                + Leçon
                              </button>
                              <button type="button" className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold" onClick={() => addSubchapter(section.id, chapters[0].id, { type: "video", title: "Vidéo", duration: "5 min" })}>
                                + Vidéo
                              </button>
                              <button type="button" className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold" onClick={() => addSubchapter(section.id, chapters[0].id, { type: "text", kind: "quiz", title: "Quiz", duration: "" })}>
                                + Quiz
                              </button>
                              <button type="button" className="rounded-full border border-[#E3E0D8] px-3 py-2 text-sm font-semibold" onClick={() => addSubchapter(section.id, chapters[0].id, { type: "document", kind: "resource", title: "Ressource", duration: "" })}>
                                + Ressource
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
              <button type="button" onClick={() => addSection()} className="rounded-full bg-[#07080B] px-4 py-3 text-sm font-semibold text-white">
                Ajouter un module
              </button>
              <button type="button" onClick={() => setAdvanced((v) => !v)} className="ml-3 rounded-full border border-[#E3E0D8] bg-white px-4 py-3 text-sm font-semibold">
                {advanced ? "Fermer l'éditeur avancé" : "Éditeur avancé"}
              </button>
              {advanced ? (
                <CourseBuilderWorkspace previewHref="/dashboard/formateur/formations/new/preview" theme="light" courseId={courseId} />
              ) : null}
            </section>
          )}
        </div>

        <aside className="h-fit rounded-[28px] bg-white p-5">
          <p className="text-sm font-semibold">Checklist</p>
          <p className="mt-1 text-2xl font-extrabold">
            {score.done}/{score.total}
          </p>
          <ul className="mt-4 space-y-2">
            {score.checks.map((check) => (
              <li key={check.id}>
                <button
                  type="button"
                  className="flex w-full items-start gap-2 text-left text-sm"
                  onClick={() => {
                    if (check.step) {
                      setTab("fiche");
                      setStep(check.step);
                    } else setTab("contenu");
                  }}
                >
                  <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${check.ok ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#ECE9E1] text-[#3A3D45]"}`}>
                    {check.ok ? "✓" : ""}
                  </span>
                  <span className={check.ok ? "text-[#126B3B]" : "text-[#3A3D45]"}>{check.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {edit ? <EditDrawer edit={edit} onClose={() => setEdit(null)} /> : null}

      {confirm ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Confirmer la suppression">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6">
            <p className="font-semibold">{confirm.label}</p>
            <p className="mt-2 text-sm text-[#6B6F7A]">Vous pourrez annuler pendant 8 secondes.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-full border border-[#E3E0D8] px-4 py-2 text-sm font-semibold" onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded-full bg-[#FDECEC] px-4 py-2 text-sm font-semibold text-[#B42318]"
                onClick={() => {
                  confirm.run();
                  setConfirm(null);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {undo ? (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-[#070C1C] px-4 py-3 text-sm text-white" role="status">
          <span>{undo.label}</span>
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1 font-semibold text-[#07080B]"
            onClick={() => {
              undo.apply();
              setUndo(null);
            }}
          >
            Annuler
          </button>
        </div>
      ) : null}
    </div>
  );
}

const fieldClass = "w-full rounded-2xl border border-[#E3E0D8] bg-white px-3 py-3 text-sm outline-none focus:border-[#6E5BFF]";
const roundBtn = "flex h-[52px] w-[52px] items-center justify-center rounded-full border border-[#E3E0D8] bg-white text-sm font-semibold";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function LineEditor({ label, value, onChange }: { label: string; value: string[]; onChange: (next: string[]) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <ul className="space-y-2">
        {value.map((line, index) => (
          <li key={`${index}-${line.slice(0, 12)}`} className="flex gap-2">
            <input
              className={fieldClass}
              value={line}
              onChange={(e) => onChange(value.map((item, i) => (i === index ? e.target.value : item)))}
            />
            <button type="button" className="rounded-full px-3 text-sm text-[#B42318]" onClick={() => onChange(value.filter((_, i) => i !== index))}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          className={fieldClass}
          value={draft}
          placeholder="Ajouter une ligne"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const next = draft.trim();
              if (!next) return;
              onChange([...value, next]);
              setDraft("");
            }
          }}
        />
      </div>
    </div>
  );
}

function ChapterBlock({
  chapter,
  onEditChapter,
  onEditSub,
  onDeleteChapter,
  onDeleteSub,
  onMove,
}: {
  chapter: CourseBuilderChapter;
  sectionId: string;
  onEditChapter: () => void;
  onEditSub: (id: string) => void;
  onDeleteChapter: () => void;
  onDeleteSub: (sub: CourseBuilderSubchapter) => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const subs = (chapter.subchapters ?? []).filter((sub) => !sub.deleted_at);
  const pill = pillFor(chapter);
  return (
    <div className="mb-3 rounded-[24px] border border-[#F1EFE9] p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: pill.bg, color: pill.fg }}>
          {pill.label}
        </span>
        <button type="button" className="min-w-0 flex-1 truncate text-left text-sm font-semibold" onClick={onEditChapter}>
          {chapter.title || "Sans titre"}
        </button>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isReady(chapter) ? "bg-[#E3F6EC] text-[#126B3B]" : "bg-[#FFF1E2] text-[#8A4B0F]"}`}>
          {isReady(chapter) ? "Prêt" : "À compléter"}
        </span>
        <button type="button" aria-label="Monter" onClick={() => onMove(-1)} className="px-2">
          ↑
        </button>
        <button type="button" aria-label="Descendre" onClick={() => onMove(1)} className="px-2">
          ↓
        </button>
        <button type="button" className="text-sm font-semibold text-[#B42318]" onClick={onDeleteChapter}>
          Supprimer
        </button>
      </div>
      {subs.map((sub) => {
        const subPill = pillFor(sub);
        return (
          <div key={sub.id} className="mt-2 flex items-center gap-2 pl-4">
            <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: subPill.bg, color: subPill.fg }}>
              {subPill.label}
            </span>
            <button type="button" className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => onEditSub(sub.id)}>
              {sub.title || "Sans titre"}
            </button>
            <button type="button" className="text-sm text-[#B42318]" onClick={() => onDeleteSub(sub)}>
              Supprimer
            </button>
          </div>
        );
      })}
    </div>
  );
}

function EditDrawer({
  edit,
  onClose,
}: {
  edit: { level: "chapter"; sectionId: string; chapterId: string } | { level: "sub"; sectionId: string; chapterId: string; subId: string };
  onClose: () => void;
}) {
  const snapshot = useCourseBuilder((s) => s.snapshot);
  const updateChapter = useCourseBuilder((s) => s.updateChapter);
  const updateSubchapter = useCourseBuilder((s) => s.updateSubchapter);
  const section = (snapshot.sections ?? []).find((row) => row.id === edit.sectionId);
  const chapter = section?.chapters?.find((row) => row.id === edit.chapterId);
  const sub = edit.level === "sub" ? chapter?.subchapters?.find((row) => row.id === edit.subId) : null;
  const item = edit.level === "sub" ? sub : chapter;
  if (!item) return null;
  const patch = (payload: { title?: string; duration?: string; content?: string }) => {
    if (edit.level === "sub") updateSubchapter(edit.sectionId, edit.chapterId, edit.subId, payload);
    else updateChapter(edit.sectionId, edit.chapterId, payload);
  };
  return (
    <div className="fixed inset-y-0 right-0 z-30 w-full max-w-md overflow-y-auto border-l border-[#E3E0D8] bg-white p-6" role="dialog" aria-label="Modifier le contenu">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold">Modifier</p>
        <button type="button" onClick={onClose} className="rounded-full border border-[#E3E0D8] px-3 py-1 text-sm">
          Fermer
        </button>
      </div>
      <Field label="Titre">
        <input className={fieldClass} value={item.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <div className="mt-4">
        <Field label="Durée">
          <input className={fieldClass} value={item.duration} onChange={(e) => patch({ duration: e.target.value })} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Contenu">
          <textarea className={`${fieldClass} min-h-40`} value={item.content ?? ""} onChange={(e) => patch({ content: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}
