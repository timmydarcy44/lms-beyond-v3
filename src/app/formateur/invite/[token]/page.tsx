"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function FormateurInvitePage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    photo_url: "",
    job_title: "",
    company: "",
    expertise: "",
    teachable_subjects: "",
    bio: "",
    linkedin_url: "",
    pedagogical_experience: "",
    levels: "",
    availability: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/formateur/invite/${token}`);
    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(
        json.error === "EXPIRED"
          ? "Ce lien a expiré. Demandez un renouvellement à l’école."
          : json.error === "ALREADY_ACCEPTED"
            ? "Ce profil a déjà été complété."
            : "Lien invalide.",
      );
      return;
    }
    const i = json.instructor ?? {};
    setForm({
      first_name: i.first_name ?? "",
      last_name: i.last_name ?? "",
      phone: i.phone ?? "",
      photo_url: i.photo_url ?? "",
      job_title: i.job_title ?? "",
      company: i.company ?? "",
      expertise: Array.isArray(i.expertise) ? i.expertise.join(", ") : "",
      teachable_subjects: Array.isArray(i.teachable_subjects) ? i.teachable_subjects.join(", ") : "",
      bio: i.bio ?? "",
      linkedin_url: i.linkedin_url ?? "",
      pedagogical_experience: i.pedagogical_experience ?? "",
      levels: Array.isArray(i.levels) ? i.levels.join(", ") : "",
      availability:
        i.availability && typeof i.availability === "object" && i.availability.note
          ? String(i.availability.note)
          : "",
    });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setError(null);
    const res = await fetch(`/api/formateur/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        availability: form.availability ? { note: form.availability } : {},
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Enregistrement impossible");
      return;
    }
    setDone(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] text-white/50">
        Chargement…
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-4 text-center text-white">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">EDGE</p>
          <h1 className="mt-3 text-3xl font-bold">Profil complété</h1>
          <p className="mt-3 text-white/50">Merci. L’école pourra désormais vous affecter aux cours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060a] px-4 py-12 text-white">
      <div className="mx-auto max-w-xl">
        <p className="text-center text-sm font-semibold tracking-wide text-white/50">
          <span className="font-extrabold text-white">EDGE</span> Formateurs
        </p>
        <h1 className="mt-3 text-center text-3xl font-bold">Compléter mon profil</h1>
        <p className="mt-2 text-center text-sm text-white/40">
          Identité, expertise, enseignement et disponibilités.
        </p>

        {error ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        ) : null}

        {!error || form.first_name ? (
          <div className="mt-8 space-y-6">
            {(
              [
                ["Identité", ["first_name", "last_name", "phone", "photo_url"]],
                ["Profil professionnel", ["job_title", "company", "expertise", "linkedin_url", "bio"]],
                ["Enseignement", ["teachable_subjects", "pedagogical_experience", "levels"]],
                ["Disponibilités", ["availability"]],
              ] as const
            ).map(([title, keys]) => (
              <section key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h2 className="text-xs font-bold uppercase tracking-wide text-white/35">{title}</h2>
                <div className="mt-3 space-y-3">
                  {keys.map((key) =>
                    key === "bio" || key === "pedagogical_experience" ? (
                      <textarea
                        key={key}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        rows={3}
                        placeholder={key}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    ) : (
                      <input
                        key={key}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        placeholder={key.replace(/_/g, " ")}
                        value={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      />
                    ),
                  )}
                </div>
              </section>
            ))}
            <button
              type="button"
              onClick={() => void submit()}
              className="w-full rounded-xl bg-[#3D7BFF] py-3 text-sm font-semibold text-white"
            >
              Enregistrer mon profil
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
