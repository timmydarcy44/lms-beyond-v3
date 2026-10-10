"use client";

import { useEffect, useMemo, useState } from "react";
import { FileUp, GraduationCap, Loader2, Save } from "lucide-react";

import type { ByoundProgramFacts } from "@/lib/byound-school/program-facts";
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

export function ByoundFormationsAdminClient() {
  const [programs, setPrograms] = useState<ByoundProgramFacts[]>([]);
  const [selected, setSelected] = useState<ByoundProgramFacts | null>(null);
  const [draft, setDraft] = useState<ByoundProgramFacts | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
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
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Formation Byound</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/55">
          Cliquez sur une carte pour modifier le rythme, le lieu, les places et les autres
          éléments affichés sur la fiche publique.
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
                        "super-glass-panel rounded-2xl border border-white/10 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-400/40",
                        selected?.specialization === program.specialization &&
                          "border-indigo-400/70",
                      )}
                    >
                      <GraduationCap className="h-5 w-5 text-indigo-400" />
                      <h2 className="mt-4 text-lg font-semibold">{program.title}</h2>
                      <p className="mt-2 text-xs text-white/45">
                        {program.format} · {program.nextIntake}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {program.seatsAvailable} places · {program.location}
                      </p>
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
                Éléments administratifs
              </p>
              <h2 className="mt-1 text-2xl font-semibold">{draft.title}</h2>
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
            <label className="text-sm text-white/70 sm:col-span-2">
              Lien de téléchargement PDF
              <span className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-white">
                {uploadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                ) : (
                  <FileUp className="h-4 w-4 text-indigo-300" />
                )}
                {uploadingPdf ? "Envoi du PDF…" : "Choisir un fichier PDF"}
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
              </span>
              <span className="mt-2 block text-xs text-white/45">
                {draft.programPdfUrl
                  ? "Lien créé. Le bouton public proposera ce fichier après les coordonnées."
                  : "Aucun PDF pour le moment."}
              </span>
            </label>
          </div>
        </div>
      ) : null}
    </div>
  );
}
