"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ABSENCE_STATUS_LABELS,
  type AbsenceStatus,
} from "@/lib/ecole/absences";
import { instructorDisplayName } from "@/lib/ecole/instructors";
import { cn } from "@/lib/utils";

type AbsenceRow = {
  id: string;
  status: string;
  duration_hours: number;
  motif?: string | null;
  admin_note?: string | null;
  proof_path?: string | null;
  proof_filename?: string | null;
  learner?: {
    first_name?: string;
    last_name?: string;
    full_name?: string;
    email?: string;
  } | null;
  slot?: {
    starts_at?: string;
    ends_at?: string;
    module?: { name?: string } | null;
    instructor?: { first_name?: string; last_name?: string } | null;
    class?: { name?: string } | null;
  } | null;
};

export default function EcoleAbsencesPage() {
  const [absences, setAbsences] = useState<AbsenceRow[]>([]);
  const [filter, setFilter] = useState("");
  const [note, setNote] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const res = await fetch(`/api/dashboard/ecole/planning/absences${qs}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setAbsences(json.absences ?? []);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (id: string, action: "accept" | "refuse") => {
    const res = await fetch("/api/dashboard/ecole/planning/absences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, action, admin_note: note[id] || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Action impossible");
      return;
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Planning</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Absences</h1>
        <p className="mt-2 text-sm text-slate-500">
          Justificatifs reçus, validation administrative et historique des statuts.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          ["", "Tous"],
          ["proof_sent", "Justificatif envoyé"],
          ["to_justify", "À justifier"],
          ["justified", "Justifiées"],
          ["refused", "Refusées"],
        ].map(([id, label]) => (
          <button
            key={id || "all"}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              filter === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="space-y-3">
        {absences.map((a) => {
          const learnerName =
            String(a.learner?.full_name ?? "").trim() ||
            `${a.learner?.first_name ?? ""} ${a.learner?.last_name ?? ""}`.trim() ||
            a.learner?.email ||
            "Apprenant";
          return (
            <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{learnerName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {a.slot?.starts_at
                      ? new Date(a.slot.starts_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "—"}
                    {" · "}
                    {a.slot?.module?.name ?? "Cours"}
                    {" · "}
                    {a.duration_hours} h
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {a.slot?.class?.name ?? "Classe"}
                    {" · "}
                    {a.slot?.instructor ? instructorDisplayName(a.slot.instructor) : "Formateur"}
                  </p>
                  {a.motif ? <p className="mt-2 text-sm text-slate-500">Motif : {a.motif}</p> : null}
                  {a.proof_filename ? (
                    <p className="mt-1 text-sm font-medium text-[#3D7BFF]">
                      Justificatif : {a.proof_filename}
                      {a.proof_path ? ` (${a.proof_path.split(":")[0]})` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">Aucun justificatif</p>
                  )}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    a.status === "justified" && "bg-emerald-50 text-emerald-700",
                    a.status === "to_justify" && "bg-amber-50 text-amber-700",
                    a.status === "proof_sent" && "bg-blue-50 text-blue-700",
                    a.status === "refused" && "bg-rose-50 text-rose-700",
                  )}
                >
                  {ABSENCE_STATUS_LABELS[a.status as AbsenceStatus] ?? a.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <input
                  className="min-w-[200px] flex-1 rounded-xl border px-3 py-2 text-sm"
                  placeholder="Note interne"
                  value={note[a.id] ?? a.admin_note ?? ""}
                  onChange={(e) => setNote({ ...note, [a.id]: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => void review(a.id, "accept")}
                  className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => void review(a.id, "refuse")}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                >
                  Refuser
                </button>
              </div>
            </article>
          );
        })}
        {absences.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Aucune absence pour ce filtre.
          </p>
        ) : null}
      </div>
    </div>
  );
}
