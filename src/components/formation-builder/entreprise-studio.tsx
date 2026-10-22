"use client";

import { Manrope } from "next/font/google";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { CourseResourcesManager } from "@/components/formateur/course-builder/course-resources-manager";
import { CourseStructureBuilder } from "@/components/formateur/course-builder/course-structure-builder";
import { LineList } from "@/components/formation-builder/line-list";
import { useCourseBuilder } from "@/hooks/use-course-builder";
import { COURSE_LEVEL_BUILDER_OPTIONS } from "@/lib/course-level-options";
import { COURSE_TOOL_OPTIONS, normalizeCourseTools } from "@/lib/course-tools";
import { ficheScore } from "@/lib/courses/fiche-checklist";
import { formatEvaluationMethodsSummary } from "@/lib/openbadges/badge-evaluation";

const ACCESSIBILITY_TEXT = "Formation accessible aux personnes en situation de handicap. Notre LMS est neuroadapté.";

const STUDIO_MODALITY_LABELS: Record<string, string> = {
  qcm: "QCM",
  case_study: "Étude de cas",
  oral_ia: "Audio / Vidéo",
  file_upload: "Dépôt de livrable",
  video: "Présentation",
  ai_qa: "Q&A",
};

type OpenBadgeLink = {
  id: string;
  title?: string | null;
  name?: string | null;
  course_id?: string | null;
  required_course_id?: string | null;
  criteria?: string | null;
  modalities?: unknown;
  evaluation_config?: unknown;
};

