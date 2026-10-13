"use client";

import { useCallback, useEffect, useState } from "react";

type ModuleRow = { id: string; name: string; onlineCourseId: string | null; courseTitle: string | null };
type LearnerRow = { id: string; name: string; email: string };
type Cursus = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  modules: ModuleRow[];
  learners: LearnerRow[];
};
type CourseOption = { id: string; title: string };
type PathOption = { id: string; title: string; courseCount: number };
type Candidate = { id: string; name: string; email: string; status: string };

export function CfaCursusBoard() {
  const [curricula, setCurricula] = useState<Cursus[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [paths, setPaths] = useState<PathOption[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [courseId, setCourseId] = useState("");
  const [pathId, setPathId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/super/cfa/cursus", { cache: "no-store" });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) {
      setError(payload.error || "Chargement impossible");
      return;
    }
    setError("");
    setCurricula(payload.curricula ?? []);
    setCourses(payload.courses ?? []);
    setPaths(payload.paths ?? []);
    setCandidates(payload.candidates ?? []);
    setSelectedId((current) => current ?? payload.curricula?.[0]?.id ?? null);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selected = curricula.find((item) => item.id === selectedId) ?? null;

  const post = async (body: Record<string, unknown>) => {
    setError("");
    setNotice("");
    const response = await fetch("/api/super/cfa/cursus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || "Action impossible");
      return;
    }
    if (typeof payload.added === "number") {
      setNotice(
        payload.added > 0
          ? `${payload.added} formation(s) de « ${payload.pathTitle || "parcours"} » ajoutée(s) au cursus.`
          : `Les formations de « ${payload.pathTitle || "parcours"} » sont déjà dans ce cursus.`,
      );
    }
    await load();
  };

  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">CRM CFA</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Cursus</h1>
            <p className="mt-2 text-sm text-slate-500">
              Même logique que l’école : un cursus regroupe des formations, puis vous y associez un apprenant.
            </p>
          </div>
          <form
            className="space-y-2 rounded-2xl bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void post({ action: "create", name, code });
              setName("");
              setCode("");
            }}
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nom du cursus"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Code (NTC, MEM…)"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Créer le cursus
            </button>
          </form>
          <div className="space-y-2">
            {curricula.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-2xl px-4 py-3 text-left ${
                  item.id === selectedId ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                }`}
              >
                <span className="block font-semibold">{item.name}</span>
                <span className={`mt-1 block text-xs ${item.id === selectedId ? "text-white/60" : "text-slate-400"}`}>
                  {item.modules.length} formation(s) · {item.learners.length} apprenant(s)
                </span>
              </button>
            ))}
            {!loading && curricula.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-400">Aucun cursus.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6">
          {selected ? (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selected.name}</h2>
                {selected.code ? <p className="mt-1 text-sm text-slate-500">{selected.code}</p> : null}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Formations du cursus</h3>
                <ul className="mt-3 space-y-2">
                  {selected.modules.map((module) => (
                    <li key={module.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                      {module.courseTitle || module.name || "Formation"}
                    </li>
                  ))}
                  {selected.modules.length === 0 ? <li className="text-sm text-slate-400">Aucune formation rattachée.</li> : null}
                </ul>
                <div className="mt-3 flex gap-2">
                  <select
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">Choisir une formation LMS</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!courseId}
                    onClick={() => void post({ action: "attach_course", curriculumId: selected.id, courseId })}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <select
                    value={pathId}
                    onChange={(event) => setPathId(event.target.value)}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  >
                    <option value="">Choisir un parcours LMS</option>
                    {paths.map((path) => (
                      <option key={path.id} value={path.id}>
                        {path.title}
                        {path.courseCount ? ` · ${path.courseCount} formation(s)` : ""}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!pathId}
                    onClick={() => void post({ action: "attach_path", curriculumId: selected.id, pathId })}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Apprenants</h3>
                <ul className="mt-3 space-y-2">
                  {selected.learners.map((learner) => (
                    <li key={learner.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                      {learner.name}
                      <span className="ml-2 text-xs text-slate-400">{learner.email}</span>
                    </li>
                  ))}
                  {selected.learners.length === 0 ? <li className="text-sm text-slate-400">Aucun apprenant associé.</li> : null}
                </ul>
                <div className="mt-3 flex gap-2">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email d’un compte existant"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={!email.includes("@")}
                    onClick={() => void post({ action: "assign_learner", curriculumId: selected.id, email })}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                  >
                    Associer
                  </button>
                </div>
                <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => void post({ action: "assign_learner", curriculumId: selected.id, email: candidate.email })}
                      className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-900">{candidate.name}</span>
                      <span className="text-xs text-slate-400">{candidate.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">{loading ? "Chargement…" : "Créez un cursus pour y placer des formations et des apprenants."}</p>
          )}
          {notice ? <p className="mt-4 text-sm font-medium text-slate-900">{notice}</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}
