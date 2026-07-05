"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY, CONNECT_BTN_SECONDARY } from "@/lib/apprenant/connect-nav";
import type { ExperiencePro } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const EMPTY = {
  employeur: "",
  poste: "",
  date_debut: "",
  date_fin: "",
  missions: "",
  competences: "",
};

function mapRow(row: Record<string, unknown>): ExperiencePro {
  const comps = row.competences_developpees;
  return {
    id: String(row.id),
    employeur: row.employeur ? String(row.employeur) : null,
    poste: row.poste ? String(row.poste) : null,
    type_contrat: row.type_contrat ? String(row.type_contrat) : null,
    date_debut: row.date_debut ? String(row.date_debut) : null,
    date_fin: row.date_fin ? String(row.date_fin) : null,
    missions: row.missions ? String(row.missions) : null,
    competences_developpees: Array.isArray(comps) ? comps.map(String) : [],
  };
}

export function ProfilEdgeExperiencesSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ExperiencePro[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("experiences_pro")
      .select("*")
      .eq("learner_id", uid)
      .order("date_debut", { ascending: false });
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

    const payload = {
      learner_id: uid,
      employeur: form.employeur.trim() || null,
      poste: form.poste.trim() || null,
      date_debut: form.date_debut || null,
      date_fin: form.date_fin || null,
      missions: form.missions.trim() || null,
      competences_developpees: form.competences
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      type_contrat: "CDI",
    };

    if (editingId) {
      await supabase.from("experiences_pro").update(payload).eq("id", editingId);
    } else {
      await supabase.from("experiences_pro").insert(payload);
    }

    await load();
    resetForm();
    setSaving(false);
    finishSave();
  };

  const startEdit = (exp: ExperiencePro) => {
    setEditingId(exp.id);
    setShowForm(true);
    setForm({
      employeur: exp.employeur ?? "",
      poste: exp.poste ?? "",
      date_debut: exp.date_debut?.slice(0, 10) ?? "",
      date_fin: exp.date_fin?.slice(0, 10) ?? "",
      missions: exp.missions ?? "",
      competences: (exp.competences_developpees ?? []).join(", "),
    });
  };

  const remove = async (id: string) => {
    await supabase.from("experiences_pro").delete().eq("id", id);
    await load();
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  return (
    <ProfilEdgeSectionShell
      title="Expérience professionnelle"
      description="Ajoutez vos expériences pour enrichir l'analyse métier."
    >
      <div className="space-y-4">
        {items.map((exp) => (
          <article key={exp.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-white">{exp.poste || "Poste"}</p>
                <p className="text-sm text-white/55">{exp.employeur}</p>
                <p className="mt-1 text-xs text-white/40">
                  {exp.date_debut?.slice(0, 10) ?? "—"} → {exp.date_fin?.slice(0, 10) ?? "Présent"}
                </p>
                {exp.missions ? <p className="mt-2 text-sm text-white/70">{exp.missions}</p> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(exp)} className="text-white/45 hover:text-white">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => void remove(exp.id)} className="text-white/45 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        ))}

        {showForm ? (
          <div className="space-y-3 rounded-xl border border-[#3D7BFF]/20 bg-[#3D7BFF]/5 p-4">
            {(
              [
                ["employeur", "Entreprise"],
                ["poste", "Poste"],
                ["date_debut", "Date début"],
                ["date_fin", "Date fin"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="mb-1 block text-white/70">{label}</span>
                <input
                  type={key.startsWith("date") ? "date" : "text"}
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
              </label>
            ))}
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Description</span>
              <textarea className={inputClass} rows={3} value={form.missions} onChange={(e) => setForm((f) => ({ ...f, missions: e.target.value }))} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-white/70">Compétences développées (séparées par des virgules)</span>
              <input className={inputClass} value={form.competences} onChange={(e) => setForm((f) => ({ ...f, competences: e.target.value }))} />
            </label>
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void save()} className={CONNECT_BTN_PRIMARY}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editingId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button type="button" onClick={resetForm} className={CONNECT_BTN_SECONDARY}>
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setShowForm(true)} className={`${CONNECT_BTN_SECONDARY} inline-flex items-center gap-2`}>
            <Plus className="h-4 w-4" /> Ajouter une expérience
          </button>
        )}
      </div>
      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}
    </ProfilEdgeSectionShell>
  );
}
