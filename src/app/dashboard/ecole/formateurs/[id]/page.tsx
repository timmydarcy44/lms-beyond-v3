"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  INSTRUCTOR_STATUS_LABELS,
  instructorDisplayName,
  type SchoolInstructor,
} from "@/lib/ecole/instructors";

export default function FormateurDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const [instructor, setInstructor] = useState<SchoolInstructor | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard/ecole/formateurs/${id}`, { credentials: "include" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Introuvable");
      return;
    }
    const i = json.instructor as SchoolInstructor;
    setInstructor(i);
    setForm({
      first_name: i.first_name ?? "",
      last_name: i.last_name ?? "",
      email: i.email ?? "",
      phone: i.phone ?? "",
      photo_url: i.photo_url ?? "",
      address: i.address ?? "",
      job_title: i.job_title ?? "",
      company: i.company ?? "",
      bio: i.bio ?? "",
      linkedin_url: i.linkedin_url ?? "",
      pedagogical_experience: i.pedagogical_experience ?? "",
      expertise: (i.expertise ?? []).join(", "),
      teachable_subjects: (i.teachable_subjects ?? []).join(", "),
      levels: (i.levels ?? []).join(", "),
      availability:
        i.availability && typeof i.availability === "object" && "note" in i.availability
          ? String((i.availability as { note?: string }).note ?? "")
          : "",
      internal_notes: i.internal_notes ?? "",
      status: String(i.status ?? "active"),
    });
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/dashboard/ecole/formateurs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...form,
        availability: form.availability ? { note: form.availability } : {},
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Erreur");
      return;
    }
    setMessage("Profil enregistré");
    setInstructor(json.instructor);
  };

  const renewInvite = async () => {
    const res = await fetch("/api/dashboard/ecole/formateurs/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ instructor_id: id }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Renouvellement impossible");
      return;
    }
    setMessage(json.email_sent ? "Invitation renvoyée" : "Lien renouvelé (e-mail non envoyé)");
    await load();
  };

  if (!instructor && !error) {
    return <p className="px-6 py-10 text-sm text-slate-400">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <Link href="/dashboard/ecole/formateurs/liste" className="text-xs font-semibold text-[#3D7BFF]">
          ← Formateurs
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          {instructor ? instructorDisplayName(instructor) : "Formateur"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {instructor
            ? INSTRUCTOR_STATUS_LABELS[instructor.status as keyof typeof INSTRUCTOR_STATUS_LABELS] ??
              instructor.status
            : null}
          {instructor?.hours_assigned != null ? ` · ${instructor.hours_assigned} h affectées` : null}
        </p>
      </div>

      {error ? <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</div> : null}
      {message ? <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div> : null}

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Identité</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["first_name", "Prénom"],
              ["last_name", "Nom"],
              ["email", "Email"],
              ["phone", "Téléphone"],
              ["photo_url", "Photo (URL)"],
              ["address", "Adresse"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="mb-1 block text-xs text-slate-400">{label}</span>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Profil professionnel</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["job_title", "Métier"],
              ["company", "Entreprise"],
              ["linkedin_url", "LinkedIn"],
              ["expertise", "Domaines d’expertise"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="text-sm">
              <span className="mb-1 block text-xs text-slate-400">{label}</span>
              <input
                className="w-full rounded-xl border px-3 py-2"
                value={form[key] ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Biographie</span>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={form.bio ?? ""}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Enseignement</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Matières / modules enseignables</span>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.teachable_subjects ?? ""}
            onChange={(e) => setForm({ ...form, teachable_subjects: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Expériences pédagogiques</span>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={form.pedagogical_experience ?? ""}
            onChange={(e) => setForm({ ...form, pedagogical_experience: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Niveaux / programmes</span>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.levels ?? ""}
            onChange={(e) => setForm({ ...form, levels: e.target.value })}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Disponibilités & notes</h2>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Disponibilités</span>
          <input
            className="w-full rounded-xl border px-3 py-2"
            value={form.availability ?? ""}
            onChange={(e) => setForm({ ...form, availability: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Notes internes</span>
          <textarea
            className="w-full rounded-xl border px-3 py-2"
            rows={3}
            value={form.internal_notes ?? ""}
            onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-slate-400">Statut</span>
          <select
            className="w-full rounded-xl border px-3 py-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            {Object.entries(INSTRUCTOR_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-slate-400">
          Documents administratifs : architecture prête (ajout ultérieur sans migration destructive).
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        <button
          type="button"
          onClick={() => void renewInvite()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
        >
          Renouveler l’invitation
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/ecole/planning")}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
        >
          Voir le planning
        </button>
      </div>
    </div>
  );
}
