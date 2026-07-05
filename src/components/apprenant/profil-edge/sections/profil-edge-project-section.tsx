"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CareerProfilePicker } from "@/components/apprenant/career-profile-picker";
import { EdgeSelect } from "@/components/ui/edge-select";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import type { CareerProfile } from "@/lib/career-profiles/career-profiles-data";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import { objectiveTypeLabel } from "@/lib/particulier/professional-project-fields";
import {
  getCareerTargetFieldKey,
  getProfessionalProjectFields,
  mergeObjectiveDetailsIntoProject,
} from "@/lib/particulier/professional-project-fields";
import { parseProfessionalProject, type ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfilEdgeProjectSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeProfil, setTypeProfil] = useState<string | null>(null);
  const [form, setForm] = useState<ProfessionalProject>({});
  const [targetCareerSlug, setTargetCareerSlug] = useState<string | null>(null);
  const [careerTitle, setCareerTitle] = useState<string | null>(null);

  const fields = getProfessionalProjectFields(typeProfil);
  const careerFieldKey = getCareerTargetFieldKey(typeProfil);

  const load = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("profiles")
      .select("professional_project, target_career_slug, type_profil, objective_details")
      .eq("id", uid)
      .maybeSingle();

    const objectiveDetails = (data?.objective_details as Record<string, string>) ?? {};
    const project = mergeObjectiveDetailsIntoProject(
      data?.type_profil,
      parseProfessionalProject(data?.professional_project),
      objectiveDetails,
    );

    setTypeProfil(data?.type_profil ? String(data.type_profil) : null);
    setForm(project);
    const slug = data?.target_career_slug ? String(data.target_career_slug) : null;
    setTargetCareerSlug(slug);
    const careerKey = getCareerTargetFieldKey(data?.type_profil);
    setCareerTitle(careerKey ? project[careerKey] ?? null : null);
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const persist = async (nextForm: ProfessionalProject) => {
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    await supabase.from("profiles").update({ professional_project: nextForm }).eq("id", uid);
    setSaving(false);
    finishSave();
  };

  const handleCareerResolved = (slug: string, profile: CareerProfile) => {
    if (!careerFieldKey) return;
    const nextForm = { ...form, [careerFieldKey]: profile.title };
    setForm(nextForm);
    setTargetCareerSlug(slug);
    setCareerTitle(profile.title);
  };

  const save = async () => {
    await persist(form);
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";

  return (
    <ProfilEdgeSectionShell
      title="Projet professionnel"
      description={`Objectif : ${objectiveTypeLabel(typeProfil)} — complétez les informations adaptées à votre situation.`}
    >
      <div className="space-y-6">
        {fields.map((field) =>
          field.isCareerTarget ? (
            <CareerProfilePicker
              key={field.key}
              value={targetCareerSlug}
              selectedTitle={careerTitle ?? form[field.key]}
              onResolved={(slug, profile) => handleCareerResolved(slug, profile)}
            />
          ) : field.inputType === "select" && field.options ? (
            <div key={field.key} className="block text-sm">
              <span className="mb-1 block text-white/70">{field.label}</span>
              <EdgeSelect
                value={form[field.key] ?? ""}
                onChange={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                options={field.options}
                placeholder={field.placeholder}
              />
            </div>
          ) : (
            <label key={field.key} className="block text-sm">
              <span className="mb-1 block text-white/70">{field.label}</span>
              <input
                className={inputClass}
                placeholder={field.placeholder}
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              />
            </label>
          ),
        )}
      </div>

      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}

      <button type="button" onClick={() => void save()} disabled={saving} className={`${CONNECT_BTN_PRIMARY} mt-6`}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enregistrer
      </button>
    </ProfilEdgeSectionShell>
  );
}
