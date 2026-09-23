"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useProfilEdgeSaveReturn } from "@/components/apprenant/profil-edge/use-profil-edge-save-return";
import { CONNECT_BTN_PRIMARY } from "@/lib/apprenant/connect-nav";
import {
  buildCareerResolvePrompt,
  buildUserObjectiveDisplay,
  EDGE_PROJECT_KEYS,
  isEdgeProjectV2Complete,
  migrateLegacyProjectToV2,
  PROFESSION_OPTIONS,
  SECTEUR_V2_OPTIONS,
} from "@/lib/particulier/edge-professional-project-v2";
import { mergeObjectiveDetailsIntoProject } from "@/lib/particulier/professional-project-fields";
import {
  parseProfessionalProject,
  PROFIL_EDGE_SECTION_BASE,
  type ProfessionalProject,
} from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type StepId = "profession" | "secteur" | "specialite" | "projet" | "confirm";

const STEPS: StepId[] = ["profession", "secteur", "specialite", "projet", "confirm"];

const STEP_COPY: Record<StepId, { title: string; subtitle: string }> = {
  profession: {
    title: "Quel métier visez-vous ?",
    subtitle: "Choisissez la famille qui vous correspond le mieux.",
  },
  secteur: {
    title: "Dans quel univers ?",
    subtitle: "Le secteur affine vos recommandations EDGE.",
  },
  specialite: {
    title: "Une spécialité ?",
    subtitle: "Optionnel — ajoutez une nuance si vous en avez une.",
  },
  projet: {
    title: "Dites-le en une phrase",
    subtitle: "Comme vous le diriez à un mentor, en 20 caractères minimum.",
  },
  confirm: {
    title: "Votre cap",
    subtitle: "Vérifiez, puis lancez l’analyse métier EDGE.",
  },
};

