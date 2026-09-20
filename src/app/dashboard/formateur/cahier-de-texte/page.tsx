"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2, NotebookPen, X } from "lucide-react";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  APPRENANT_CARD_MUTED,
  APPRENANT_CARD_TITLE,
} from "@/lib/apprenant/connect-nav";
import { cn } from "@/lib/utils";

type Session = {
  id: string;
  starts_at: string;
  ends_at: string;
  duration_hours?: number;
  lesson_content?: string | null;
  lesson_objectives?: string[] | null;
  lesson_homework?: string | null;
  lesson_resources?: unknown;
  lesson_completed_at?: string | null;
  module?: { name?: string; curriculum_module_id?: string } | null;
  class?: { name?: string } | null;
  module_objectives?: string[];
  title?: string | null;
};

function formatSession(s: Session) {
  const a = new Date(s.starts_at);
  const b = new Date(s.ends_at);
  return {
    day: a.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    time: `${a.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} — ${b.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
  };
}

function CahierInner() {
  const searchParams = useSearchParams();
  const focusSlot = searchParams.get("slot");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState({
    lesson_content: "",
    lesson_objectives: [] as string[],
    lesson_homework: "",
    lesson_resources: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/dashboard/formateur/cahier-de-texte", { credentials: "include" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    const list: Session[] = json.sessions ?? [];
    setSessions(list);
    if (focusSlot) {
      const found = list.find((s) => s.id === focusSlot);
      if (found) openEditor(found);
    }
  }, [focusSlot]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (s: Session) => {
    setEditing(s);
    setForm({
      lesson_content: s.lesson_content ?? "",
      lesson_objectives: Array.isArray(s.lesson_objectives) ? s.lesson_objectives : [],
      lesson_homework: s.lesson_homework ?? "",
      lesson_resources: Array.isArray(s.lesson_resources)
        ? (s.lesson_resources as Array<{ url?: string; label?: string }>)
            .map((r) => r.url || r.label || "")
            .filter(Boolean)
            .join("\n")
        : "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    setError(null);
    const resources = form.lesson_resources
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ type: "link", url: line, label: line }));

    const res = await fetch("/api/dashboard/formateur/cahier-de-texte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        slot_id: editing.id,
        lesson_content: form.lesson_content,
        lesson_objectives: form.lesson_objectives,
        lesson_homework: form.lesson_homework || null,
        lesson_resources: resources,
        complete: true,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Enregistrement impossible");
      return;
    }
    setEditing(null);
    await load();
  };

  const pending = useMemo(() => sessions.filter((s) => !s.lesson_completed_at), [sessions]);
  const done = useMemo(() => sessions.filter((s) => s.lesson_completed_at), [sessions]);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <p className={APPRENANT_CARD_KICKER}>Pédagogie</p>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white">Cahier de texte</h1>
        <p className="text-[14px] text-white/40">
          Séances issues du planning — complétez le contenu pour valider les heures réalisées.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/35">
          À compléter ({pending.length})
        </h2>
        {loading ? <p className={APPRENANT_CARD_MUTED}>Chargement…</p> : null}
        {!loading && pending.length === 0 ? (
          <p className={APPRENANT_CARD_MUTED}>Toutes vos séances récentes sont à jour.</p>
        ) : null}
        {pending.map((s) => {
          const meta = formatSession(s);
          return (
            <div key={s.id} className={cn(APPRENANT_CARD_BODY, "sm:flex-row sm:items-center sm:justify-between")}>
              <div className="min-w-0 space-y-1">
                <p className="text-[12px] capitalize text-white/40">{meta.day}</p>
                <p className={APPRENANT_CARD_TITLE}>{meta.time}</p>
                <p className="text-[14px] text-white/80">
                  {s.module?.name ?? s.title ?? "Séance"}
                  {s.class?.name ? ` · ${s.class.name}` : ""}
                </p>
                <p className={APPRENANT_CARD_MUTED}>{Number(s.duration_hours ?? 0)} h · Cahier à compléter</p>
              </div>
              <button
                type="button"
                onClick={() => openEditor(s)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-[13px] font-semibold text-white sm:mt-0"
              >
                <NotebookPen className="h-4 w-4" />
                Compléter
              </button>
            </div>
          );
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/35">
          Complétés ({done.length})
        </h2>
        {done.slice(0, 20).map((s) => {
          const meta = formatSession(s);
          return (
            <div key={s.id} className={cn(APPRENANT_CARD_BODY, "sm:flex-row sm:items-center sm:justify-between")}>
              <div className="min-w-0 space-y-1">
                <p className="text-[12px] capitalize text-white/40">{meta.day}</p>
                <p className="text-[14px] font-semibold text-white">{meta.time}</p>
                <p className="text-[13px] text-white/70">
                  {s.module?.name ?? "Séance"}
                  {s.class?.name ? ` · ${s.class.name}` : ""}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[12px] text-emerald-300/80">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Cahier de texte complété
                </p>
              </div>
              <button
                type="button"
                onClick={() => openEditor(s)}
                className="mt-3 rounded-xl border border-white/[0.08] px-4 py-2 text-[13px] font-semibold text-white/70 hover:bg-white/[0.04] sm:mt-0"
              >
                Consulter
              </button>
            </div>
          );
        })}
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#12121A] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white">Cahier de texte</h3>
                <p className="mt-1 text-sm text-white/45">
                  {editing.module?.name ?? "Séance"} · {editing.class?.name ?? ""}
                </p>
                <p className="mt-0.5 text-xs text-white/35">
                  {formatSession(editing).day} · {formatSession(editing).time} ·{" "}
                  {Number(editing.duration_hours ?? 0)} h
                </p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="text-white/40 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Contenu de la séance
                </span>
                <textarea
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
                  rows={5}
                  placeholder="Décrivez les notions abordées, les activités réalisées et l'avancement du groupe…"
                  value={form.lesson_content}
                  onChange={(e) => setForm({ ...form, lesson_content: e.target.value })}
                />
              </label>

              {(editing.module_objectives?.length || 0) > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                    Objectifs travaillés
                  </p>
                  {editing.module_objectives!.map((obj) => {
                    const checked = form.lesson_objectives.includes(obj);
                    return (
                      <label key={obj} className="flex items-start gap-2 text-sm text-white/70">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={checked}
                          onChange={() => {
                            setForm((f) => ({
                              ...f,
                              lesson_objectives: checked
                                ? f.lesson_objectives.filter((x) => x !== obj)
                                : [...f.lesson_objectives, obj],
                            }));
                          }}
                        />
                        <span>{obj}</span>
                      </label>
                    );
                  })}
                </div>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Travail à faire
                </span>
                <textarea
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  rows={2}
                  value={form.lesson_homework}
                  onChange={(e) => setForm({ ...form, lesson_homework: e.target.value })}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
                  Ressources (une URL par ligne)
                </span>
                <textarea
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25"
                  rows={2}
                  value={form.lesson_resources}
                  onChange={(e) => setForm({ ...form, lesson_resources: e.target.value })}
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm text-white/50"
                onClick={() => setEditing(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving || !form.lesson_content.trim()}
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                onClick={() => void save()}
              >
                {saving ? "Enregistrement…" : "Enregistrer le cahier de texte"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-[12px] text-white/30">
        Astuce : l’émargement et le cahier partagent le même créneau planning.{" "}
        <Link href="/dashboard/formateur/emargement" className="text-[#3D7BFF] hover:underline">
          Ouvrir l’émargement
        </Link>
      </p>
    </div>
  );
}

export default function FormateurCahierPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/40">Chargement…</p>}>
      <CahierInner />
    </Suspense>
  );
}
