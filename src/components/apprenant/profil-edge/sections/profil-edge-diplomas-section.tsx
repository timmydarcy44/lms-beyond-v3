"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import type { Diplome } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DIPLOMA_TYPES = ["Bac", "BTS", "Bachelor", "Mastère", "Master", "Certification", "Open Badge", "Autre"];

const EMPTY = {
  intitule: "",
  ecole: "",
  annee_obtention: "",
  diploma_type: "Bac",
  niveau: "",
  description: "",
};

function mapRow(row: Record<string, unknown>): Diplome {
  return {
    id: String(row.id),
    intitule: row.intitule ? String(row.intitule) : null,
    ecole: row.ecole ? String(row.ecole) : null,
    annee_obtention: row.annee_obtention != null ? Number(row.annee_obtention) : null,
    mode: row.mode ? String(row.mode) : null,
    diploma_type: row.diploma_type ? String(row.diploma_type) : null,
    niveau: row.niveau ? String(row.niveau) : null,
    description: row.description ? String(row.description) : null,
  };
}

export function ProfilEdgeDiplomasSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Diplome[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("diplomes").select("*").eq("learner_id", uid).order("annee_obtention", { ascending: false });
    setItems((data ?? []).map((r) => mapRow(r as Record<string, unknown>)));
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
  };

  const save = async () => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;

    const year = form.annee_obtention ? Number(form.annee_obtention) : null;
    const payload = {
      learner_id: uid,
      intitule: form.intitule.trim() || null,
      ecole: form.ecole.trim() || null,
      annee_obtention: Number.isFinite(year) ? year : null,
      diploma_type: form.diploma_type,
      niveau: form.niveau.trim() || null,
      description: form.description.trim() || null,
      mode: form.diploma_type,
    };

    if (editingId) {
      await supabase.from("diplomes").update(payload).eq("id", editingId);
    } else {
      await supabase.from("diplomes").insert(payload);
    }

    await load();
    resetForm();
    setSaving(false);
    finishSave();
  };

  const startEdit = (dip: Diplome) => {
    setEditingId(dip.id);
    setShowForm(true);
    setForm({
      intitule: dip.intitule ?? "",
      ecole: dip.ecole ?? "",
      annee_obtention: dip.annee_obtention ? String(dip.annee_obtention) : "",
      diploma_type: dip.diploma_type ?? "Autre",
      niveau: dip.niveau ?? "",
      description: dip.description ?? "",
    });
  };

  const remove = async (id: string) => {
    await supabase.from("diplomes").delete().eq("id", id);
    await load();
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  return (
    <ProfilEdgeSectionShell title="Diplômes" description="Formations, certifications et Open Badges.">
      <div className="space-y-4">
        {items.map((dip) => (
          <article key={dip.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{dip.intitule}</p>
                <p className="text-sm text-white/55">
                  {dip.ecole} · {dip.diploma_type} · {dip.annee_obtention ?? "—"}
                </p>
                {dip.description ? <p className="mt-2 text-sm text-white/70">{dip.description}</p> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(dip)} className="text-white/45 hover:text-white">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => void remove(dip.id)} className="text-white/45 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/5 p-4">
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Type</span>
              <select
                className={inputClass}
                value={form.diploma_type}
                onChange={(e) => setForm((f) => ({ ...f, diploma_type: e.target.value }))}
              >
                {DIPLOMA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {(
              [
                ["intitule", "Nom"],
                ["ecole", "Établissement"],
                ["annee_obtention", "Année"],
                ["niveau", "Niveau"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-white/70">{label}</span>
                <input className={inputClass} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </label>
            ))}
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Description</span>
              <textarea className={inputClass} rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void save()} className={CONNECT_BTN_PRIMARY}>
                {editingId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button type="button" onClick={resetForm} className={CONNECT_BTN_SECONDARY}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-2`}>
            <Plus className="h-4 w-4" /> Ajouter un diplôme
          </button>
        )}
      </div>
      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}
    </ProfilEdgeSectionShell>
  );
}
