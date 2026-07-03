"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Loader2, RefreshCw, Save, Search, Sparkles, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingCourseRow } from "@/lib/training-courses/types";

type FormState = {
  slug: string;
  title: string;
  short_description: string;
  long_description: string;
  domain: string;
  cover_url: string;
  duration: string;
  level: string;
  formats: string;
  objectives: string;
  skills: string;
  program: string;
  prerequisites: string;
  audience: string;
  intra_price: string;
  inter_price: string;
  max_intra_participants: string;
  badge_name: string;
  meta_description: string;
  seo_tags: string;
  why_choose: string;
  faq: string;
  trainer_name: string;
  trainer_headline: string;
  trainer_photo_url: string;
  is_active: boolean;
};

function linesToArray(value: string): string[] | null {
  const arr = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

function arrayToLines(value: string[] | null | undefined): string {
  return (value ?? []).join("\n");
}

function courseToForm(course: TrainingCourseRow): FormState {
  return {
    slug: course.slug,
    title: course.title,
    short_description: course.short_description ?? "",
    long_description: course.long_description ?? "",
    domain: course.domain ?? "",
    cover_url: course.cover_url ?? "",
    duration: course.duration ?? "",
    level: course.level ?? "",
    formats: arrayToLines(course.formats),
    objectives: arrayToLines(course.objectives),
    skills: arrayToLines(course.skills),
    program: course.program ? JSON.stringify(course.program, null, 2) : "",
    prerequisites: course.prerequisites ?? "",
    audience: arrayToLines(course.audience),
    intra_price: course.intra_price != null ? String(course.intra_price) : "",
    inter_price: course.inter_price != null ? String(course.inter_price) : "",
    max_intra_participants: String(course.max_intra_participants ?? 12),
    badge_name: course.badge_name ?? "",
    meta_description: course.meta_description ?? "",
    seo_tags: arrayToLines(course.seo_tags),
    why_choose: arrayToLines(course.why_choose),
    faq: course.faq ? JSON.stringify(course.faq, null, 2) : "",
    trainer_name: course.trainer_name ?? "",
    trainer_headline: course.trainer_headline ?? "",
    trainer_photo_url: course.trainer_photo_url ?? "",
    is_active: course.is_active ?? true,
  };
}

function formToPayload(form: FormState) {
  let program: unknown = null;
  let faq: unknown = null;
  if (form.program.trim()) {
    program = JSON.parse(form.program);
  }
  if (form.faq.trim()) {
    faq = JSON.parse(form.faq);
  }

  return {
    slug: form.slug.trim(),
    title: form.title.trim(),
    short_description: form.short_description.trim() || null,
    long_description: form.long_description.trim() || null,
    domain: form.domain.trim() || null,
    cover_url: form.cover_url.trim() || null,
    duration: form.duration.trim() || null,
    level: form.level.trim() || null,
    formats: linesToArray(form.formats),
    objectives: linesToArray(form.objectives),
    skills: linesToArray(form.skills),
    program,
    prerequisites: form.prerequisites.trim() || null,
    audience: linesToArray(form.audience),
    intra_price: form.intra_price.trim() ? Number(form.intra_price) : null,
    inter_price: form.inter_price.trim() ? Number(form.inter_price) : null,
    max_intra_participants: Number(form.max_intra_participants) || 12,
    badge_name: form.badge_name.trim() || null,
    meta_description: form.meta_description.trim() || null,
    seo_tags: linesToArray(form.seo_tags),
    why_choose: linesToArray(form.why_choose),
    faq,
    trainer_name: form.trainer_name.trim() || null,
    trainer_headline: form.trainer_headline.trim() || null,
    trainer_photo_url: form.trainer_photo_url.trim() || null,
    is_active: form.is_active,
  };
}

const INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#635BFF]/40 focus:ring-2 focus:ring-[#635BFF]/10";
const TEXTAREA = `${INPUT} min-h-[88px] resize-y font-mono text-xs`;

function CoverUploader({
  coverUrl,
  courseId,
  onUploaded,
}: {
  coverUrl: string;
  courseId: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("courseId", courseId);
      const res = await fetch("/api/super/training-courses/cover", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload échoué");
      onUploaded(json.url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Upload échoué");
    } finally {
      setUploading(false);
      setDragOver(false);
    }
  };

  return (
    <div className="sm:col-span-2 space-y-3">
      <span className="block text-sm font-medium text-gray-700">Cover</span>
      {coverUrl ? (
        <div className="relative aspect-[16/9] max-h-48 overflow-hidden rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition",
          dragOver ? "border-[#635BFF] bg-[#635BFF]/5" : "border-gray-200 bg-gray-50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) void uploadFile(file);
        }}
      >
        <Upload className="h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">Glissez une image ou</p>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mt-2 rounded-lg bg-[#635BFF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7B74FF] disabled:opacity-50"
        >
          {uploading ? "Upload…" : "Uploader une cover"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
      </div>
      <input
        className={INPUT}
        value={coverUrl}
        onChange={(e) => onUploaded(e.target.value)}
        placeholder="Ou coller une URL d'image"
      />
    </div>
  );
}

export function SuperTrainingCoursesManager() {
  const [courses, setCourses] = useState<TrainingCourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [form, setForm] = useState<FormState | null>(null);

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
    loadCourses();
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
    if (selected) setForm(courseToForm(selected));
    else setForm(null);
  }, [selected]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!selected || !form) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = formToPayload(form);
      const res = await fetch(`/api/super/training-courses/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de sauvegarde");
      setCourses((prev) => prev.map((c) => (c.id === selected.id ? json.course : c)));
      setMessage("Formation enregistrée.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const applyAiContent = (content: Record<string, unknown>) => {
    if (!form) return;
    setForm({
      ...form,
      short_description: String(content.short_description ?? form.short_description),
      long_description: String(content.long_description ?? form.long_description),
      objectives: Array.isArray(content.objectives) ? content.objectives.join("\n") : form.objectives,
      skills: Array.isArray(content.skills) ? content.skills.join("\n") : form.skills,
      program: Array.isArray(content.program) ? JSON.stringify(content.program, null, 2) : form.program,
      prerequisites: String(content.prerequisites ?? form.prerequisites),
      audience: Array.isArray(content.audience) ? content.audience.join("\n") : form.audience,
      badge_name: String(content.badge_name ?? form.badge_name),
      inter_price: content.inter_price != null ? String(content.inter_price) : form.inter_price,
      intra_price: content.intra_price != null ? String(content.intra_price) : form.intra_price,
      formats: Array.isArray(content.formats) ? content.formats.join("\n") : form.formats,
      duration: String(content.duration ?? form.duration),
      level: String(content.level ?? form.level),
      meta_description: String(content.meta_description ?? form.meta_description),
      seo_tags: Array.isArray(content.seo_tags) ? content.seo_tags.join("\n") : form.seo_tags,
      why_choose: Array.isArray(content.why_choose) ? content.why_choose.join("\n") : form.why_choose,
      faq: Array.isArray(content.faq) ? JSON.stringify(content.faq, null, 2) : form.faq,
    });
  };

  const runAi = async (mode: "generate" | "improve") => {
    if (!form) return;
    if (mode === "generate" && !form.title.trim()) {
      setError("Saisissez au minimum un titre.");
      return;
    }
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/super/formations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          title: form.title,
          domain: form.domain,
          duration: form.duration,
          level: form.level,
          existing:
            mode === "improve"
              ? {
                  short_description: form.short_description,
                  long_description: form.long_description,
                  objectives: linesToArray(form.objectives),
                  skills: linesToArray(form.skills),
                  program: form.program.trim() ? JSON.parse(form.program) : null,
                  prerequisites: form.prerequisites,
                  audience: linesToArray(form.audience),
                  badge_name: form.badge_name,
                  inter_price: form.inter_price ? Number(form.inter_price) : null,
                  intra_price: form.intra_price ? Number(form.intra_price) : null,
                  formats: linesToArray(form.formats),
                }
              : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur IA");
      applyAiContent(json.content);
      setMessage(mode === "generate" ? "Contenu généré par l'IA." : "Contenu amélioré par l'IA.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur IA");
    } finally {
      setGenerating(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/super/training-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync-catalog" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur de synchronisation");
      setMessage(`${json.synced ?? 0} formations synchronisées depuis le catalogue.`);
      await loadCourses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#635BFF]">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">EDGE Business</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">Gestion des formations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administrer le catalogue « Former vos équipes » — {courses.length} formation(s).
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Importer le catalogue
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre…"
              className={`${INPUT} pl-9`}
            />
          </div>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className={`${INPUT} mt-3`}
          >
            <option value="all">Tous les domaines</option>
            {domains
              .filter((d) => d !== "all")
              .map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>

          <div className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">Chargement…</p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Aucune formation. Importez le catalogue pour commencer.
              </p>
            ) : (
              filtered.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => setSelectedId(course.id)}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition",
                    selectedId === course.id
                      ? "bg-[#635BFF]/10 text-[#635BFF]"
                      : "hover:bg-gray-50 text-gray-700",
                  )}
                >
                  <p className="text-sm font-medium leading-snug">{course.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {course.domain ?? "—"} · {course.is_active ? "Active" : "Inactive"}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          {!form || !selected ? (
            <div className="flex min-h-[400px] items-center justify-center text-sm text-gray-400">
              Sélectionnez une formation à modifier.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{form.title || "Sans titre"}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void runAi("generate")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#635BFF]/30 bg-[#635BFF]/8 px-3 py-2 text-xs font-semibold text-[#635BFF] hover:bg-[#635BFF]/12 disabled:opacity-50"
                  >
                    {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    Générer avec l&apos;IA
                  </button>
                  <button
                    type="button"
                    disabled={generating}
                    onClick={() => void runAi("improve")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Améliorer avec l&apos;IA
                  </button>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => updateField("is_active", e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Slug</span>
                  <input className={INPUT} value={form.slug} onChange={(e) => updateField("slug", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Domaine</span>
                  <input className={INPUT} value={form.domain} onChange={(e) => updateField("domain", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Titre</span>
                  <input className={INPUT} value={form.title} onChange={(e) => updateField("title", e.target.value)} />
                </label>
                <CoverUploader
                  coverUrl={form.cover_url}
                  courseId={selected.id}
                  onUploaded={(url) => updateField("cover_url", url)}
                />
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Description courte</span>
                  <textarea className={TEXTAREA} value={form.short_description} onChange={(e) => updateField("short_description", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Description longue</span>
                  <textarea className={TEXTAREA} value={form.long_description} onChange={(e) => updateField("long_description", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Durée</span>
                  <input className={INPUT} value={form.duration} onChange={(e) => updateField("duration", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Niveau</span>
                  <input className={INPUT} value={form.level} onChange={(e) => updateField("level", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Formats (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.formats} onChange={(e) => updateField("formats", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Prix inter (€ HT)</span>
                  <input className={INPUT} type="number" value={form.inter_price} onChange={(e) => updateField("inter_price", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Prix intra (€ HT)</span>
                  <input className={INPUT} type="number" value={form.intra_price} onChange={(e) => updateField("intra_price", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Max participants intra</span>
                  <input className={INPUT} type="number" value={form.max_intra_participants} onChange={(e) => updateField("max_intra_participants", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Open Badge / certification</span>
                  <input className={INPUT} value={form.badge_name} onChange={(e) => updateField("badge_name", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Meta description SEO</span>
                  <textarea className={TEXTAREA} value={form.meta_description} onChange={(e) => updateField("meta_description", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Tags SEO (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.seo_tags} onChange={(e) => updateField("seo_tags", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Pourquoi choisir (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.why_choose} onChange={(e) => updateField("why_choose", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">FAQ (JSON [{`{q,a}`}])</span>
                  <textarea className={TEXTAREA} value={form.faq} onChange={(e) => updateField("faq", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Objectifs (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.objectives} onChange={(e) => updateField("objectives", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Compétences (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.skills} onChange={(e) => updateField("skills", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Programme (JSON)</span>
                  <textarea className={TEXTAREA} value={form.program} onChange={(e) => updateField("program", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Prérequis</span>
                  <textarea className={TEXTAREA} value={form.prerequisites} onChange={(e) => updateField("prerequisites", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Public cible (un par ligne)</span>
                  <textarea className={TEXTAREA} value={form.audience} onChange={(e) => updateField("audience", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Formateur principal</span>
                  <input className={INPUT} value={form.trainer_name} onChange={(e) => updateField("trainer_name", e.target.value)} />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-gray-700">Titre formateur</span>
                  <input className={INPUT} value={form.trainer_headline} onChange={(e) => updateField("trainer_headline", e.target.value)} />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-gray-700">Photo formateur (URL)</span>
                  <input className={INPUT} value={form.trainer_photo_url} onChange={(e) => updateField("trainer_photo_url", e.target.value)} />
                </label>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#7B74FF] disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Sauvegarder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
