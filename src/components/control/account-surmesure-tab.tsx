"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  createId,
  type TrainingProgramSection,
  type TrainingProgramSubchapterKind,
} from "@/lib/training-courses/cms-types";
import { EmptyState, Field, SidePanel, fieldClass } from "./chrome";

type SurMesureCourse = {
  id: string;
  title: string;
  short_description: string | null;
  duration: string | null;
  level: string | null;
  domain: string | null;
  prerequisites: string | null;
  specific_needs: string | null;
  objectives: string[] | null;
  audience: string[] | null;
  skills: string[] | null;
  formats: string[] | null;
  intra_price: number | null;
  inter_price: number | null;
  program_structure: TrainingProgramSection[] | null;
  updated_at: string | null;
};

type QualiopiDraft = {
  title: string;
  short_description: string;
  duration: string;
  level: string;
  domain: string;
  prerequisites: string;
  specific_needs: string;
  objectives_text: string;
  audience_text: string;
  skills_text: string;
  formats_text: string;
  intra_price: string;
  inter_price: string;
  brief: string;
};

const EMPTY_DRAFT: QualiopiDraft = {
  title: "",
  short_description: "",
  duration: "2 jours",
  level: "Intermédiaire",
  domain: "",
  prerequisites: "",
  specific_needs: "",
  objectives_text: "",
  audience_text: "",
  skills_text: "",
  formats_text: "Sur mesure",
  intra_price: "",
  inter_price: "",
  brief: "",
};

function kindLabel(kind?: TrainingProgramSubchapterKind) {
  if (kind === "quiz") return "Quiz";
  if (kind === "experiential_interview") return "Entretien";
  return null;
}

