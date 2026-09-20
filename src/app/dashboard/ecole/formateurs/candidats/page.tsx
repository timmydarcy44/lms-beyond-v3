"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";

import {
  CANDIDATE_STATUS_LABELS,
  type CandidateStatus,
} from "@/lib/ecole/instructors";

type Candidate = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  expertise?: string[] | null;
  availability?: string | null;
  experience?: string | null;
  cv_url?: string | null;
  status: string;
  internal_notes?: string | null;
  applied_at?: string;
  converted_instructor_id?: string | null;
};

export default function CandidatsFormateursPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    expertise: "",
    availability: "",
    experience: "",
    cv_url: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/dashboard/ecole/formateurs/candidats", { credentials: "include" });
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setCandidates(json.candidates ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    const res = await fetch("/api/dashboard/ecole/formateurs/candidats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setAddOpen(false);
    await load();
  };

  const updateStatus = async (id: string, status: CandidateStatus) => {
    await fetch(`/api/dashboard/ecole/formateurs/candidats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    await load();
    if (selected?.id === id) {
      const res = await fetch(`/api/dashboard/ecole/formateurs/candidats/${id}`, { credentials: "include" });
      const json = await res.json();
      setSelected(json.candidate ?? null);
    }
  };

  const convert = async (id: string) => {
    const res = await fetch(`/api/dashboard/ecole/formateurs/candidats/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "convert_to_instructor" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Conversion impossible");
      return;
    }
    await load();
    if (json.instructor_id) {
      window.location.href = `/dashboard/ecole/formateurs/${json.instructor_id}`;
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formateurs</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Candidats formateurs</h1>
          <p className="mt-2 text-sm text-slate-500">
            Candidatures distinctes des formateurs actifs — conversion en un clic sans ressaisie.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter une candidature
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Expertise</th>
              <th className="px-4 py-3">Candidature</th>
              <th className="px-4 py-3">Disponibilité</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-b border-slate-50 hover:bg-slate-50/70"
                onClick={() => setSelected(c)}
              >
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {c.first_name} {c.last_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{(c.expertise ?? []).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {c.applied_at
                    ? new Date(c.applied_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.availability || "—"}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {CANDIDATE_STATUS_LABELS[c.status as CandidateStatus] ?? c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && candidates.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">Aucune candidature.</p>
        ) : null}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {selected.first_name} {selected.last_name}
                </h2>
                <p className="text-sm text-slate-500">{selected.email || "Sans email"}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <span className="text-xs font-semibold uppercase text-slate-400">Expertise</span>
                <br />
                {(selected.expertise ?? []).join(", ") || "—"}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase text-slate-400">Expérience</span>
                <br />
                {selected.experience || "—"}
              </p>
              <p>
                <span className="text-xs font-semibold uppercase text-slate-400">Disponibilité</span>
                <br />
                {selected.availability || "—"}
              </p>
              {selected.cv_url ? (
                <p>
                  <a href={selected.cv_url} target="_blank" rel="noreferrer" className="font-semibold text-[#3D7BFF]">
                    Voir le CV / documents
                  </a>
                </p>
              ) : (
                <p className="text-slate-400">Aucun document reçu</p>
              )}
              <p>
                <span className="text-xs font-semibold uppercase text-slate-400">Notes internes</span>
                <br />
                {selected.internal_notes || "—"}
              </p>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-400">Statut</span>
                <select
                  className="w-full rounded-xl border px-3 py-2"
                  value={selected.status}
                  onChange={(e) => void updateStatus(selected.id, e.target.value as CandidateStatus)}
                >
                  {Object.entries(CANDIDATE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {selected.converted_instructor_id ? (
                <Link
                  href={`/dashboard/ecole/formateurs/${selected.converted_instructor_id}`}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Voir la fiche formateur
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void convert(selected.id)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Ajouter aux formateurs
                </button>
              )}
              {!selected.converted_instructor_id ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch(`/api/dashboard/ecole/formateurs/candidats/${selected.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ action: "retain_and_invite" }),
                    });
                    const json = await res.json();
                    if (!res.ok) {
                      setError(json.error || "Invitation impossible");
                      return;
                    }
                    await load();
                    if (json.instructor_id) {
                      window.location.href = `/dashboard/ecole/formateurs/${json.instructor_id}`;
                    }
                  }}
                  className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                >
                  Retenir et inviter
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Nouvelle candidature</h2>
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  placeholder="Prénom"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                />
                <input
                  className="rounded-xl border px-3 py-2 text-sm"
                  placeholder="Nom"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Expertise"
                value={form.expertise}
                onChange={(e) => setForm({ ...form, expertise: e.target.value })}
              />
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Disponibilité"
                value={form.availability}
                onChange={(e) => setForm({ ...form, availability: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="Expérience"
                rows={3}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                placeholder="URL CV"
                value={form.cv_url}
                onChange={(e) => setForm({ ...form, cv_url: e.target.value })}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm" onClick={() => setAddOpen(false)}>
                Annuler
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
                onClick={() => void create()}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
