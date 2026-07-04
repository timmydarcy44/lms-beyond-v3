"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TrainingCourseRow, TrainingCourseFaqItem } from "@/lib/training-courses/types";
import {
  normalizePageBlocks,
  normalizeProgramStructure,
  type TrainingInstructor,
  type TrainingPageBlock,
  type TrainingProgramSection,
  type TrainingSessionRow,
} from "@/lib/training-courses/cms-types";
import { TrainingProgramBuilder } from "@/components/super-admin/training-cms/training-program-builder";
import { TrainingInstructorsPicker } from "@/components/super-admin/training-cms/training-instructors-picker";
import { TrainingOpenBadgePicker } from "@/components/super-admin/training-cms/training-open-badge-picker";
import { TrainingPageBlocksEditor } from "@/components/super-admin/training-cms/training-page-blocks-editor";
import { TrainingLinesEditor } from "@/components/super-admin/training-cms/training-lines-editor";
import { TrainingMediaUploader } from "@/components/super-admin/training-cms/training-media-uploader";
import { TrainingFaqEditor } from "@/components/super-admin/training-cms/training-faq-editor";
import { TrainingSessionsEditor } from "@/components/super-admin/training-cms/training-sessions-editor";

type CmsState = {
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  domain: string;
  cover_url: string;
  duration: string;
  level: string;
  formats: string[];
  objectives: string[];
  skills: string[];
  prerequisites: string;
  audience: string[];
  benefits: string[];
  case_studies: string[];
  deliverables: string[];
  methodology: string[];
  why_choose: string[];
  intra_price: string;
  inter_price: string;
  max_intra_participants: string;
  badge_name: string;
  badge_class_id: string | null;
  meta_description: string;
  seo_tags: string[];
  faq: TrainingCourseFaqItem[];
  instructors: TrainingInstructor[];
  program_structure: TrainingProgramSection[];
  page_blocks: TrainingPageBlock[];
  sessions: TrainingSessionRow[];
  illustrations: string[];
  is_active: boolean;
};

