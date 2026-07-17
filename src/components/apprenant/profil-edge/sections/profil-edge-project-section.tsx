"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EdgeSelect } from "@/components/ui/edge-select";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import {
  buildCareerResolvePrompt,
  EDGE_PROJECT_KEYS,
  isEdgeProjectV2Complete,
  migrateLegacyProjectToV2,
  PROFESSION_OPTIONS,
  SECTEUR_V2_OPTIONS,
} from "@/lib/particulier/edge-professional-project-v2";
import { mergeObjectiveDetailsIntoProject } from "@/lib/particulier/professional-project-fields";
import { parseProfessionalProject, type ProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfilEdgeProjectSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfessionalProject>({});
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);

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
    const merged = mergeObjectiveDetailsIntoProject(
      data?.type_profil,
      parseProfessionalProject(data?.professional_project),
      objectiveDetails,
    );
    const project = migrateLegacyProjectToV2(merged);
    setForm(project);

    if (data?.target_career_slug) {
      try {
        const res = await fetch(
          `/api/career-profiles/search?slug=${encodeURIComponent(String(data.target_career_slug))}`,
        );
        const json = await res.json();
        if (res.ok && json.profile?.title) setResolvedTitle(String(json.profile.title));
      } catch {
        /* ignore */
      }
    }
  }, [supabase]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const setField = (key: string, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === EDGE_PROJECT_KEYS.profession && value !== "autre") {
        next[EDGE_PROJECT_KEYS.professionLibre] = "";
      }
      if (key === EDGE_PROJECT_KEYS.secteur && value !== "autre") {
        next[EDGE_PROJECT_KEYS.secteurLibre] = "";
      }
      return next;
    });
    setError(null);
  };

  const save = async () => {
    if (!isEdgeProjectV2Complete(form)) {
      setError(
        "Renseignez la profession, le secteur (et les précisions si « Autre ») puis décrivez votre projet (20 caractères minimum).",
      );
      return;
    }

    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ professional_project: form })
      .eq("id", uid);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    const prompt = buildCareerResolvePrompt(form);
    try {
      const resolveRes = await fetch("/api/learner/career-profiles/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const resolveJson = await resolveRes.json();
      if (resolveRes.ok && resolveJson.profile?.title) {
        setResolvedTitle(String(resolveJson.profile.title));
      } else if (!resolveRes.ok) {
        setError(
          String(resolveJson.error ?? "Projet enregistré, mais l'analyse métier a échoué. Réessayez."),
        );
        setSaving(false);
        finishSave();
        return;
      }
    } catch {
      setError("Projet enregistré, mais l'analyse métier est indisponible pour le moment.");
      setSaving(false);
      finishSave();
      return;
    }

    setSaving(false);
    finishSave();
  };

  if (loading) return <p className="text-sm text-white/50">Chargement…</p>;

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3D7BFF]/40";
  const textareaClass = `${inputClass} min-h-[120px] resize-y`;

  return (
    <ProfilEdgeSectionShell
      title="Projet professionnel"
      description="Décrivez votre cap : EDGE identifie ensuite le métier le plus pertinent pour votre analyse."
    >
      <div className="space-y-5">
        <div className="block text-sm">
          <span className="mb-1 block text-white/70">Profession</span>
          <EdgeSelect
            value={form[EDGE_PROJECT_KEYS.profession] ?? ""}
            onChange={(v) => setField(EDGE_PROJECT_KEYS.profession, v)}
            options={[...PROFESSION_OPTIONS]}
            placeholder="Choisir une profession…"
          />
        </div>

        {form[EDGE_PROJECT_KEYS.profession] === "autre" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">
              Quel est votre métier&nbsp;? <span className="text-rose-400">*</span>
            </span>
            <input
              className={inputClass}
              placeholder="Ex. Responsable marketing financier, chef de projet digital…"
              value={form[EDGE_PROJECT_KEYS.professionLibre] ?? ""}
              onChange={(e) => setField(EDGE_PROJECT_KEYS.professionLibre, e.target.value)}
              autoFocus
            />
          </label>
        ) : null}

        <div className="block text-sm">
          <span className="mb-1 block text-white/70">Secteur</span>
          <EdgeSelect
            value={form[EDGE_PROJECT_KEYS.secteur] ?? ""}
            onChange={(v) => setField(EDGE_PROJECT_KEYS.secteur, v)}
            options={[...SECTEUR_V2_OPTIONS]}
            placeholder="Choisir un secteur…"
          />
        </div>

        {form[EDGE_PROJECT_KEYS.secteur] === "autre" ? (
          <label className="block text-sm">
            <span className="mb-1 block text-white/70">
              Précisez votre secteur <span className="text-rose-400">*</span>
            </span>
            <input
              className={inputClass}
              placeholder="Ex. Énergie renouvelable, agritech, médias…"
              value={form[EDGE_PROJECT_KEYS.secteurLibre] ?? ""}
              onChange={(e) => setField(EDGE_PROJECT_KEYS.secteurLibre, e.target.value)}
            />
          </label>
        ) : null}

        <label className="block text-sm">
          <span className="mb-1 block text-white/70">Spécialité (optionnelle)</span>
          <input
            className={inputClass}
            placeholder="Ex. Immobilier de prestige, e-commerce sport…"
            value={form[EDGE_PROJECT_KEYS.specialite] ?? ""}
            onChange={(e) => setField(EDGE_PROJECT_KEYS.specialite, e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-white/70">
            Décrivez votre projet professionnel <span className="text-rose-400">*</span>
          </span>
          <textarea
            className={textareaClass}
            placeholder="Ex. Je souhaite évoluer vers un poste de chargé de clientèle B2B dans l'immobilier commercial, en valorisant mon expérience terrain et ma capacité à négocier."
            value={form[EDGE_PROJECT_KEYS.projetLibre] ?? ""}
            onChange={(e) => setField(EDGE_PROJECT_KEYS.projetLibre, e.target.value)}
          />
          <span className="mt-1 block text-xs text-white/35">Minimum 20 caractères</span>
        </label>
      </div>

      {resolvedTitle ? (
        <p className="mt-4 text-xs text-white/45">
          Référentiel EDGE utilisé pour l&apos;analyse : {resolvedTitle}
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}

      <button type="button" onClick={() => void save()} disabled={saving} className={`${CONNECT_BTN_PRIMARY} mt-6`}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Enregistrer
      </button>
    </ProfilEdgeSectionShell>
  );
}
