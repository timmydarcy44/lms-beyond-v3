"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, UserPlus, X } from "lucide-react";

import {
  INSTRUCTOR_STATUS_LABELS,
  instructorDisplayName,
  type SchoolInstructor,
} from "@/lib/ecole/instructors";
import { cn } from "@/lib/utils";

type ModalMode = "add" | "invite" | null;

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  photo_url: "",
  address: "",
  expertise: "",
  teachable_subjects: "",
  availability: "",
  internal_notes: "",
};

function FormateursListeInner() {
  const searchParams = useSearchParams();
  const [instructors, setInstructors] = useState<SchoolInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/ecole/formateurs", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur");
      setInstructors(json.instructors ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "add") setModal("add");
    if (action === "invite") setModal("invite");
  }, [searchParams]);

  const sorted = useMemo(
    () =>
      [...instructors].sort((a, b) =>
        instructorDisplayName(a).localeCompare(instructorDisplayName(b), "fr"),
      ),
    [instructors],
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (modal === "invite") {
        const res = await fetch("/api/dashboard/ecole/formateurs/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            first_name: form.first_name,
            last_name: form.last_name,
            email: form.email,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Invitation échouée");
      } else {
        const res = await fetch("/api/dashboard/ecole/formateurs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            ...form,
            expertise: form.expertise,
            teachable_subjects: form.teachable_subjects,
            availability: form.availability ? { note: form.availability } : {},
            status: "active",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Création échouée");
      }
      setModal(null);
      setForm(emptyForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formateurs</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Formateurs</h1>
          <p className="mt-2 text-sm text-slate-500">
            Base des intervenants pédagogiques — immédiatement disponibles pour le planning lorsqu&apos;actifs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModal("add");
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Ajouter un formateur
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm);
              setModal("invite");
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
          >
            <UserPlus className="h-4 w-4" />
            Inviter un formateur
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Formateur</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Expertise</th>
              <th className="px-4 py-3 font-semibold">Modules</th>
              <th className="px-4 py-3 font-semibold">Volume</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => (
              <tr key={i.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/ecole/formateurs/${i.id}`} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        `${(i.first_name ?? "?")[0]}${(i.last_name ?? "?")[0]}`.toUpperCase()
                      )}
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">{instructorDisplayName(i)}</span>
                      {i.availability && typeof i.availability === "object" && "note" in i.availability ? (
                        <span className="block text-xs text-slate-400">
                          {String((i.availability as { note?: string }).note ?? "")}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <div>{i.email}</div>
                  <div className="text-xs text-slate-400">{i.phone || "—"}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {(i.expertise ?? []).slice(0, 3).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {(i.teachable_subjects ?? []).slice(0, 3).join(", ") || "—"}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{i.hours_assigned ?? 0} h</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      i.status === "active" && "bg-emerald-50 text-emerald-700",
                      i.status === "invited" && "bg-blue-50 text-blue-700",
                      i.status === "incomplete" && "bg-amber-50 text-amber-700",
                      i.status === "inactive" && "bg-slate-100 text-slate-500",
                    )}
                  >
                    {INSTRUCTOR_STATUS_LABELS[i.status as keyof typeof INSTRUCTOR_STATUS_LABELS] ??
                      i.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && sorted.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-400">Aucun formateur pour le moment.</p>
        ) : null}
        {loading ? <p className="px-4 py-6 text-sm text-slate-400">Chargement…</p> : null}
      </div>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {modal === "invite" ? "Inviter un formateur" : "Ajouter un formateur"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {modal === "invite"
                    ? "Un e-mail avec lien sécurisé sera envoyé pour compléter le profil."
                    : "La fiche sera immédiatement disponible dans le planning."}
                </p>
              </div>
              <button type="button" onClick={() => setModal(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
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
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {modal === "add" ? (
                <>
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Téléphone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="URL photo"
                    value={form.photo_url}
                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Adresse"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Domaines d’expertise (séparés par virgule)"
                    value={form.expertise}
                    onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Cours / modules enseignables"
                    value={form.teachable_subjects}
                    onChange={(e) => setForm({ ...form, teachable_subjects: e.target.value })}
                  />
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Disponibilités"
                    value={form.availability}
                    onChange={(e) => setForm({ ...form, availability: e.target.value })}
                  />
                  <textarea
                    className="w-full rounded-xl border px-3 py-2 text-sm"
                    placeholder="Notes internes"
                    rows={3}
                    value={form.internal_notes}
                    onChange={(e) => setForm({ ...form, internal_notes: e.target.value })}
                  />
                </>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="rounded-xl px-3 py-2 text-sm text-slate-600" onClick={() => setModal(null)}>
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void submit()}
              >
                {saving ? "…" : modal === "invite" ? "Envoyer l’invitation" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FormateursListePage() {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-slate-400">Chargement…</p>}>
      <FormateursListeInner />
    </Suspense>
  );
}