const TABS = [
  { id: "general", label: "Général" },
  { id: "content", label: "Contenu" },
  { id: "program", label: "Programme" },
  { id: "trainers", label: "Intervenants" },
  { id: "page", label: "Page" },
  { id: "pricing", label: "Tarifs & sessions" },
  { id: "seo", label: "SEO" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40 focus:ring-2 focus:ring-[#635BFF]/10";
const TEXTAREA = `${INPUT} min-h-[88px] resize-y`;

function courseToState(course: TrainingCourseRow): CmsState {
  return {
    slug: course.slug,
    title: course.title,
    short_description: course.short_description ?? "",
    long_description: course.long_description ?? "",
    domain: course.domain ?? "",
    cover_url: course.cover_url ?? "",
    duration: course.duration ?? "",
    level: course.level ?? "",
    formats: course.formats ?? [],
    objectives: course.objectives ?? [],
    skills: course.skills ?? [],
    prerequisites: course.prerequisites ?? "",
    audience: course.audience ?? [],
    benefits: course.benefits ?? [],
    case_studies: course.case_studies ?? [],
    deliverables: course.deliverables ?? [],
    methodology: course.methodology ?? [],
    why_choose: course.why_choose ?? [],
    intra_price: course.intra_price != null ? String(course.intra_price) : "",
    inter_price: course.inter_price != null ? String(course.inter_price) : "",
    max_intra_participants: String(course.max_intra_participants ?? 12),
    badge_name: course.badge_name ?? "",
    badge_class_id: course.badge_class_id ?? null,
    meta_description: course.meta_description ?? "",
    seo_tags: course.seo_tags ?? [],
    faq: course.faq ?? [],
    instructors: (course.instructors as TrainingInstructor[] | null) ?? [],
    program_structure: normalizeProgramStructure(course.program_structure, course.program),
    page_blocks: normalizePageBlocks(course.page_blocks),
    sessions: (course.sessions as TrainingSessionRow[] | null) ?? [],
    illustrations: course.illustrations ?? [],
    is_active: course.is_active ?? true,
  };
}

function stateToPayload(state: CmsState) {
  const primary = state.instructors.find((i) => i.role === "primary");
  return {
    slug: state.slug.trim(),
    title: state.title.trim(),
    short_description: state.short_description.trim() || null,
    long_description: state.long_description.trim() || null,
    domain: state.domain.trim() || null,
    cover_url: state.cover_url.trim() || null,
    duration: state.duration.trim() || null,
    level: state.level.trim() || null,
    formats: state.formats.length ? state.formats : null,
    objectives: state.objectives.filter(Boolean).length ? state.objectives.filter(Boolean) : null,
    skills: state.skills.filter(Boolean).length ? state.skills.filter(Boolean) : null,
    prerequisites: state.prerequisites.trim() || null,
    audience: state.audience.filter(Boolean).length ? state.audience.filter(Boolean) : null,
    benefits: state.benefits.filter(Boolean).length ? state.benefits.filter(Boolean) : null,
    case_studies: state.case_studies.filter(Boolean).length ? state.case_studies.filter(Boolean) : null,
    deliverables: state.deliverables.filter(Boolean).length ? state.deliverables.filter(Boolean) : null,
    methodology: state.methodology.filter(Boolean).length ? state.methodology.filter(Boolean) : null,
    why_choose: state.why_choose.filter(Boolean).length ? state.why_choose.filter(Boolean) : null,
    intra_price: state.intra_price.trim() ? Number(state.intra_price) : null,
    inter_price: state.inter_price.trim() ? Number(state.inter_price) : null,
    max_intra_participants: Number(state.max_intra_participants) || 12,
    badge_name: state.badge_name.trim() || null,
    badge_class_id: state.badge_class_id,
    meta_description: state.meta_description.trim() || null,
    seo_tags: state.seo_tags.filter(Boolean).length ? state.seo_tags.filter(Boolean) : null,
    faq: state.faq.filter((f) => f.q.trim() && f.a.trim()).length
      ? state.faq.filter((f) => f.q.trim() && f.a.trim())
      : null,
    instructors: state.instructors,
    program_structure: state.program_structure,
    program: null,
    page_blocks: state.page_blocks,
    sessions: state.sessions,
    illustrations: state.illustrations.filter(Boolean).length ? state.illustrations.filter(Boolean) : null,
    trainer_id: primary?.expert_id ?? null,
    trainer_name: primary ? `${primary.first_name} ${primary.last_name}`.trim() : null,
    trainer_headline: primary?.headline ?? null,
    trainer_photo_url: primary?.photo_url ?? null,
    is_active: state.is_active,
  };
}

export function TrainingCoursesCms() {
  const [courses, setCourses] = useState<TrainingCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [tab, setTab] = useState<TabId>("general");
  const [state, setState] = useState<CmsState | null>(null);

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/super/training-courses");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de chargement");
      setCourses(json.courses ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const domains = useMemo(() => {
    const set = new Set(courses.map((c) => c.domain).filter(Boolean) as string[]);
    return ["all", ...Array.from(set).sort()];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      if (domainFilter !== "all" && c.domain !== domainFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.domain ?? "").toLowerCase().includes(q)
      );
    });
  }, [courses, domainFilter, search]);

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    if (selected) setState(courseToState(selected));
    else setState(null);
  }, [selected]);

  const patch = <K extends keyof CmsState>(key: K, value: CmsState[K]) => {
    setState((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!selected || !state) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/super/training-courses/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stateToPayload(state)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de sauvegarde");
      setCourses((prev) => prev.map((c) => (c.id === selected.id ? json.course : c)));
      setState(courseToState(json.course));
      setMessage("Formation enregistrée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    const title = window.prompt("Titre de la nouvelle formation", "Nouvelle formation");
    if (!title?.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/super/training-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-blank", title: title.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setCourses((prev) => [...prev, json.course]);
      setSelectedId(json.course.id);
      setMessage("Formation créée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setCreating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/super/training-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-catalog" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMessage(`${json.synced ?? 0} formations synchronisées.`);
      await loadCourses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSyncing(false);
    }
  };

  const applyAi = (content: Record<string, unknown>) => {
    if (!state) return;
    const programStructure = Array.isArray(content.program_structure)
      ? (content.program_structure as TrainingProgramSection[])
      : state.program_structure;

    setState({
      ...state,
      title: String(content.title ?? state.title),
      short_description: String(content.short_description ?? state.short_description),
      long_description: String(content.long_description ?? state.long_description),
      duration: String(content.duration ?? state.duration),
      level: String(content.level ?? state.level),
      objectives: Array.isArray(content.objectives) ? (content.objectives as string[]) : state.objectives,
      skills: Array.isArray(content.skills) ? (content.skills as string[]) : state.skills,
      benefits: Array.isArray(content.benefits) ? (content.benefits as string[]) : state.benefits,
      why_choose: Array.isArray(content.why_choose) ? (content.why_choose as string[]) : state.why_choose,
      case_studies: Array.isArray(content.case_studies) ? (content.case_studies as string[]) : state.case_studies,
      deliverables: Array.isArray(content.deliverables) ? (content.deliverables as string[]) : state.deliverables,
      methodology: Array.isArray(content.methodology) ? (content.methodology as string[]) : state.methodology,
      prerequisites: String(content.prerequisites ?? state.prerequisites),
      audience: Array.isArray(content.audience) ? (content.audience as string[]) : state.audience,
      badge_name: String(content.badge_name ?? state.badge_name),
      inter_price: content.inter_price != null ? String(content.inter_price) : state.inter_price,
      intra_price: content.intra_price != null ? String(content.intra_price) : state.intra_price,
      formats: Array.isArray(content.formats) ? (content.formats as string[]) : state.formats,
      meta_description: String(content.meta_description ?? state.meta_description),
      seo_tags: Array.isArray(content.seo_tags) ? (content.seo_tags as string[]) : state.seo_tags,
      faq: Array.isArray(content.faq) ? (content.faq as TrainingCourseFaqItem[]) : state.faq,
      program_structure: programStructure,
    });
  };

  const runAi = async (mode: "generate" | "improve") => {
    if (!state) return;
    if (mode === "generate" && !state.title.trim()) {
      setError("Saisissez au minimum un titre.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/super/formations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: state.title,
          domain: state.domain,
          duration: state.duration,
          level: state.level,
          existing: mode === "improve" ? stateToPayload(state) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur IA");
      applyAi(json.content);
      setMessage(mode === "generate" ? "Fiche générée par l'IA — enregistrez pour publier." : "Fiche améliorée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur IA");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#635BFF]">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">CMS Formations EDGE</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Gestion des formations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Créez des fiches formation professionnelles — structure publique, sans contenu LMS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7B74FF] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Nouvelle formation
          </button>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Importer catalogue
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#635BFF]/40"
            />
          </div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {domains.map((d) => (
              <option key={d} value={d}>
                {d === "all" ? "Tous les domaines" : d}
              </option>
            ))}
          </select>
          <div className="max-h-[60vh] space-y-1 overflow-y-auto rounded-2xl border border-gray-200 bg-white p-2">
            {loading ? (
              <p className="p-4 text-sm text-gray-400">Chargement…</p>
            ) : (
              filtered.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedId(course.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-3 text-left transition",
                    selectedId === course.id ? "bg-[#635BFF]/10 text-[#635BFF]" : "hover:bg-gray-50",
                  )}
                >
                  <p className="text-sm font-semibold">{course.title}</p>
                  <p className="text-xs text-gray-400">{course.domain ?? course.slug}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="min-w-0">
          {!selected || !state ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
              Sélectionnez ou créez une formation
            </div>
          ) : (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div className="flex flex-wrap gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition",
                        tab === t.id ? "bg-[#635BFF] text-white" : "text-gray-600 hover:bg-gray-100",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void runAi("generate")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#635BFF]/25 bg-[#635BFF]/8 px-3 py-2 text-xs font-semibold text-[#635BFF] disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Générer avec l&apos;IA
                  </button>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void runAi("improve")}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Améliorer
                  </button>
                  <Link
                    href={`/edge-lab/business/formations/${state.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Aperçu <ExternalLink className="h-3 w-3" />
                  </Link>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSave()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Enregistrer
                  </button>
                </div>
              </div>

              {tab === "general" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block font-medium text-gray-700">Titre</span>
                    <input className={INPUT} value={state.title} onChange={(e) => patch("title", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Slug</span>
                    <input className={INPUT} value={state.slug} onChange={(e) => patch("slug", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Domaine</span>
                    <input className={INPUT} value={state.domain} onChange={(e) => patch("domain", e.target.value)} />
                  </label>
                  <div className="sm:col-span-2">
                    <TrainingMediaUploader
                      courseId={selected.id}
                      value={state.cover_url}
                      onChange={(url) => patch("cover_url", url)}
                      label="Cover"
                      kind="cover"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={state.is_active}
                      onChange={(e) => patch("is_active", e.target.checked)}
                    />
                    Formation active (visible sur le site public)
                  </label>
                </div>
              )}

              {tab === "content" && (
                <div className="space-y-6">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Description courte</span>
                    <textarea className={TEXTAREA} value={state.short_description} onChange={(e) => patch("short_description", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Description longue (présentation)</span>
                    <textarea className={`${TEXTAREA} min-h-[160px]`} value={state.long_description} onChange={(e) => patch("long_description", e.target.value)} />
                  </label>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <TrainingLinesEditor label="Objectifs" items={state.objectives} onChange={(v) => patch("objectives", v)} />
                    <TrainingLinesEditor label="Compétences acquises" items={state.skills} onChange={(v) => patch("skills", v)} />
                    <TrainingLinesEditor label="Pourquoi choisir" items={state.why_choose} onChange={(v) => patch("why_choose", v)} />
                    <TrainingLinesEditor label="Bénéfices" items={state.benefits} onChange={(v) => patch("benefits", v)} />
                    <TrainingLinesEditor label="Cas pratiques" items={state.case_studies} onChange={(v) => patch("case_studies", v)} />
                    <TrainingLinesEditor label="Livrables" items={state.deliverables} onChange={(v) => patch("deliverables", v)} />
                    <TrainingLinesEditor label="Méthodologie" items={state.methodology} onChange={(v) => patch("methodology", v)} />
                    <TrainingLinesEditor label="Public cible" items={state.audience} onChange={(v) => patch("audience", v)} />
                  </div>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Prérequis</span>
                    <textarea className={TEXTAREA} value={state.prerequisites} onChange={(e) => patch("prerequisites", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Durée</span>
                    <input className={INPUT} value={state.duration} onChange={(e) => patch("duration", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Niveau</span>
                    <input className={INPUT} value={state.level} onChange={(e) => patch("level", e.target.value)} />
                  </label>
                  <TrainingLinesEditor
                    label="Formats (Présentiel, Distanciel, Blended, Sur mesure)"
                    items={state.formats}
                    onChange={(v) => patch("formats", v)}
                  />
                  <TrainingFaqEditor items={state.faq} onChange={(v) => patch("faq", v)} />
                  <div>
                    <TrainingLinesEditor
                      label="Illustrations (URLs après upload)"
                      items={state.illustrations}
                      onChange={(v) => patch("illustrations", v)}
                    />
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {state.illustrations.map((url, i) =>
                        url ? (
                          <div key={i} className="relative aspect-video overflow-hidden rounded-xl border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : null,
                      )}
                    </div>
                    <div className="mt-3">
                      <TrainingMediaUploader
                        courseId={selected.id}
                        value=""
                        onChange={(url) => patch("illustrations", [...state.illustrations.filter(Boolean), url])}
                        label="Ajouter une illustration"
                        kind="illustration"
                      />
                    </div>
                  </div>
                </div>
              )}

              {tab === "program" && (
                <TrainingProgramBuilder
                  sections={state.program_structure}
                  onChange={(v) => patch("program_structure", v)}
                />
              )}

              {tab === "trainers" && (
                <div className="space-y-8">
                  <TrainingInstructorsPicker
                    courseId={selected.id}
                    instructors={state.instructors}
                    onChange={(v) => patch("instructors", v)}
                  />
                  <TrainingOpenBadgePicker
                    badgeClassId={state.badge_class_id}
                    badgeName={state.badge_name}
                    onSelect={({ id, name }) => {
                      patch("badge_class_id", id);
                      patch("badge_name", name);
                    }}
                    onClear={() => {
                      patch("badge_class_id", null);
                      patch("badge_name", "");
                    }}
                  />
                </div>
              )}

              {tab === "page" && (
                <TrainingPageBlocksEditor
                  blocks={state.page_blocks}
                  onChange={(v) => patch("page_blocks", v)}
                />
              )}

              {tab === "pricing" && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Prix inter (€ HT / participant)</span>
                    <input className={INPUT} type="number" value={state.inter_price} onChange={(e) => patch("inter_price", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Prix intra (€ HT / groupe)</span>
                    <input className={INPUT} type="number" value={state.intra_price} onChange={(e) => patch("intra_price", e.target.value)} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Max participants intra</span>
                    <input className={INPUT} type="number" value={state.max_intra_participants} onChange={(e) => patch("max_intra_participants", e.target.value)} />
                  </label>
                  <div className="sm:col-span-2">
                    <TrainingSessionsEditor sessions={state.sessions} onChange={(v) => patch("sessions", v)} />
                  </div>
                </div>
              )}

              {tab === "seo" && (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-gray-700">Meta description</span>
                    <textarea className={TEXTAREA} value={state.meta_description} onChange={(e) => patch("meta_description", e.target.value)} />
                  </label>
                  <TrainingLinesEditor label="Mots-clés SEO" items={state.seo_tags} onChange={(v) => patch("seo_tags", v)} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
