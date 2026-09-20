"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Plus, X } from "lucide-react";

type ModuleDraft = {
  name: string;
  code: string;
  learning_objectives: string;
  description: string;
  planned_hours_total: string;
};

const emptyModule = (): ModuleDraft => ({
  name: "",
  code: "",
  learning_objectives: "",
  description: "",
  planned_hours_total: "",
});

function CursusInner() {
  const searchParams = useSearchParams();
  const [curricula, setCurricula] = useState<
    Array<{
      id: string;
      name: string;
      code?: string | null;
      total_hours?: number;
      hours_planned?: number;
      hours_remaining?: number;
      modules_count?: number;
      school_years?: { label?: string } | null;
    }>
  >([]);
  const [modal, setModal] = useState(false);
  const [moduleModal, setModuleModal] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [draftModule, setDraftModule] = useState<ModuleDraft>(emptyModule());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const totalHours = useMemo(
    () => modules.reduce((a, m) => a + Number(m.planned_hours_total || 0), 0),
    [modules],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/ecole/cursus", { credentials: "include" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setCurricula(json.curricula ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("action") === "create") setModal(true);
  }, [searchParams]);

  const addDraftModule = () => {
    if (!draftModule.name.trim() || !draftModule.learning_objectives.trim() || !draftModule.planned_hours_total) {
      setError("Nom, objectifs et volume horaire sont requis pour un module.");
      return;
    }
    setModules((prev) => [...prev, draftModule]);
    setDraftModule(emptyModule());
    setModuleModal(false);
    setError(null);
  };

  const create = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Le nom du cursus est requis.");
      return;
    }
    const res = await fetch("/api/dashboard/ecole/cursus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: form.name,
        code: form.code || null,
        description: form.description || null,
        modules: modules.map((m, idx) => ({
          name: m.name,
          code: m.code || null,
          description: m.description || null,
          learning_objectives: m.learning_objectives || null,
          planned_hours_total: Number(m.planned_hours_total || 0),
          sort_order: idx,
        })),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Création impossible");
      return;
    }
    setModal(false);
    setForm({ name: "", code: "", description: "" });
    setModules([]);
    await load();
    if (json.curriculum?.id) {
      window.location.href = `/dashboard/ecole/formations/cursus/${json.curriculum.id}`;
    }
  };

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Cursus</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">
            Modules, volumes et planification — une seule chaîne pédagogique.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(61,123,255,0.55)]"
        >
          <Plus className="h-4 w-4" />
          Créer un cursus
        </button>
      </header>

      {error && !modal ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="space-y-3">
        {curricula.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-4 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] sm:flex-row sm:items-center sm:justify-between"
          >
            <Link href={`/dashboard/ecole/formations/cursus/${c.id}`} className="min-w-0 flex-1">
              <p className="text-lg font-bold text-slate-900">{c.name}</p>
              <p className="mt-1 text-xs text-slate-400">
                {c.code ? `${c.code} · ` : ""}
                {c.school_years?.label ?? "Année scolaire"}
                {" · "}
                {c.modules_count ?? 0} module(s)
              </p>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{c.hours_planned ?? 0} h</span> planifiées
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-500">{c.hours_remaining ?? c.total_hours ?? 0} h restantes</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-400">{c.total_hours ?? 0} h totales</span>
              </p>
            </Link>
            <Link
              href={`/dashboard/ecole/planning?cursus=${encodeURIComponent(c.id)}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/08 px-4 py-2.5 text-sm font-semibold text-[#3D7BFF] transition hover:bg-[#3D7BFF]/12"
            >
              <CalendarDays className="h-4 w-4" />
              Planifier
            </Link>
          </div>
        ))}
        {!loading && curricula.length === 0 ? (
          <p className="rounded-2xl bg-white/70 px-6 py-12 text-center text-sm text-slate-400 ring-1 ring-dashed ring-slate-200">
            Aucun cursus. Créez NTC 2027-2028 pour démarrer.
          </p>
        ) : null}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-slate-900">Créer un cursus</h2>
              <button type="button" onClick={() => setModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D7BFF]"
                placeholder="Nom (ex. Négociateur Technico-Commercial)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D7BFF]"
                placeholder="Code (ex. NTC)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#3D7BFF]"
                placeholder="Description"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Modules</h3>
                <button
                  type="button"
                  onClick={() => setModuleModal(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-[#3D7BFF] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter un module
                </button>
              </div>
              <div className="mt-3 space-y-2">
                {modules.map((m, idx) => (
                  <div key={`${m.name}-${idx}`} className="rounded-xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{m.name}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{m.planned_hours_total} h</p>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-slate-400 hover:text-red-500"
                        onClick={() => setModules((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
                {modules.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucun module. Ajoutez Prospection, Négociation…</p>
                ) : null}
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-700">
                Volume total du cursus :{" "}
                <span className="text-[#3D7BFF]">{totalHours} h</span>
                <span className="ml-1 text-xs font-normal text-slate-400">(calculé automatiquement)</span>
              </p>
            </div>

            {error ? <p className="mt-3 text-sm text-amber-700">{error}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm text-slate-500" onClick={() => setModal(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void create()}
              >
                Créer le cursus
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {moduleModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un module</h3>
              <button type="button" onClick={() => setModuleModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-slate-500">
                Nom du module *
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={draftModule.name}
                  onChange={(e) => setDraftModule({ ...draftModule, name: e.target.value })}
                  placeholder="Prospection commerciale"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500">
                Code du module
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={draftModule.code}
                  onChange={(e) => setDraftModule({ ...draftModule, code: e.target.value })}
                  placeholder="PROSP"
                />
              </label>
              <label className="block text-xs font-medium text-slate-500">
                Objectifs pédagogiques *
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  rows={4}
                  value={draftModule.learning_objectives}
                  onChange={(e) => setDraftModule({ ...draftModule, learning_objectives: e.target.value })}
                  placeholder={"- Identifier et qualifier des prospects\n- Construire un plan de prospection"}
                />
              </label>
              <label className="block text-xs font-medium text-slate-500">
                Description
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  rows={2}
                  value={draftModule.description}
                  onChange={(e) => setDraftModule({ ...draftModule, description: e.target.value })}
                />
              </label>
              <label className="block text-xs font-medium text-slate-500">
                Volume horaire *
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  value={draftModule.planned_hours_total}
                  onChange={(e) => setDraftModule({ ...draftModule, planned_hours_total: e.target.value })}
                  placeholder="42"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm" onClick={() => setModuleModal(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                onClick={addDraftModule}
              >
                Ajouter le module
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CursusPage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-slate-400">Chargement…</p>}>
      <CursusInner />
    </Suspense>
  );
}
