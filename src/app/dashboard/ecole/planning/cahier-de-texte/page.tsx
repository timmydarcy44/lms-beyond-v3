"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function EcoleCahierDeTextePage() {
  const [sessions, setSessions] = useState<
    Array<{
      id: string;
      starts_at: string;
      ends_at: string;
      duration_hours?: number;
      lesson_content?: string | null;
      lesson_completed_at?: string | null;
      module?: { name?: string } | null;
      class?: { name?: string } | null;
      instructor?: { first_name?: string; last_name?: string; email?: string } | null;
    }>
  >([]);
  const [status, setStatus] = useState<"all" | "pending" | "completed">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    const res = await fetch(`/api/dashboard/ecole/cahier-de-texte?${qs}`, { credentials: "include" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setSessions(json.sessions ?? []);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Planning</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Cahier de texte</h1>
          <p className="mt-2 text-sm text-slate-500">
            Contenus de séance saisis par les formateurs — alimentent les heures réalisées.
          </p>
        </div>
        <Link href="/dashboard/ecole/planning" className="text-sm font-semibold text-[#3D7BFF]">
          ← Planning
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["pending", "À compléter"],
            ["completed", "Complétés"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setStatus(id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === id ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</div> : null}

      <div className="space-y-3">
        {loading ? <p className="text-sm text-slate-400">Chargement…</p> : null}
        {sessions.map((s) => {
          const a = new Date(s.starts_at);
          const instructorName =
            `${String(s.instructor?.first_name ?? "").trim()} ${String(s.instructor?.last_name ?? "").trim()}`.trim() ||
            s.instructor?.email ||
            "Formateur";
          return (
            <article
              key={s.id}
              className="rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs capitalize text-slate-400">
                    {a.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {s.module?.name ?? "Séance"}
                    {s.class?.name ? ` · ${s.class.name}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {instructorName} · {Number(s.duration_hours ?? 0)} h
                  </p>
                </div>
                {s.lesson_completed_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complété
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    À compléter
                  </span>
                )}
              </div>
              {s.lesson_content ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">{s.lesson_content}</p>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Aucun contenu saisi.</p>
              )}
            </article>
          );
        })}
        {!loading && sessions.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-6 py-10 text-center text-sm text-slate-400 ring-1 ring-dashed ring-slate-200">
            Aucune séance pour ce filtre.
          </p>
        ) : null}
      </div>
    </div>
  );
}
