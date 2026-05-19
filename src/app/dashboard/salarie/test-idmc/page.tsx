"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";
type LikertValue = 0 | 1 | 2 | 3;

const LIKERT_OPTIONS: Array<{ label: string; value: LikertValue }> = [
  { label: "Jamais", value: 0 },
  { label: "Parfois", value: 1 },
  { label: "Souvent", value: 2 },
  { label: "Toujours", value: 3 },
];

const AXES_LABELS: Record<AxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l’information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

type QuestionItem = {
  axis: AxisKey;
  order: number;
  text: string;
  reversed?: boolean;
};

const IDMC_EMPLOYEE_QUESTIONS: QuestionItem[] = [
  // A1
  { axis: "A1", order: 1, text: "Quand je reçois un retour critique sur un projet, je suis capable d’identifier précisément les points à améliorer." },
  { axis: "A1", order: 2, text: "Je connais les moments de la journée où je suis le plus efficace et j’organise mes tâches en conséquence." },
  { axis: "A1", order: 3, text: "Avant d’aborder un nouveau sujet, je suis capable d’évaluer si j’ai les compétences suffisantes pour le comprendre." },
  { axis: "A1", order: 4, text: "Je commence souvent une tâche sans avoir vérifié que j’avais bien compris ce qu’on attendait de moi.", reversed: true },
  { axis: "A1", order: 5, text: "Je sais distinguer ce que j’ai vraiment compris de ce que j’ai simplement lu ou survolé sans assimiler." },
  // A2
  { axis: "A2", order: 1, text: "Mes prises de notes sont organisées de façon à pouvoir les réutiliser facilement lors de réunions, rapports ou présentations." },
  { axis: "A2", order: 2, text: "J’ai une méthode de travail que j’adapte selon le type de mission (rapport, présentation, projet, analyse) et dont j’évalue l’efficacité." },
  { axis: "A2", order: 3, text: "Je connais et j’applique les critères d’attente de mes managers ou de mes clients avant de livrer un travail." },
  { axis: "A2", order: 4, text: "J’utilise des techniques concrètes (associations, schémas, répétition, synthèses) pour mémoriser des informations clés." },
  { axis: "A2", order: 5, text: "Je construis mes plans de travail ou mes argumentaires de façon structurée avant de commencer à rédiger ou présenter un livrable." },
  // A3
  { axis: "A3", order: 1, text: "Quand j’aborde un nouveau projet, je cherche spontanément à faire le lien avec mes expériences professionnelles passées." },
  { axis: "A3", order: 2, text: "Je change de méthode de travail selon qu’il s’agit d’un cas pratique, d’un exercice théorique ou d’un projet concret." },
  { axis: "A3", order: 3, text: "Je mobilise mes points forts dans certaines missions pour compenser mes difficultés dans d’autres domaines." },
  { axis: "A3", order: 4, text: "J’adapte ma vitesse de lecture selon que l’information est centrale ou secondaire pour le projet." },
  { axis: "A3", order: 5, text: "Je choisis mes outils de travail (tableau, schéma, fiche, tableur, maquette) en fonction du problème à résoudre, pas par habitude." },
  // A4
  { axis: "A4", order: 1, text: "Je planifie mes missions et livrables suffisamment à l’avance pour éviter la dernière‑minute et le stress de dernière minute." },
  { axis: "A4", order: 2, text: "Avant de démarrer une tâche, je rassemble tout ce dont j’ai besoin pour ne pas être interrompu(e) en cours de route." },
  { axis: "A4", order: 3, text: "Je définis clairement ce que je veux avoir accompli avant de commencer à travailler." },
  { axis: "A4", order: 4, text: "J’ai tendance à démarrer directement sans planifier les étapes, ce qui me fait parfois perdre du temps ou de la qualité.", reversed: true },
  { axis: "A4", order: 5, text: "J’estime le temps nécessaire pour chaque partie de mon travail avant de me lancer." },
  // A5
  { axis: "A5", order: 1, text: "Quand un passage ou une information est complexe, je ralentis volontairement ma lecture plutôt que de le survoler." },
  { axis: "A5", order: 2, text: "Je cherche d’abord à comprendre l’idée générale d’un texte, d’un rapport ou d’une présentation avant de me concentrer sur les détails." },
  { axis: "A5", order: 3, text: "Pour comprendre un concept abstrait, je construis spontanément un exemple concret lié à mon activité professionnelle." },
  { axis: "A5", order: 4, text: "Je suis capable de reformuler avec mes propres mots ce que je viens d’apprendre, sans regarder mes notes." },
  { axis: "A5", order: 5, text: "J’utilise des supports visuels (schémas, tableaux, cartes mentales) pour organiser et retenir l’information." },
  // A6
  { axis: "A6", order: 1, text: "Quand je suis bloqué(e) sur un projet, je demande de l’aide à un manager, un collègue ou un expert plutôt que de rester seul(e)." },
  { axis: "A6", order: 2, text: "Quand je vois qu’une méthode de travail ne fonctionne pas, je change d’approche sans attendre d’être complètement bloqué(e)." },
  { axis: "A6", order: 3, text: "Quand je perds le fil d’une explication, je reviens en amont plutôt que de continuer sans comprendre." },
  { axis: "A6", order: 4, text: "Je décompose les problèmes complexes en sous‑questions ou sous‑étapes simples pour les traiter une par une." },
  { axis: "A6", order: 5, text: "Après une erreur ou un écart de livraison, j’identifie précisément ce qui l’a causée pour éviter de la reproduire." },
  // A7
  { axis: "A7", order: 1, text: "Pendant un travail long, je fais des points intermédiaires pour vérifier que je suis toujours sur la bonne voie." },
  { axis: "A7", order: 2, text: "Je contrôle la qualité de ce que je produis au fur et à mesure, pas seulement à la fin." },
  { axis: "A7", order: 3, text: "Avant de rendre un livrable, je vérifie que j’ai bien répondu à tous les points attendus." },
  { axis: "A7", order: 4, text: "Il m’arrive de terminer un travail sans vérifier si ma méthode était vraiment la plus adaptée.", reversed: true },
  { axis: "A7", order: 5, text: "Quand je vois que le temps me manque, j’ajuste mes objectifs pour livrer l’essentiel plutôt que de tout bâcler." },
  // A8
  { axis: "A8", order: 1, text: "Juste après la livraison d’un projet, je suis capable d’estimer mon niveau de performance de façon réaliste." },
  { axis: "A8", order: 2, text: "Une fois une tâche terminée, je prends le temps de résumer ce que j’en ai appris pour mes prochaines missions." },
  { axis: "A8", order: 3, text: "Je suis capable de dire honnêtement si j’ai vraiment donné le meilleur de moi-même sur un travail." },
  { axis: "A8", order: 4, text: "J’analyse mes erreurs ou retards passés pour en tirer des règles concrètes applicables à mes prochains projets." },
  { axis: "A8", order: 5, text: "Je termine souvent un travail sans vraiment réfléchir à ce que j’aurais pu faire différemment.", reversed: true },
];

