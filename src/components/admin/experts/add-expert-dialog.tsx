"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";

type BadgeOption = { id: string; name: string };

const fieldClass =
  "mt-1 h-10 w-full rounded-lg border border-white/15 bg-[#071225] px-3 text-sm text-[#f8fbff] outline-none focus:border-[#635BFF]";

export function AddExpertDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [badges, setBadges] = useState<BadgeOption[]>([]);
  const [photoName, setPhotoName] = useState("");

  useEffect(() => {
    if (!open || badges.length > 0) return;
    void fetch("/api/super-admin/experts/catalog")
      .then((response) => response.json())
      .then((result) => setBadges(result.badges ?? []))
      .catch(() => setBadges([]));
  }, [open, badges.length]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/super-admin/experts", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Création impossible");
      setOpen(false);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setPhotoName("");
          setOpen(true);
        }}
        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#635BFF] px-4 text-sm font-semibold text-white hover:bg-[#554ee6]"
      >
        <Plus className="h-4 w-4" />
        Formateur
      </button>
      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-[#050d1d]/75 p-4 sm:items-center">
          <form onSubmit={(event) => void submit(event)} className="super-nav-dropdown my-8 w-full max-w-2xl rounded-2xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Formateurs</p>
                <h2 className="mt-1 text-xl font-bold text-[#f8fbff]">Ajouter un formateur</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-[#d5e0f2] hover:bg-white/10" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Prénom
                <input name="firstName" required className={fieldClass} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2]">
                Nom
                <input name="lastName" required className={fieldClass} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2] sm:col-span-2">
                Adresse mail
                <input name="email" type="email" required className={fieldClass} />
              </label>
              <label className="block text-xs font-semibold text-[#d5e0f2] sm:col-span-2">
                Photo
                <input
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
                  className="mt-1 block w-full text-sm text-[#d5e0f2] file:mr-3 file:rounded-full file:border-0 file:bg-[#635BFF] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {photoName ? <span className="mt-1 block text-[11px] text-indigo-200">{photoName}</span> : null}
              </label>
            </div>
            <fieldset className="mt-5">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[#9eb0cc]">Cursus</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {CFA_SPECIALIZATIONS.map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm text-[#f8fbff]">
                    <input type="checkbox" name="cursus" value={item.value} className="h-4 w-4 accent-[#635BFF]" />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-5">
              <legend className="text-xs font-semibold uppercase tracking-wide text-[#9eb0cc]">Open badges</legend>
              <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
                {badges.length === 0 ? <p className="text-sm text-[#9eb0cc]">Aucun open badge disponible.</p> : null}
                {badges.map((badge) => (
                  <label key={badge.id} className="flex items-center gap-2 text-sm text-[#f8fbff]">
                    <input type="checkbox" name="badges" value={badge.id} className="h-4 w-4 accent-[#635BFF]" />
                    <span>{badge.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-lg px-4 text-sm font-semibold text-[#d5e0f2] hover:bg-white/10">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="h-10 rounded-lg bg-[#635BFF] px-4 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Création…" : "Créer le formateur"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