function badgeModalitiesLabel(badge: OpenBadgeLink | null) {
  if (!badge) return "";
  const config =
    badge.evaluation_config && typeof badge.evaluation_config === "object"
      ? (badge.evaluation_config as Record<string, unknown>)
      : {};
  const receivability =
    config.receivability && typeof config.receivability === "object"
      ? (config.receivability as Record<string, unknown>)
      : {};
  const expected = String(receivability.expectedModalities ?? "").trim();
  if (expected) return expected;
  const methods = Array.isArray(config.evaluationMethods) ? config.evaluationMethods.map(String) : [];
  const fromMethods = formatEvaluationMethodsSummary(methods);
  if (fromMethods) return fromMethods;
  const modalities =
    badge.modalities && typeof badge.modalities === "object" && !Array.isArray(badge.modalities)
      ? (badge.modalities as Record<string, unknown>)
      : {};
  const labels = Object.keys(modalities)
    .filter((key) => key !== "expected_proofs" && modalities[key])
    .map((key) => STUDIO_MODALITY_LABELS[key] ?? "")
    .filter(Boolean);
  if (labels.length) return labels.join(", ");
  return String(badge.criteria ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

const FORMATS = ["Présentiel", "Distanciel", "Mixte", "E-learning"] as const;
const AUDIENCES = ["Managers", "Commerciaux", "Équipes RH", "Direction", "Nouveaux arrivants", "Tous les collaborateurs"];

type Org = { id: string; name: string };
type Named = { id: string; name: string };
type PathRow = { id: string; title: string };

export function EntrepriseFormationStudio({
  courseId,
  organizations,
  thematics,
  instructors,
  paths,
  validators,
  openBadges,
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
  openBadges: OpenBadgeLink[];
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

  const [tab, setTab] = useState<"fiche" | "contenu">("fiche");
  const [step, setStep] = useState(1);
  const [saveLabel, setSaveLabel] = useState("Brouillon");
  const [skillDraft, setSkillDraft] = useState("");
  const [skillIdeas, setSkillIdeas] = useState<string[]>([]);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  const skipAutosave = useRef(true);

  const general = snapshot.general;
  const linkedBadge = useMemo(() => {
    const id = courseId?.trim();
    if (!id) return null;
    return openBadges.find((badge) => badge.course_id === id || badge.required_course_id === id) ?? null;
  }, [courseId, openBadges]);
  const modalitiesText = useMemo(() => badgeModalitiesLabel(linkedBadge), [linkedBadge]);

  useEffect(() => {
    if ((general.accessibility ?? "") === ACCESSIBILITY_TEXT) return;
    updateGeneral({ accessibility: ACCESSIBILITY_TEXT });
  }, [general.accessibility, updateGeneral]);

  useEffect(() => {
    if (!modalitiesText || (general.evaluation_modalities ?? "") === modalitiesText) return;
    updateGeneral({ evaluation_modalities: modalitiesText });
  }, [general.evaluation_modalities, modalitiesText, updateGeneral]);

  const score = ficheScore(snapshot);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextTab = params.get("tab");
    if (nextTab === "fiche" || nextTab === "contenu") setTab(nextTab);
    const nextStep = Number(params.get("step"));
    if (nextStep >= 1 && nextStep <= 4) setStep(nextStep);
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

  return (
    <div className={`${manrope.className} min-h-screen bg-[#F4F4F1] text-[#07080B]`}>
      <header className={`sticky z-40 border-b border-[#E3E0D8] bg-[#F4F4F1]/95 px-4 py-3 backdrop-blur md:px-8 ${byoundOwned ? "top-12" : "top-0"}`}>
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
          <button
            type="button"
            onClick={onOpenAi}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-4 py-2 text-sm font-bold text-white"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Byound AI
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              void onSave(false).then((ok) => setSaveLabel(ok === false ? "Non enregistré" : "Enregistré"));
            }}
            className="rounded-full border border-[#E3E0D8] bg-white px-4 py-2 text-sm font-semibold disabled:opacity-40"
          >
            Enregistrer
          </button>
          <button
            type="button"
            disabled={publishing}
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
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Objectifs pédagogiques</p>
                    <LineList
                      value={general.objectifs ?? []}
                      onChange={(objectifs) => updateGeneral({ objectifs })}
                      placeholder="Objectif"
                      kind="objectifs"
                      title={general.title ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Prérequis</p>
                    <LineList
                      value={general.prerequisites ?? []}
                      onChange={(prerequisites) => updateGeneral({ prerequisites })}
                      placeholder="Prérequis"
                      kind="prerequis"
                      title={general.title ?? ""}
                    />
                  </div>
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
                    <p className="text-sm text-[#6B6F7A]">Celles de l&apos;Open Badge lié à la formation.</p>
                    {linkedBadge ? (
                      <div className="rounded-2xl border border-[#E3E0D8] bg-[#F7F6F2] px-4 py-3 text-sm">
                        <p className="font-semibold">{linkedBadge.name || linkedBadge.title || "Open Badge"}</p>
                        <p className="mt-2 whitespace-pre-wrap">
                          {modalitiesText || "Cet Open Badge n'a pas encore de modalités d'évaluation."}
                        </p>
                      </div>
                    ) : (
                      <p className="rounded-2xl border border-[#E3E0D8] bg-[#F7F6F2] px-4 py-3 text-sm">
                        Aucun Open Badge n&apos;est lié à cette formation.
                      </p>
                    )}
                  </Field>
                  <Field label="Accessibilité">
                    <p className="rounded-2xl border border-[#E3E0D8] bg-[#F7F6F2] px-4 py-3 text-sm">{ACCESSIBILITY_TEXT}</p>
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
            <section className="space-y-6">
              <button
                type="button"
                onClick={onOpenAi}
                className="inline-flex items-center rounded-full bg-gradient-to-r from-[#003366] via-[#6633CC] to-[#FF00FF] px-5 py-2 text-sm font-bold text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Byound AI
              </button>
              <CourseStructureBuilder theme="light" courseId={courseId} />
              <div className="overflow-hidden rounded-[28px] bg-[#070C1C] p-2 text-white">
                <CourseResourcesManager courseId={courseId} />
              </div>
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

    </div>
  );
}

const fieldClass = "w-full rounded-2xl border border-[#E3E0D8] bg-white px-3 py-3 text-sm outline-none focus:border-[#6E5BFF]";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