function StructureOutline({
  sections,
  onChange,
}: {
  sections: TrainingProgramSection[];
  onChange: (next: TrainingProgramSection[]) => void;
}) {
  function addActivity(
    sectionIndex: number,
    chapterIndex: number,
    kind: "quiz" | "experiential_interview",
  ) {
    const next = sections.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        chapters: section.chapters.map((chapter, ci) => {
          if (ci !== chapterIndex) return chapter;
          return {
            ...chapter,
            subchapters: [
              ...chapter.subchapters,
              {
                id: createId(),
                title: kind === "quiz" ? "Quiz de validation" : "Entretien expérientiel",
                kind,
              },
            ],
          };
        }),
      };
    });
    onChange(next);
  }

  function removeSubchapter(sectionIndex: number, chapterIndex: number, subIndex: number) {
    const next = sections.map((section, si) => {
      if (si !== sectionIndex) return section;
      return {
        ...section,
        chapters: section.chapters.map((chapter, ci) => {
          if (ci !== chapterIndex) return chapter;
          return {
            ...chapter,
            subchapters: chapter.subchapters.filter((_, i) => i !== subIndex),
          };
        }),
      };
    });
    onChange(next);
  }

  if (!sections.length) {
    return (
      <p className="rounded-2xl border border-dashed border-[#26304F] px-4 py-6 text-sm text-[#8A93AE]">
        Aucune structure pour l’instant. Lancez Byound AI pour proposer sections, chapitres et
        sous-chapitres.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#8A93AE]">
        Structure seule — pas d’édition de contenu des chapitres. Vous pouvez ajouter un quiz ou un
        entretien.
      </p>
      {sections.map((section, si) => (
        <div key={section.id} className="rounded-2xl border border-[#26304F] bg-[#111831] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#C4B8FF]">
            Section {si + 1}
          </p>
          <h4 className="mt-1 text-sm font-extrabold text-white">{section.title}</h4>
          {section.description ? (
            <p className="mt-1 text-xs text-[#8A93AE]">{section.description}</p>
          ) : null}
          <div className="mt-3 space-y-3">
            {section.chapters.map((chapter, ci) => (
              <div key={chapter.id} className="rounded-xl border border-[#1A2340] bg-[#0B1122] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8A93AE]">
                  Chapitre {ci + 1}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-[#E8ECF8]">{chapter.title}</p>
                <ul className="mt-2 space-y-1.5">
                  {chapter.subchapters.map((sub, subi) => {
                    const label = kindLabel(sub.kind);
                    return (
                      <li
                        key={sub.id}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-[#C9D2E8]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="text-[#5A6480]">↳</span>
                          <span className="truncate">{sub.title}</span>
                          {label ? (
                            <span className="shrink-0 rounded-full bg-[#241C3E] px-2 py-0.5 text-[10px] font-semibold text-[#C4B8FF]">
                              {label}
                            </span>
                          ) : null}
                        </span>
                        {sub.kind === "quiz" || sub.kind === "experiential_interview" ? (
                          <button
                            type="button"
                            className="shrink-0 text-[#FF8A9B] hover:underline"
                            onClick={() => removeSubchapter(si, ci, subi)}
                          >
                            Retirer
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#26304F] px-2.5 py-1 text-[11px] font-semibold text-[#C9D2E8]"
                    onClick={() => addActivity(si, ci, "quiz")}
                  >
                    + Quiz
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#26304F] px-2.5 py-1 text-[11px] font-semibold text-[#C9D2E8]"
                    onClick={() => addActivity(si, ci, "experiential_interview")}
                  >
                    + Entretien
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountSurMesureTab({
  organizationId,
  organizationName,
}: {
  organizationId: string;
  organizationName: string;
}) {
  const [courses, setCourses] = useState<SurMesureCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"create" | "edit" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QualiopiDraft>(EMPTY_DRAFT);
  const [structure, setStructure] = useState<TrainingProgramSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const active = useMemo(
    () => courses.find((c) => c.id === activeId) ?? null,
    [courses, activeId],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure`);
      const json = (await res.json()) as {
        courses?: SurMesureCourse[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setCourses(json.courses ?? []);
      if (json.error) setError(json.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openCreate() {
    setActiveId(null);
    setDraft(EMPTY_DRAFT);
    setStructure([]);
    setPanel("create");
    setNotice(null);
  }

  function openEdit(course: SurMesureCourse) {
    setActiveId(course.id);
    setDraft({
      title: course.title ?? "",
      short_description: course.short_description ?? "",
      duration: course.duration ?? "",
      level: course.level ?? "",
      domain: course.domain ?? "",
      prerequisites: course.prerequisites ?? "",
      specific_needs: course.specific_needs ?? "",
      objectives_text: (course.objectives ?? []).join("\n"),
      audience_text: (course.audience ?? []).join("\n"),
      skills_text: (course.skills ?? []).join("\n"),
      formats_text: (course.formats ?? []).join("\n") || "Sur mesure",
      intra_price: course.intra_price != null ? String(course.intra_price) : "",
      inter_price: course.inter_price != null ? String(course.inter_price) : "",
      brief: "",
    });
    setStructure(course.program_structure ?? []);
    setPanel("edit");
    setNotice(null);
  }

  async function saveQualiopi(opts?: { thenGenerate?: boolean }) {
    if (!draft.title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: draft.title.trim(),
        short_description: draft.short_description.trim(),
        duration: draft.duration.trim(),
        level: draft.level.trim(),
        domain: draft.domain.trim(),
        prerequisites: draft.prerequisites.trim(),
        specific_needs: draft.specific_needs.trim(),
        objectives_text: draft.objectives_text,
        audience_text: draft.audience_text,
        skills_text: draft.skills_text,
        formats_text: draft.formats_text,
        intra_price: draft.intra_price,
        inter_price: draft.inter_price,
        program_structure: structure,
      };

      let courseId = activeId;
      if (!courseId) {
        const res = await fetch(`/api/super/comptes-clients/${organizationId}/surmesure`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { course?: SurMesureCourse; error?: string };
        if (!res.ok || !json.course) throw new Error(json.error || "Création impossible");
        courseId = json.course.id;
        setActiveId(courseId);
        setPanel("edit");
        setCourses((prev) => [json.course!, ...prev.filter((c) => c.id !== json.course!.id)]);
      } else {
        const res = await fetch(
          `/api/super/comptes-clients/${organizationId}/surmesure/${courseId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const json = (await res.json()) as { course?: SurMesureCourse; error?: string };
        if (!res.ok || !json.course) throw new Error(json.error || "Enregistrement impossible");
        setCourses((prev) => prev.map((c) => (c.id === json.course!.id ? json.course! : c)));
      }

      setNotice("Fiche Qualiopi enregistrée.");
      if (opts?.thenGenerate && courseId) {
        await generateStructure(courseId);
      } else {
        await reload();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  async function generateStructure(courseId: string) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${courseId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brief: draft.brief.trim() || undefined }),
        },
      );
      const json = (await res.json()) as {
        course?: SurMesureCourse;
        program_structure?: TrainingProgramSection[];
        error?: string;
      };
      if (!res.ok) throw new Error(json.error || "Génération impossible");
      const next = json.program_structure ?? json.course?.program_structure ?? [];
      setStructure(next);
      if (json.course) {
        setCourses((prev) => prev.map((c) => (c.id === json.course!.id ? json.course! : c)));
      }
      setNotice("Structure générée avec Byound AI.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible");
    } finally {
      setGenerating(false);
    }
  }

  async function persistStructure(next: TrainingProgramSection[]) {
    setStructure(next);
    if (!activeId) return;
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${activeId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ program_structure: next }),
        },
      );
      const json = (await res.json()) as { course?: SurMesureCourse; error?: string };
      if (!res.ok || !json.course) throw new Error(json.error || "Maj structure impossible");
      setCourses((prev) => prev.map((c) => (c.id === json.course!.id ? json.course! : c)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Maj structure impossible");
    }
  }

  async function removeCourse(course: SurMesureCourse) {
    if (!confirm(`Supprimer « ${course.title} » ?`)) return;
    try {
      const res = await fetch(
        `/api/super/comptes-clients/${organizationId}/surmesure/${course.id}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Suppression impossible");
      setCourses((prev) => prev.filter((c) => c.id !== course.id));
      if (activeId === course.id) {
        setPanel(null);
        setActiveId(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Sur-mesure</h2>
          <p className="mt-1 max-w-2xl text-sm text-[#8A93AE]">
            Co-construisez en direct avec {organizationName} une formation ou un programme :
            cadrage Qualiopi, puis structure Byound AI (sections / chapitres / quiz / entretien) —
            sans contenu de chapitre.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> Nouvelle formation Sur-mesure
        </button>
      </div>

      {notice ? <p className="text-sm text-[#6BE39B]">{notice}</p> : null}
      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-[#8A93AE]">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </p>
      ) : courses.length === 0 ? (
        <EmptyState title="Aucune formation Sur-mesure pour ce compte." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {courses.map((course) => {
            const sections = course.program_structure?.length ?? 0;
            const chapters =
              course.program_structure?.reduce((n, s) => n + s.chapters.length, 0) ?? 0;
            return (
              <article
                key={course.id}
                className="rounded-[24px] border border-[#1A2340] bg-[#111831] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{course.title}</h3>
                    <p className="mt-1 text-xs text-[#8A93AE]">
                      {[
                        course.duration,
                        course.level,
                        sections ? `${sections} section(s)` : "Structure à générer",
                        chapters ? `${chapters} chapitre(s)` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#FF8A9B] hover:bg-[#2A1520]"
                    onClick={() => void removeCourse(course)}
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {course.short_description ? (
                  <p className="mt-2 line-clamp-2 text-sm text-[#C9D2E8]">
                    {course.short_description}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="mt-3 rounded-full border border-[#26304F] px-3 py-1.5 text-sm font-semibold"
                  onClick={() => openEdit(course)}
                >
                  Ouvrir / co-construire
                </button>
              </article>
            );
          })}
        </div>
      )}

      {panel ? (
        <SidePanel
          title={active ? active.title : "Nouvelle formation Sur-mesure"}
          onClose={() => setPanel(null)}
        >
          <div className="space-y-5 pb-8">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
                Cadrage Qualiopi
              </p>
              <Field label="Titre">
                <input
                  className={fieldClass}
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="Ex. Leadership hybride pour managers"
                />
              </Field>
              <Field label="Description courte">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={draft.short_description}
                  onChange={(e) => setDraft((d) => ({ ...d, short_description: e.target.value }))}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Durée">
                  <input
                    className={fieldClass}
                    value={draft.duration}
                    onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                    placeholder="2 jours"
                  />
                </Field>
                <Field label="Niveau">
                  <input
                    className={fieldClass}
                    value={draft.level}
                    onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Domaine">
                <input
                  className={fieldClass}
                  value={draft.domain}
                  onChange={(e) => setDraft((d) => ({ ...d, domain: e.target.value }))}
                />
              </Field>
              <Field label="Prérequis">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={draft.prerequisites}
                  onChange={(e) => setDraft((d) => ({ ...d, prerequisites: e.target.value }))}
                />
              </Field>
              <Field label="Besoins spécifiques / adaptations">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={draft.specific_needs}
                  onChange={(e) => setDraft((d) => ({ ...d, specific_needs: e.target.value }))}
                  placeholder="Accessibilité, rythme, contraintes métier…"
                />
              </Field>
              <Field label="Objectifs pédagogiques (1 par ligne)">
                <textarea
                  className={fieldClass}
                  rows={4}
                  value={draft.objectives_text}
                  onChange={(e) => setDraft((d) => ({ ...d, objectives_text: e.target.value }))}
                />
              </Field>
              <Field label="Public cible (1 par ligne)">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={draft.audience_text}
                  onChange={(e) => setDraft((d) => ({ ...d, audience_text: e.target.value }))}
                />
              </Field>
              <Field label="Compétences visées (1 par ligne)">
                <textarea
                  className={fieldClass}
                  rows={2}
                  value={draft.skills_text}
                  onChange={(e) => setDraft((d) => ({ ...d, skills_text: e.target.value }))}
                />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Prix intra (€ HT)">
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={draft.intra_price}
                    onChange={(e) => setDraft((d) => ({ ...d, intra_price: e.target.value }))}
                  />
                </Field>
                <Field label="Prix inter (€ HT)">
                  <input
                    className={fieldClass}
                    inputMode="decimal"
                    value={draft.inter_price}
                    onChange={(e) => setDraft((d) => ({ ...d, inter_price: e.target.value }))}
                  />
                </Field>
              </div>
              <Field label="Brief commercial (optionnel, pour l’IA)">
                <textarea
                  className={fieldClass}
                  rows={3}
                  value={draft.brief}
                  onChange={(e) => setDraft((d) => ({ ...d, brief: e.target.value }))}
                  placeholder="Contexte client, enjeux, contraintes session…"
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || generating}
                  className="rounded-full border border-[#26304F] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  onClick={() => void saveQualiopi()}
                >
                  {saving ? "Enregistrement…" : "Enregistrer la fiche"}
                </button>
                <button
                  type="button"
                  disabled={saving || generating || !draft.title.trim()}
                  className="inline-flex items-center gap-2 rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  onClick={() => void saveQualiopi({ thenGenerate: true })}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Créer la formation avec Byound AI
                </button>
              </div>
            </section>

            <section className="space-y-3 border-t border-[#1A2340] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#C4B8FF]">
                  Structure (builder)
                </p>
                {activeId ? (
                  <button
                    type="button"
                    disabled={generating}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C4B8FF] disabled:opacity-50"
                    onClick={() => void generateStructure(activeId)}
                  >
                    {generating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Régénérer
                  </button>
                ) : null}
              </div>
              <StructureOutline sections={structure} onChange={(next) => void persistStructure(next)} />
            </section>
          </div>
        </SidePanel>
      ) : null}
    </div>
  );
}
