"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { ProfileAvatarUploader } from "@/components/apprenant/profile-avatar-uploader";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LockedField = "phone" | "city" | "birth_date";

function formatBirthDate(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR");
}

export function ProfilEdgeIdentitySection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLocked, setEditingLocked] = useState<Record<LockedField, boolean>>({
    phone: false,
    city: false,
    birth_date: false,
  });
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    birth_date: "",
    avatar_url: "",
  });
  const [initialLocked, setInitialLocked] = useState<Record<LockedField, boolean>>({
    phone: false,
    city: false,
    birth_date: false,
  });

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, telephone, city, birth_date, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      const phone = String(data.phone ?? data.telephone ?? "").trim();
      const city = String(data.city ?? "").trim();
      const birthDate = String(data.birth_date ?? "").trim();
      setForm({
        first_name: String(data.first_name ?? ""),
        last_name: String(data.last_name ?? ""),
        email: String(data.email ?? userData.user?.email ?? ""),
        phone,
        city,
        birth_date: birthDate,
        avatar_url: String(data.avatar_url ?? ""),
      });
      setInitialLocked({
        phone: phone.length > 0,
        city: city.length > 0,
        birth_date: birthDate.length > 0,
      });
    }
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        telephone: form.phone.trim(),
        city: form.city.trim(),
        birth_date: form.birth_date.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", uid);
    setSaving(false);
    finishSave();
  };

  const lockedFields = useMemo(
    () =>
      [
        { key: "phone" as const, label: "Téléphone", display: form.phone || "—" },
        { key: "city" as const, label: "Ville", display: form.city || "—" },
        { key: "birth_date" as const, label: "Date de naissance", display: formatBirthDate(form.birth_date) },
      ],
    [form.phone, form.city, form.birth_date],
  );

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <ProfilEdgeSectionShell
      title="Identité"
      description="Vos informations personnelles — les données déjà renseignées à l'inscription sont reprises automatiquement."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["first_name", "Prénom"],
            ["last_name", "Nom"],
            ["email", "Email"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="mb-1 block text-white/70">{label}</span>
            <input
              className={inputClass}
              value={form[key]}
              disabled={key === "email"}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}

        {lockedFields.map(({ key, label, display }) => {
          const isLocked = initialLocked[key] && !editingLocked[key];
          return (
            <div key={key} className="block text-sm sm:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-white/70">{label}</span>
                {initialLocked[key] ? (
                  <button
                    type="button"
                    onClick={() => setEditingLocked((s) => ({ ...s, [key]: !s[key] }))}
                    className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-1 px-2 py-1 text-xs`}
                  >
                    <Pencil className="h-3 w-3" />
                    {editingLocked[key] ? "Annuler" : "Modifier"}
                  </button>
                ) : null}
              </div>
              {isLocked ? (
                <p className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white/80">
                  {display}
                </p>
              ) : (
                <input
                  type={key === "birth_date" ? "date" : "text"}
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              )}
            </div>
          );
        })}

        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm text-white/70">Photo de profil</span>
          <ProfileAvatarUploader
            currentUrl={form.avatar_url || null}
            onUploaded={(url) => setForm((f) => ({ ...f, avatar_url: url }))}
          />
        </div>
      </div>

      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}

      <button type="button" onClick={() => void save()} disabled={saving} className={`${CONNECT_BTN_PRIMARY} mt-6`}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enregistrer
      </button>
    </ProfilEdgeSectionShell>
  );
}
