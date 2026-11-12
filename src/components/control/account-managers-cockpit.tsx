"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AccountManager } from "@/lib/control/account-managers";
import { EmptyState, fieldClass } from "@/components/control/chrome";

type FormState = {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photoUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  photoUrl: "",
  isActive: true,
};

export function AccountManagersCockpit() {
  const [managers, setManagers] = useState<AccountManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super/gestionnaires", { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok && !json.managers) {
        toast.error(json.error || "Impossible de charger les gestionnaires.");
        setManagers([]);
        return;
      }
      setSchemaMissing(Boolean(json.schemaMissing));
      setManagers(json.managers ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Prénom et nom requis.");
      return;
    }
    if (!form.email.includes("@")) {
      toast.error("E-mail invalide.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        photoUrl: form.photoUrl.trim() || null,
        isActive: form.isActive,
      };
      const response = await fetch(
        form.id ? `/api/super/gestionnaires/${form.id}` : "/api/super/gestionnaires",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(json.error || "Enregistrement impossible.");
        return;
      }
      if (form.id) toast.success("Gestionnaire mis à jour.");
      else if (json.emailSent) toast.success("Gestionnaire ajouté — e-mail de bienvenue envoyé.");
      else toast.success("Gestionnaire ajouté.");
      setOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce gestionnaire de compte ? Les comptes liés passeront en « non assigné ».")) {
      return;
    }
    const response = await fetch(`/api/super/gestionnaires/${id}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(json.error || "Suppression impossible.");
      return;
    }
    toast.success("Gestionnaire supprimé.");
    await load();
  }

  async function uploadPhoto(file: File | null) {
    if (!file || !form.id) {
      toast.error("Enregistrez d'abord le gestionnaire, puis ajoutez la photo.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch(`/api/super/gestionnaires/${form.id}/photo`, {
        method: "POST",
        body,
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(json.error || "Upload impossible.");
        return;
      }
      setForm((prev) => ({ ...prev, photoUrl: json.photoUrl || prev.photoUrl }));
      toast.success("Photo mise à jour.");
      await load();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[36px] font-extrabold tracking-[-1.2px]">Gestionnaires de compte</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8A93AE]">
            Ajoutez ou retirez les chargés de compte (nom, prénom, photo, e-mail, téléphone), puis
            assignez-les sur chaque fiche client.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setOpen(true);
          }}
          className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white"
        >
          Ajouter un gestionnaire
        </button>
      </header>

      {schemaMissing ? (
        <p className="mt-6 rounded-2xl border border-[#3A3118] bg-[#241C10] px-4 py-3 text-sm text-[#F2CF6B]">
          Migration `account_managers` à appliquer sur Supabase pour activer cet onglet.
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-[#8A93AE]">Chargement…</p>
      ) : managers.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="Aucun gestionnaire pour l'instant. Ajoutez Jérôme, Timmy, etc." />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {managers.map((manager) => (
            <li
              key={manager.id}
              className="flex gap-4 rounded-[28px] border border-[#1A2340] bg-[#111831] p-5"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#1A2340]">
                {manager.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={manager.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#C4B8FF]">
                    {manager.firstName[0]}
                    {manager.lastName[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-extrabold">{manager.fullName}</p>
                  {!manager.isActive ? (
                    <span className="rounded-full bg-[#3A1820] px-2 py-0.5 text-[11px] font-semibold text-[#FF8A9B]">
                      Inactif
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[#C9D2E8]">{manager.email}</p>
                {manager.phone ? <p className="text-sm text-[#8A93AE]">{manager.phone}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full border border-[#3A4668] bg-[#151C33] px-3 py-1.5 text-xs font-semibold text-[#E8ECF8]"
                    onClick={() => {
                      setForm({
                        id: manager.id,
                        firstName: manager.firstName,
                        lastName: manager.lastName,
                        email: manager.email,
                        phone: manager.phone ?? "",
                        photoUrl: manager.photoUrl ?? "",
                        isActive: manager.isActive,
                      });
                      setOpen(true);
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#5A2A35] bg-[#2A151C] px-3 py-1.5 text-xs font-semibold text-[#FF8A9B]"
                    onClick={() => void remove(manager.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-[#26304F] bg-[#0B1122] p-5 shadow-2xl">
            <h2 className="text-xl font-extrabold">
              {form.id ? "Modifier le gestionnaire" : "Nouveau gestionnaire"}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-[#8A93AE]">Prénom</span>
                <input
                  className={fieldClass}
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-[#8A93AE]">Nom</span>
                <input
                  className={fieldClass}
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-[#8A93AE]">E-mail</span>
                <input
                  type="email"
                  className={fieldClass}
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-[#8A93AE]">Téléphone</span>
                <input
                  className={fieldClass}
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+33…"
                />
              </label>
              <label className="text-sm sm:col-span-2">
                <span className="mb-1 block text-[#8A93AE]">Photo (URL)</span>
                <input
                  className={fieldClass}
                  value={form.photoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, photoUrl: e.target.value }))}
                  placeholder="https://…"
                />
              </label>
              {form.id ? (
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block text-[#8A93AE]">Ou importer une photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={uploading}
                    onChange={(e) => void uploadPhoto(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-[#C9D2E8]"
                  />
                </label>
              ) : (
                <p className="sm:col-span-2 text-xs text-[#8A93AE]">
                  Après création, rouvrez la fiche pour importer une photo fichier.
                </p>
              )}
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Actif (sélectionnable sur les comptes clients)
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-full border border-[#3A4668] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
                onClick={() => setOpen(false)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                className="rounded-full bg-[#6E5BFF] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                onClick={() => void save()}
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