function ChoiceGrid({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative min-h-[72px] rounded-2xl border px-3 py-4 text-left transition active:scale-[0.98]",
              selected
                ? "border-[#3D7BFF] bg-[#3D7BFF]/15 text-white shadow-[0_0_0_1px_rgba(61,123,255,0.35)]"
                : "border-white/[0.08] bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]",
            )}
          >
            <span className="block text-[15px] font-semibold tracking-[-0.02em]">{opt.label}</span>
            {selected ? (
              <span className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3D7BFF] text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function ProfilEdgeProjectSection() {
  const supabase = createSupabaseBrowserClient();
  const { savedMessage, finishSave } = useProfilEdgeSaveReturn();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfessionalProject>({});
  const [resolvedTitle, setResolvedTitle] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const step = STEPS[stepIndex] ?? "profession";
  const copy = STEP_COPY[step];

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

    if (isEdgeProjectV2Complete(project)) {
      setStepIndex(STEPS.indexOf("confirm"));
    }

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

  const canContinue = useMemo(() => {
    const profession = form[EDGE_PROJECT_KEYS.profession] ?? "";
    const secteur = form[EDGE_PROJECT_KEYS.secteur] ?? "";
    if (step === "profession") {
      if (!profession) return false;
      if (profession === "autre") return Boolean(form[EDGE_PROJECT_KEYS.professionLibre]?.trim());
      return true;
    }
    if (step === "secteur") {
      if (!secteur) return false;
      if (secteur === "autre") return Boolean(form[EDGE_PROJECT_KEYS.secteurLibre]?.trim());
      return true;
    }
    if (step === "specialite") return true;
    if (step === "projet") {
      return (form[EDGE_PROJECT_KEYS.projetLibre] ?? "").trim().length >= 20;
    }
    return isEdgeProjectV2Complete(form);
  }, [form, step]);

  const goNext = () => {
    if (!canContinue) return;
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  };

  const save = async () => {
    if (!isEdgeProjectV2Complete(form)) {
      setError("Complétez les étapes pour enregistrer votre cap.");
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

  if (loading) {
    return <p className="text-sm text-white/50">Chargement…</p>;
  }

  const progress = ((stepIndex + 1) / STEPS.length) * 100;
  const objectivePreview = buildUserObjectiveDisplay(form);
  const projetLen = (form[EDGE_PROJECT_KEYS.projetLibre] ?? "").trim().length;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col pb-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        ) : (
          <Link
            href={PROFIL_EDGE_SECTION_BASE}
            className="inline-flex items-center gap-1.5 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Profil
          </Link>
        )}
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/30">
          {stepIndex + 1} / {STEPS.length}
        </span>
      </div>

      <div className="mb-8 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full rounded-full bg-[#3D7BFF] transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="mb-8 space-y-2">
        <h1 className="text-[1.85rem] font-bold leading-[1.15] tracking-[-0.04em] text-white sm:text-[2.1rem]">
          {copy.title}
        </h1>
        <p className="text-[15px] leading-relaxed text-white/45">{copy.subtitle}</p>
      </header>

      <div className="flex-1 space-y-5">
        {step === "profession" ? (
          <>
            <ChoiceGrid
              options={PROFESSION_OPTIONS}
              value={form[EDGE_PROJECT_KEYS.profession] ?? ""}
              onChange={(v) => setField(EDGE_PROJECT_KEYS.profession, v)}
            />
            {form[EDGE_PROJECT_KEYS.profession] === "autre" ? (
              <input
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/45"
                placeholder="Précisez votre métier…"
                value={form[EDGE_PROJECT_KEYS.professionLibre] ?? ""}
                onChange={(e) => setField(EDGE_PROJECT_KEYS.professionLibre, e.target.value)}
              />
            ) : null}
          </>
        ) : null}

        {step === "secteur" ? (
          <>
            <ChoiceGrid
              options={SECTEUR_V2_OPTIONS}
              value={form[EDGE_PROJECT_KEYS.secteur] ?? ""}
              onChange={(v) => setField(EDGE_PROJECT_KEYS.secteur, v)}
            />
            {form[EDGE_PROJECT_KEYS.secteur] === "autre" ? (
              <input
                autoFocus
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/45"
                placeholder="Précisez votre secteur…"
                value={form[EDGE_PROJECT_KEYS.secteurLibre] ?? ""}
                onChange={(e) => setField(EDGE_PROJECT_KEYS.secteurLibre, e.target.value)}
              />
            ) : null}
          </>
        ) : null}

        {step === "specialite" ? (
          <div className="space-y-4">
            <input
              autoFocus
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-[16px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/45"
              placeholder="Ex. Business development, e-commerce sport…"
              value={form[EDGE_PROJECT_KEYS.specialite] ?? ""}
              onChange={(e) => setField(EDGE_PROJECT_KEYS.specialite, e.target.value)}
            />
            <button
              type="button"
              onClick={goNext}
              className="text-sm text-white/40 underline-offset-2 hover:text-white/70 hover:underline"
            >
              Passer cette étape
            </button>
          </div>
        ) : null}

        {step === "projet" ? (
          <div className="space-y-3">
            <textarea
              autoFocus
              rows={5}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-[16px] leading-relaxed text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/45"
              placeholder="Ex. Je veux devenir business developer dans le sport."
              value={form[EDGE_PROJECT_KEYS.projetLibre] ?? ""}
              onChange={(e) => setField(EDGE_PROJECT_KEYS.projetLibre, e.target.value)}
            />
            <p
              className={cn(
                "text-[12px] tabular-nums",
                projetLen >= 20 ? "text-emerald-400/80" : "text-white/30",
              )}
            >
              {projetLen}/20
            </p>
          </div>
        ) : null}

        {step === "confirm" ? (
          <div className="space-y-4">
            <div className="rounded-[1.35rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
                Objectif
              </p>
              <p className="mt-2 text-[1.35rem] font-bold tracking-[-0.03em] text-white">
                {objectivePreview || "À compléter"}
              </p>
              {form[EDGE_PROJECT_KEYS.projetLibre] ? (
                <p className="mt-3 text-[14px] leading-relaxed text-white/50">
                  {form[EDGE_PROJECT_KEYS.projetLibre]}
                </p>
              ) : null}
            </div>
            {resolvedTitle ? (
              <p className="text-[12px] text-white/40">
                Référentiel EDGE : <span className="text-white/70">{resolvedTitle}</span>
              </p>
            ) : (
              <p className="text-[12px] text-white/35">
                À l’enregistrement, EDGE identifiera le métier le plus pertinent.
              </p>
            )}
            <button
              type="button"
              onClick={() => setStepIndex(0)}
              className="text-sm text-[#9EC0FF] hover:underline"
            >
              Modifier mes réponses
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
      {savedMessage ? <p className="mt-4 text-sm text-emerald-400">{savedMessage}</p> : null}

      <div className="sticky bottom-0 mt-8 bg-gradient-to-t from-[#05060a] via-[#05060a] to-transparent pt-4">
        {step === "confirm" ? (
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !canContinue}
            className={cn(CONNECT_BTN_PRIMARY, "h-12 w-full justify-center text-[15px]")}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer mon cap
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinue}
            className={cn(
              CONNECT_BTN_PRIMARY,
              "h-12 w-full justify-center gap-2 text-[15px]",
              !canContinue && "pointer-events-none opacity-40",
            )}
          >
            Continuer
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
