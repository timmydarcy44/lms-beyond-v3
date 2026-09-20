"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, Plus, X } from "lucide-react";

type ModuleRow = {
  id: string;
  name: string;
  code?: string | null;
  learning_objectives?: string | null;
  planned_hours_total: number;
  hours_planned?: number;
  hours_delivered?: number;
  hours_remaining_to_schedule?: number;
  hours_remaining_to_deliver?: number;
  hours_remaining?: number;
};

export default function CursusDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [curriculum, setCurriculum] = useState<Record<string, unknown> | null>(null);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [moduleModal, setModuleModal] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    code: "",
    learning_objectives: "",
    description: "",
    planned_hours_total: "",
  });

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard/ecole/cursus/${id}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Introuvable");
      return;
    }
    setCurriculum(json.curriculum);
    setModules(json.modules ?? []);
    setClasses(json.classes ?? []);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const addModule = async () => {
    setError(null);
    if (!draft.name.trim() || !draft.learning_objectives.trim() || !draft.planned_hours_total) {
      setError("Nom, objectifs et volume sont requis.");
      return;
    }
    const res = await fetch(`/api/dashboard/ecole/cursus/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        action: "add_module",
        name: draft.name,
        code: draft.code || null,
        description: draft.description || null,
        learning_objectives: draft.learning_objectives,
        planned_hours_total: Number(draft.planned_hours_total),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Ajout impossible");
      return;
    }
    setModuleModal(false);
    setDraft({ name: "", code: "", learning_objectives: "", description: "", planned_hours_total: "" });
    await load();
  };

  if (!curriculum && !error) {
    return <p className="px-6 py-10 text-sm text-slate-400">Chargement…</p>;
  }

  const totalPlanned = modules.reduce((a, m) => a + Number(m.planned_hours_total ?? 0), 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <Link href="/dashboard/ecole/formations/cursus" className="text-xs font-semibold text-[#3D7BFF]">
        ← Cursus
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{String(curriculum?.name ?? "")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {curriculum?.code ? `${String(curriculum.code)} · ` : ""}
            {totalPlanned || Number(curriculum?.total_hours ?? 0)} h totales (somme des modules)
          </p>
          {curriculum?.description ? (
            <p className="mt-2 text-sm text-slate-600">{String(curriculum.description)}</p>
          ) : null}
        </div>
        <Link
          href={`/dashboard/ecole/planning?cursus=${encodeURIComponent(id)}`}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <CalendarDays className="h-4 w-4" />
          Planifier
        </Link>
      </header>

      {error ? <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</div> : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Modules</h2>
          <button
            type="button"
            onClick={() => setModuleModal(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#3D7BFF] px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter un module
          </button>
        </div>

        {modules.map((m) => {
          const total = Number(m.planned_hours_total ?? 0);
          const scheduled = Number(m.hours_planned ?? 0);
          const delivered = Number(m.hours_delivered ?? 0);
          const toSchedule = Number(m.hours_remaining_to_schedule ?? total - scheduled);
          const toDeliver = Number(m.hours_remaining_to_deliver ?? total - delivered);
          const pct = total > 0 ? Math.min(100, Math.round((scheduled / total) * 100)) : 0;
          return (
            <div key={m.id} className="rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
              <div className="flex justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{m.name}</p>
                  {m.code ? <p className="text-xs text-slate-400">{m.code}</p> : null}
                </div>
                <span className="text-xs font-semibold text-slate-400">{pct} % planifié</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-5">
                <div>
                  <p className="text-slate-400">Prévu</p>
                  <p className="font-semibold text-slate-800">{total} h</p>
                </div>
                <div>
                  <p className="text-slate-400">Planifié</p>
                  <p className="font-semibold text-slate-800">{scheduled} h</p>
                </div>
                <div>
                  <p className="text-slate-400">Réalisé</p>
                  <p className="font-semibold text-slate-800">{delivered} h</p>
                </div>
                <div>
                  <p className="text-slate-400">À planifier</p>
                  <p className="font-semibold text-[#3D7BFF]">{toSchedule} h</p>
                </div>
                <div>
                  <p className="text-slate-400">À réaliser</p>
                  <p className="font-semibold text-slate-800">{toDeliver} h</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#3D7BFF]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Classes / promotions</h2>
        <ul className="mt-3 space-y-2">
          {classes.map((c) => (
            <li key={c.id} className="rounded-xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-black/[0.04]">
              {c.name}
            </li>
          ))}
          {classes.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune classe liée pour l’instant.</p>
          ) : null}
        </ul>
      </section>

      {moduleModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-slate-900">Ajouter un module</h3>
              <button type="button" onClick={() => setModuleModal(false)} className="text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Nom du module *"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Code"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm"
                rows={4}
                placeholder="Objectifs pédagogiques *"
                value={draft.learning_objectives}
                onChange={(e) => setDraft({ ...draft, learning_objectives: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm"
                rows={2}
                placeholder="Description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <input
                type="number"
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Volume horaire *"
                value={draft.planned_hours_total}
                onChange={(e) => setDraft({ ...draft, planned_hours_total: e.target.value })}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm" onClick={() => setModuleModal(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void addModule()}
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
