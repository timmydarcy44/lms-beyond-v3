"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type CourseCard = {
  id: string;
  title: string;
  status: string;
  image: string | null;
  href: string;
  catalogHref: string | null;
};

type Cursus = { id: string; name: string; modules: { onlineCourseId: string | null }[] };
type Candidate = { id: string; name: string; email: string; status: string };

export function SuperLmsFormationsBoard({ courses }: { courses: CourseCard[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [cursus, setCursus] = useState<Cursus[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [active, setActive] = useState<CourseCard | null>(null);
  const [curriculumId, setCurriculumId] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/super/cfa/cursus", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        setCursus(Array.isArray(payload.curricula) ? payload.curricula : []);
        setCandidates(Array.isArray(payload.candidates) ? payload.candidates : []);
      })
      .catch(() => undefined);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (status === "published" && course.status !== "published") return false;
      if (status === "draft" && course.status === "published") return false;
      return !needle || course.title.toLowerCase().includes(needle);
    });
  }, [courses, query, status]);

  const attach = async () => {
    if (!active || !curriculumId) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/super/cfa/cursus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "attach_course", curriculumId, courseId: active.id }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? "Formation rattachée au cursus." : payload.error || "Rattachement impossible");
  };

  const assign = async (targetEmail: string) => {
    if (!active) return;
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/super/cfa/cursus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "assign_learner",
        email: targetEmail,
        courseId: active.id,
        curriculumId,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? `${payload.name || "Apprenant"} est assigné.` : payload.error || "Assignation impossible");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher une formation"
          className="h-11 min-w-[240px] flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm outline-none"
        />
        {(["all", "published", "draft"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
              status === value ? "bg-slate-900 text-white" : "bg-white text-slate-500"
            }`}
          >
            {value === "all" ? "Toutes" : value === "published" ? "Publiée" : "Brouillon"}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold">Aucune formation Byound</p>
          <p className="mt-2 text-sm text-slate-500">Créez la première avec le même éditeur que l’espace formateur.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {visible.map((course) => {
            const linked = cursus.filter((item) => item.modules.some((module) => module.onlineCourseId === course.id));
            return (
              <li key={course.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <Link href={course.href} className="block">
                  <div className="relative aspect-[16/9] bg-slate-900">
                    {course.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-end bg-gradient-to-br from-slate-800 to-slate-950 p-4 text-sm text-white/70">
                        Byound
                      </div>
                    )}
                    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                      {course.status === "published" ? "Publiée" : "Brouillon"}
                    </span>
                  </div>
                  <div className="px-5 pt-4">
                    <h2 className="text-lg font-semibold text-slate-900">{course.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">
                      {linked.length ? linked.map((item) => item.name).join(" · ") : "Aucun cursus"}
                    </p>
                  </div>
                </Link>
                <div className="flex flex-wrap gap-2 px-5 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      setActive(course);
                      setMessage("");
                      setCurriculumId(linked[0]?.id ?? cursus[0]?.id ?? "");
                    }}
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Assigner
                  </button>
                  {course.catalogHref ? (
                    <Link href={course.catalogHref} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      Voir la carte
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {active ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Assignation</p>
                <h3 className="mt-1 text-xl font-semibold">{active.title}</h3>
              </div>
              <button type="button" onClick={() => setActive(null)} className="text-sm text-slate-400">
                Fermer
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-500">
              Cursus
              <select
                value={curriculumId}
                onChange={(event) => setCurriculumId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Aucun cursus</option>
                {cursus.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={busy || !curriculumId}
              onClick={() => void attach()}
              className="mt-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold disabled:opacity-40"
            >
              Rattacher cette formation au cursus
            </button>
            <label className="mt-5 block text-xs font-semibold text-slate-500">
              Email de l’apprenant
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="prenom@ecole.fr"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={busy || !email.includes("@")}
              onClick={() => void assign(email)}
              className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              Assigner
            </button>
            <div className="mt-4 max-h-40 space-y-1 overflow-y-auto">
              {candidates.slice(0, 12).map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    setEmail(candidate.email);
                    void assign(candidate.email);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm hover:bg-slate-50"
                >
                  <span>{candidate.name}</span>
                  <span className="text-xs text-slate-400">{candidate.email}</span>
                </button>
              ))}
            </div>
            {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}
            <p className="mt-3 text-xs text-slate-400">
              Les cursus se créent dans CFA → Cursus. Un apprenant doit déjà avoir un compte.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