function TestInner() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<LikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [responses, setResponses] = useState<
    Array<{
      axis: AxisKey;
      question_index: number;
      text: string;
      value: LikertValue;
      score: number;
      reversed: boolean;
    }>
  >([]);

  const current = IDMC_EMPLOYEE_QUESTIONS[index];
  const progress = completed ? 100 : Math.round(((index + 1) / IDMC_EMPLOYEE_QUESTIONS.length) * 100);

  const axisPoints = useMemo(() => {
    const base: Record<AxisKey, number> = { A1: 0, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0, A7: 0, A8: 0 };
    for (const response of responses) {
      base[response.axis] += response.score;
    }
    return base;
  }, [responses]);

  const axisPercentages = useMemo(() => {
    const base = {} as Record<AxisKey, number>;
    (Object.keys(axisPoints) as AxisKey[]).forEach((key) => {
      base[key] = Math.round((axisPoints[key] / 15) * 100);
    });
    return base;
  }, [axisPoints]);

  const totalScore = useMemo(() => {
    const total = Object.values(axisPoints).reduce((sum, value) => sum + value, 0);
    return (total / 120) * 100;
  }, [axisPoints]);

  const level = useMemo(() => {
    if (totalScore < 40) return "Maîtrise à construire";
    if (totalScore < 60) return "Maîtrise en développement";
    if (totalScore < 80) return "Maîtrise opérationnelle";
    return "Maîtrise experte";
  }, [totalScore]);

  const handleSelect = (value: LikertValue) => {
    if (selectedValue !== null || submitting || analyzing || completed) return;
    setSelectedValue(value);
    const isReversed = Boolean(current.reversed);
    const score = isReversed ? 3 - value : value;

    setResponses((prev) => [
      ...prev.filter((item) => item.question_index !== index + 1),
      {
        axis: current.axis,
        question_index: index + 1,
        text: current.text,
        value,
        score,
        reversed: isReversed,
      },
    ]);

    setTimeout(() => {
      if (index < IDMC_EMPLOYEE_QUESTIONS.length - 1) {
        setIndex((p) => p + 1);
        setSelectedValue(null);
        return;
      }
      setSubmitting(true);
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setSubmitting(false);
        setCompleted(true);
        setSelectedValue(null);
      }, 900);
    }, 250);
  };

  const handleSaveResults = async () => {
    if (responses.length < IDMC_EMPLOYEE_QUESTIONS.length) {
      setSavedMessage("Merci de répondre à toutes les questions.");
      return;
    }

    setSavingResults(true);
    setSavedMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase non configuré.");

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setSavedMessage("Erreur de session. Reconnecte-toi.");
        return;
      }

      const payload = {
        profile_id: user.id,
        scores: {
          axes: axisPercentages,
          points: axisPoints,
          global_score: Number(totalScore.toFixed(2)),
          level,
          variant: "employee",
        },
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase.from("idmc_resultats").upsert(payload, { onConflict: "profile_id" });
      if (dbError) throw dbError;

      router.push("/dashboard/salarie");
    } catch (e: any) {
      setSavedMessage(typeof e?.message === "string" ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSavingResults(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-10 px-6 py-16 font-['Inter'] lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="h-[2px] w-full rounded-full bg-black/10">
              <div className="h-[2px] rounded-full bg-emerald-600" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-[12px] text-black/50">
              {completed ? "Test terminé" : `Question ${index + 1} sur ${IDMC_EMPLOYEE_QUESTIONS.length}`}
            </div>
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-emerald-700">Test IDMC Salarié</div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Votre cartographie IDMC (travail)</h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600">
            Répondez spontanément. Le but est d’identifier vos leviers de performance (méthodes, organisation, résolution…).
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Axe {current.axis} — {AXES_LABELS[current.axis]}
            </div>
            <div className="mt-3 text-lg font-extrabold leading-snug text-slate-900">{current.text}</div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {LIKERT_OPTIONS.map((opt) => {
              const active = selectedValue === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={selectedValue !== null || submitting || analyzing || completed}
                  onClick={() => handleSelect(opt.value)}
                  className={[
                    "rounded-2xl border px-4 py-3 text-sm font-extrabold transition",
                    active ? "border-emerald-200 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {analyzing ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mt-6 text-sm font-semibold text-slate-600"
              >
                Analyse en cours…
              </motion.div>
            ) : null}
          </AnimatePresence>

          {completed ? (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Résultat</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{Math.round(totalScore)}%</div>
              <div className="mt-1 text-sm text-slate-600">{level}</div>

              <button
                type="button"
                disabled={savingResults}
                onClick={() => void handleSaveResults()}
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingResults ? "Enregistrement…" : "Enregistrer & retourner au dashboard"}
              </button>
              {savedMessage ? <div className="mt-3 text-sm text-rose-600">{savedMessage}</div> : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => router.push("/dashboard/salarie")}
            className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 hover:text-slate-700"
          >
            Retour au dashboard
          </button>
        </div>

        <div className="flex flex-col justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Axes</div>
            <div className="mt-4 space-y-3">
              {(Object.keys(AXES_LABELS) as AxisKey[]).map((key) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>
                      {key} — {AXES_LABELS[key]}
                    </span>
                    <span className="text-slate-900">{axisPercentages[key]}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-slate-900" style={{ width: `${axisPercentages[key]}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-slate-500">
              Astuce : certaines questions sont inversées pour éviter les biais de réponse.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalarieIdmcTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TestInner />
    </Suspense>
  );
}

