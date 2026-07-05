"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfilEdgeIdentitySection() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    avatar_url: "",
  });

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, telephone, city, avatar_url")
      .eq("id", uid)
      .maybeSingle();
    if (data) {
      setForm({
        first_name: String(data.first_name ?? ""),
        last_name: String(data.last_name ?? ""),
        email: String(data.email ?? userData.user?.email ?? ""),
        phone: String(data.phone ?? data.telephone ?? ""),
        city: String(data.city ?? ""),
        avatar_url: String(data.avatar_url ?? ""),
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
    if (!uid) return;
    await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        telephone: form.phone.trim(),
        city: form.city.trim(),
        avatar_url: form.avatar_url.trim() || null,
      })
      .eq("id", uid);
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <ProfilEdgeSectionShell
      title="Identité"
      description="Complétez vos informations personnelles pour renforcer votre Profil EDGE."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ["first_name", "Prénom"],
            ["last_name", "Nom"],
            ["email", "Email"],
            ["phone", "Téléphone"],
            ["city", "Ville"],
            ["avatar_url", "URL photo de profil"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-white/70">{label}</span>
            <input
              className={inputClass}
              value={form[key]}
              disabled={key === "email"}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      <button type="button" onClick={() => void save()} disabled={saving} className={`${CONNECT_BTN_PRIMARY} mt-6`}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enregistrer
      </button>
    </ProfilEdgeSectionShell>
  );
}
