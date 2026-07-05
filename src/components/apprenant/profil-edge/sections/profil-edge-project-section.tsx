"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { parseProfessionalProject, type ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const FIELDS: Array<{ key: keyof ProfessionalProject; label: string; placeholder: string }> = [
  { key: "objectif", label: "Objectif", placeholder: "Ex. Trouver un poste commercial en CDI" },
  { key: "metier_vise", label: "Métier visé", placeholder: "Ex. Commercial immobilier" },
  { key: "secteur", label: "Secteur d'activité", placeholder: "Ex. Immobilier, santé, tech…" },
  { key: "mobilite", label: "Mobilité", placeholder: "Ex. Locale, régionale, nationale" },
  { key: "disponibilite", label: "Disponibilité", placeholder: "Ex. Immédiate, sous 1 mois" },
];

export function ProfilEdgeProjectSection() {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfessionalProject>({});

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("profiles").select("professional_project").eq("id", uid).maybeSingle();
    setForm(parseProfessionalProject(data?.professional_project));
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    await supabase.from("profiles").update({ professional_project: form }).eq("id", uid);
    setSaving(false);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <ProfilEdgeSectionShell
      title="Projet professionnel"
      description="Définissez votre cap : objectif, métier visé et contraintes de mobilité."
    >
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="mb-1 block text-white/70">{field.label}</span>
            <input
              className={inputClass}
              placeholder={field.placeholder}
              value={form[field.key] ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
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
