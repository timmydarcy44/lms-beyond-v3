"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileUp, GraduationCap, ImagePlus, Loader2, Save } from "lucide-react";

import {
  byoundProgramPublicHref,
  type ByoundProgramFacts,
} from "@/lib/byound-school/program-facts";
import { cn } from "@/lib/utils";

const FIELDS: { key: keyof ByoundProgramFacts; label: string }[] = [
  { key: "format", label: "Format (Alternance ou Initial)" },
  { key: "nextIntake", label: "Prochaine rentrée" },
  { key: "duration", label: "Durée" },
  { key: "volume", label: "Volume" },
  { key: "rhythm", label: "Rythme" },
  { key: "location", label: "Lieu" },
  { key: "level", label: "Niveau" },
  { key: "seatsAvailable", label: "Places disponibles" },
];

function fileLabelFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split("/").pop() || "");
    return name || url;
  } catch {
    return url;
  }
}

type CourseOption = { id: string; title: string };

export function ByoundFormationsAdminClient() {
  const [programs, setPrograms] = useState<ByoundProgramFacts[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selected, setSelected] = useState<ByoundProgramFacts | null>(null);
  const [draft, setDraft] = useState<ByoundProgramFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const groups = useMemo(
    () => [...new Set(programs.map((item) => item.group))],
    [programs],
  );

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/byound-programs");
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible.");
      setPrograms(result.programs ?? []);
      setCourses(Array.isArray(result.courses) ? result.courses : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function open(program: ByoundProgramFacts) {
    setSelected(program);
    setDraft(program);
    setSaved("");
    setError("");
  }

  async function uploadPdf(file: File | null) {
    if (!draft || !file) return;
    setUploadingPdf(true);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("specialization", draft.specialization);
      body.set("file", file);
      const response = await fetch("/api/super-admin/byound-programs/pdf", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi du PDF impossible.");
      setPrograms(result.programs ?? []);
      const next = result.program ?? { ...draft, programPdfUrl: result.programPdfUrl };
      setDraft(next);
      setSelected(next);
      setSaved("PDF enregistré. Le lien de téléchargement est créé.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Envoi du PDF impossible.");
    } finally {
      setUploadingPdf(false);
    }
  }

  async function uploadHero(file: File | null) {
    if (!draft || !file) return;
    setUploadingHero(true);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("specialization", draft.specialization);
      body.set("file", file);
      const response = await fetch("/api/super-admin/byound-programs/hero", {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Envoi de l’image impossible.");
      setPrograms(result.programs ?? []);
      const next = result.program ?? { ...draft, heroImageUrl: result.heroImageUrl };
      setDraft(next);
      setSelected(next);
      setSaved("Image de couverture enregistrée.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Envoi de l’image impossible.");
    } finally {
      setUploadingHero(false);
    }
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/super-admin/byound-programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Enregistrement impossible.");
      setPrograms(result.programs ?? []);
      if (Array.isArray(result.courses)) setCourses(result.courses);
      setDraft(result.program ?? draft);
      setSelected(result.program ?? draft);
      setSaved("Modifications enregistrées. Elles apparaissent sur la fiche formation.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 px-3 py-6 text-white sm:px-6 sm:py-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-400">
          Byound School
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Pages cursus</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Modifiez les infos affichées sur chaque page cursus publique, rattachez une
          formation LMS, déposez la fiche PDF à télécharger, et changez l’image de couverture.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group}>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {programs
                  .filter((item) => item.group === group)
                  .map((program) => (
                    <button
                      key={program.specialization}
                      type="button"
                      onClick={() => open(program)}
                      className={cn(
                        "super-glass-panel overflow-hidden rounded-2xl border border-white/10 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/40",
                        selected?.specialization === program.specialization &&
                          "border-indigo-400/70",
                      )}
                    >
                      <div className="relative aspect-[16/7] bg-[#0b1020]">
                        {program.heroImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element -- admin list thumb
                          <img
                            src={program.heroImageUrl}
                            alt=""
                            className="h-full w-full object-cover opacity-90"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <GraduationCap className="h-6 w-6 text-indigo-400/70" />
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <h2 className="text-lg font-semibold">{program.title}</h2>
                        <p className="mt-2 text-xs text-white/45">
                          {program.format} · {program.nextIntake}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          {program.seatsAvailable} places · {program.location}
                        </p>
                        <p className="mt-3 text-[11px] font-semibold text-indigo-300">
                          {program.lmsCourseId
                            ? program.lmsCourseTitle || "Formation LMS liée"
                            : "Aucune formation LMS"}
                          {" · "}
                          {program.programPdfUrl ? "PDF prêt" : "PDF à déposer"}
                          {" · "}
                          {program.heroImageUrl ? "Hero OK" : "Hero à déposer"}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {draft ? (
        <div className="super-glass-panel rounded-3xl border border-white/10 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-400">
                Page cursus
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{draft.title}</h2>
              {byoundProgramPublicHref(draft.specialization) ? (
                <Link
                  href={byoundProgramPublicHref(draft.specialization)!}
                  target="_blank"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
                >
                  Voir la page publique <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <p className="mt-2 text-xs text-white/40">Page publique pas encore en ligne pour cette filière.</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#070b1f]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </button>
          </div>
          {saved ? <p className="mt-3 text-sm text-emerald-300">{saved}</p> : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm text-white/70">
              Formation LMS rattachée
              <select
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#0b1020] px-3 text-sm text-white outline-none focus:border-indigo-400"
                value={draft.lmsCourseId || ""}
                onChange={(event) => {
                  const id = event.target.value;
                  const course = courses.find((item) => item.id === id);
                  setDraft({
                    ...draft,
                    lmsCourseId: id,
                    lmsCourseTitle: course?.title ?? "",
                  });
                }}
              >
                <option value="">Aucune formation</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-white/45">
                {draft.lmsCourseId
                  ? "Cette page cursus pointe vers une formation du LMS Byound."
                  : "Choisis une formation créée dans LMS → Formations pour lier le cursus."}
              </p>
              {draft.lmsCourseId ? (
                <Link
                  href={`/super/lms/formations/${draft.lmsCourseId}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
                >
                  Ouvrir la formation LMS <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </label>
            {FIELDS.map((field) => (
              <label key={field.key} className="text-sm text-white/70">
                {field.label}
                <input
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400"
                  value={String(draft[field.key] ?? "")}
                  onChange={(event) =>
                    setDraft({ ...draft, [field.key]: event.target.value })
                  }
                />
              </label>
            ))}
            <div className="sm:col-span-2">
              <p className="text-sm text-white/70">Fiche cursus (PDF à télécharger)</p>
              <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white">
                {uploadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                ) : (
                  <FileUp className="h-4 w-4 text-indigo-300" />
                )}
                {uploadingPdf ? "Envoi du PDF…" : "Déposer la fiche cursus PDF"}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={uploadingPdf}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void uploadPdf(file);
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-white/45">
                {draft.programPdfUrl
                  ? "Fiche prête. Sur la page publique, le jeune laisse ses coordonnées puis télécharge ce PDF."
                  : "Sans PDF, le bouton « Télécharger la fiche » reste indisponible sur la page."}
              </p>
              {draft.programPdfUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
                    <p className="truncate text-xs text-white/50">
                      {fileLabelFromUrl(draft.programPdfUrl)}
                    </p>
                    <a
                      href={draft.programPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
                    >
                      Ouvrir <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <iframe
                    key={draft.programPdfUrl}
                    title={`Aperçu PDF ${draft.title}`}
                    src={`${draft.programPdfUrl}#toolbar=0&navpanes=0`}
                    className="h-[28rem] w-full bg-white"
                  />
                </div>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-white/70">Image de couverture (hero)</p>
              <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white">
                {uploadingHero ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                ) : (
                  <ImagePlus className="h-4 w-4 text-indigo-300" />
                )}
                {uploadingHero ? "Envoi de l’image…" : "Choisir une image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  disabled={uploadingHero}
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    event.target.value = "";
                    void uploadHero(file);
                  }}
                />
              </label>
              <p className="mt-2 text-xs text-white/45">
                {draft.heroImageUrl
                  ? "Cette image remplace le visuel en transparence de la page."
                  : "Sans image, la page garde son visuel actuel."}
              </p>
              {draft.heroImageUrl ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5">
                    <p className="truncate text-xs text-white/50">
                      {fileLabelFromUrl(draft.heroImageUrl)}
                    </p>
                    <a
                      href={draft.heroImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
                    >
                      Ouvrir <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="relative aspect-[16/9] w-full bg-[#070b1f]">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of remote storage URL */}
                    <img
                      key={draft.heroImageUrl}
                      src={draft.heroImageUrl}
                      alt={`Hero ${draft.title}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
