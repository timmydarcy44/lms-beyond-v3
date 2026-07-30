"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Loader2, Plus } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";

type JobRole = {
  id: string;
  title: string;
  description: string;
  hard_skills: string[];
  soft_skills: string[];
  created_at?: string | null;
};

type FormState = {
  title: string;
  description: string;
  hardSkills: string;
  softSkills: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  hardSkills: "",
  softSkills: "",
};

function splitSkills(value: string) {
  return Array.from(
    new Set(
      value
        .split(/,|\n/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function formatRelativeDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EntrepriseMetiersPage() {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const hardSkillPreview = useMemo(() => splitSkills(form.hardSkills), [form.hardSkills]);
  const softSkillPreview = useMemo(() => splitSkills(form.softSkills), [form.softSkills]);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/entreprise/metiers", { credentials: "include" });
      const payload = (await response.json()) as { roles?: JobRole[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Impossible de charger les métiers");
      }
      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les métiers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoles();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/dashboard/entreprise/metiers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          hard_skills: splitSkills(form.hardSkills),
          soft_skills: splitSkills(form.softSkills),
        }),
      });
      const payload = (await response.json()) as { role?: JobRole; error?: string };
      if (!response.ok || !payload.role) {
        throw new Error(payload.error || "Impossible d'ajouter ce métier");
      }
      setRoles((prev) => [payload.role!, ...prev]);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter ce métier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      <EnterpriseSidebar />
      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <header className="mb-8">
          <h1 className={ENTREPRISE_H1_CLASS}>Métiers</h1>
          <p className="mt-2 text-center text-sm text-gray-500">
            Définissez vos métiers et les compétences attendues pour chaque poste.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="space-y-4">
            {loading ? (
              <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Chargement des métiers...</p>
              </div>
            ) : roles.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-gray-200 bg-[#fafafa] p-8 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <BriefcaseBusiness className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">Aucun métier enregistré</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Ajoutez vos premiers métiers pour structurer vos offres et les compétences attendues.
                </p>
              </div>
            ) : (
              roles.map((role) => (
                <article
                  key={role.id}
                  className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{role.title}</h2>
                      {formatRelativeDate(role.created_at) ? (
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400">
                          Ajouté le {formatRelativeDate(role.created_at)}
                        </p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                      {role.hard_skills.length + role.soft_skills.length} compétences
                    </span>
                  </div>

                  {role.description ? (
                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-600">{role.description}</p>
                  ) : (
                    <p className="mt-4 text-sm text-gray-400">Aucune description renseignée.</p>
                  )}

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Hard skills
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.hard_skills.length > 0 ? (
                          role.hard_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">Aucune hard skill renseignée.</span>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-[#faf7ff] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">
                        Soft skills
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.soft_skills.length > 0 ? (
                          role.soft_skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-violet-300">Aucune soft skill renseignée.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside>
            <div className="sticky top-8 rounded-[28px] border border-gray-100 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Ajouter un métier</h2>
                  <p className="text-sm text-gray-500">Un rôle par fiche, avec ses compétences clés.</p>
                </div>
              </div>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700">Nom du métier</span>
                  <input
                    value={form.title}
                    onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Ex. Business Developer"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    placeholder="Résumé du poste, contexte, missions principales..."
                    className="min-h-[120px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700">Hard skills</span>
                  <textarea
                    value={form.hardSkills}
                    onChange={(event) => setForm((prev) => ({ ...prev, hardSkills: event.target.value }))}
                    placeholder="Ex. Excel avancé, SQL, gestion de projet"
                    className="min-h-[96px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                  {hardSkillPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hardSkillPreview.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-gray-700">Soft skills</span>
                  <textarea
                    value={form.softSkills}
                    onChange={(event) => setForm((prev) => ({ ...prev, softSkills: event.target.value }))}
                    placeholder="Ex. Communication, autonomie, leadership"
                    className="min-h-[96px] w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  />
                  {softSkillPreview.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {softSkillPreview.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </label>

                {error ? <p className="text-sm text-red-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Ajouter le métier
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
