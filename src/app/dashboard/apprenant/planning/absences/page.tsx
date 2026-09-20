"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FileUp, X } from "lucide-react";

import {
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import {
  ABSENCE_STATUS_LABELS,
  summarizeAbsences,
  type AbsenceStatus,
} from "@/lib/ecole/absences";
import { instructorDisplayName } from "@/lib/ecole/instructors";
import { cn } from "@/lib/utils";

type AbsenceRow = {
  id: string;
  status: string;
  duration_hours: number;
  motif?: string | null;
  proof_filename?: string | null;
  slot?: {
    starts_at?: string;
    ends_at?: string;
    module?: { name?: string } | null;
    instructor?: { first_name?: string; last_name?: string } | null;
  } | null;
};

function AbsencesContent() {
  const [absences, setAbsences] = useState<AbsenceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [motif, setMotif] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/apprenant/planning/absences", { credentials: "include" });
    const json = await res.json();
    setAbsences(json.absences ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeAbsences(absences), [absences]);
  const justifiable = absences.filter((a) => a.status === "to_justify" || a.status === "refused");

  const submit = async () => {
    if (!selectedId || !file) {
      setError("Sélectionnez une absence et un justificatif");
      return;
    }
    setSaving(true);
    setError(null);
    const fd = new FormData();
    fd.set("absence_id", selectedId);
    fd.set("motif", motif);
    fd.set("file", file);
    const res = await fetch("/api/dashboard/apprenant/planning/absences", {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Envoi impossible");
      return;
    }
    setModalOpen(false);
    setFile(null);
    setMotif("");
    await load();
  };

  const formatDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "—";

  const formatTime = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "—";

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <p className={APPRENANT_PAGE_KICKER}>Planning</p>
      <h1 className={APPRENANT_PAGE_TITLE}>Mes absences</h1>
      <p className={APPRENANT_PAGE_LEAD}>
        Suivez vos absences liées aux cours de votre emploi du temps et déposez un justificatif.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Heures d’absence", value: `${summary.hours} h` },
          { label: "Absences", value: String(summary.count) },
          { label: "À justifier", value: String(summary.toJustify) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/35">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{loading ? "…" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            setSelectedId(justifiable[0]?.id ?? "");
            setModalOpen(true);
          }}
          className="rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Justifier une absence
        </button>
      </div>

      <div className="mt-8 space-y-3">
        {absences.map((a) => {
          const slot = a.slot;
          return (
            <article
              key={a.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{formatDate(slot?.starts_at)}</p>
                  <p className="mt-1 text-base font-bold text-white">{slot?.module?.name ?? "Cours"}</p>
                  <p className="mt-1 text-sm text-white/50">
                    {formatTime(slot?.starts_at)} — {formatTime(slot?.ends_at)}
                    {" · "}
                    {a.duration_hours} h
                  </p>
                  <p className="mt-1 text-sm text-white/40">
                    {slot?.instructor
                      ? instructorDisplayName(slot.instructor)
                      : "Formateur"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    a.status === "justified" && "bg-emerald-500/15 text-emerald-300",
                    a.status === "to_justify" && "bg-amber-500/15 text-amber-300",
                    a.status === "proof_sent" && "bg-blue-500/15 text-blue-300",
                    a.status === "refused" && "bg-rose-500/15 text-rose-300",
                  )}
                >
                  {ABSENCE_STATUS_LABELS[a.status as AbsenceStatus] ?? a.status}
                </span>
              </div>
            </article>
          );
        })}
        {!loading && absences.length === 0 ? (
          <p className="text-sm text-white/40">Aucune absence enregistrée.</p>
        ) : null}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121A] p-5 text-white shadow-2xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold">Justifier une absence</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-white/40">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-white/40">Absence</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                >
                  <option value="">Choisir…</option>
                  {justifiable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {formatDate(a.slot?.starts_at)} — {a.slot?.module?.name ?? "Cours"} ({a.duration_hours} h)
                    </option>
                  ))}
                </select>
              </label>
              {selectedId ? (
                <div className="rounded-xl bg-white/[0.04] px-3 py-2 text-xs text-white/50">
                  {(() => {
                    const a = absences.find((x) => x.id === selectedId);
                    return a
                      ? `${formatDate(a.slot?.starts_at)} · ${a.slot?.module?.name ?? "Cours"} · ${a.duration_hours} h`
                      : null;
                  })()}
                </div>
              ) : null}
              <label className="block text-sm">
                <span className="mb-1 block text-xs text-white/40">Motif (facultatif)</span>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                  rows={3}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                />
              </label>
              <div
                className={cn(
                  "rounded-xl border border-dashed px-4 py-6 text-center transition",
                  dragOver ? "border-[#3D7BFF] bg-[#3D7BFF]/10" : "border-white/15 bg-white/[0.03]",
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
              >
                <FileUp className="mx-auto h-5 w-5 text-white/40" />
                <p className="mt-2 text-sm text-white/70">Déposer un fichier (PDF, JPG, PNG)</p>
                <label className="mt-3 inline-block cursor-pointer text-sm font-semibold text-[#3D7BFF]">
                  Sélectionner
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {file ? (
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/60">
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} Ko
                    </span>
                    <button type="button" onClick={() => setFile(null)} className="text-rose-300">
                      Supprimer
                    </button>
                  </div>
                ) : null}
              </div>
              {error ? <p className="text-sm text-amber-300">{error}</p> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm text-white/50" onClick={() => setModalOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void submit()}
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Envoyer mon justificatif
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ApprenantAbsencesPage() {
  return (
    <Suspense fallback={null}>
      <AbsencesContent />
    </Suspense>
  );
}
