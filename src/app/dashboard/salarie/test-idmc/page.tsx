"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  computeIdmcResultFromResponses,
  IDMC_AXES_LABELS,
  IDMC_LIKERT_OPTIONS,
  IDMC_QUESTIONS,
  type IdmcAxisKey,
  type IdmcLikertValue,
  type IdmcResponse,
  type IdmcVariant,
} from "@/lib/idmc/idmc-questions";
import { redirectAfterSalarieAssessmentTest } from "@/lib/salarie/post-test-redirect";
import { saveIdmcResultats } from "@/lib/idmc/idmc-save";
import { invalidateLearnerSnapshotCache } from "@/hooks/use-personalized-action-plan";

const IDMC_VARIANT: IdmcVariant = "employee";
const QUESTIONS = IDMC_QUESTIONS[IDMC_VARIANT];

function TestInner() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<IdmcLikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [responses, setResponses] = useState<IdmcResponse[]>([]);

  const current = QUESTIONS[index];
  const progress = completed ? 100 : Math.round(((index + 1) / QUESTIONS.length) * 100);

  const { axisPoints, axisPercentages, globalScore, level } = useMemo(
    () => computeIdmcResultFromResponses(responses),
    [responses],
  );

  const handleSelect = (value: IdmcLikertValue) => {
    if (selectedValue !== null || submitting || analyzing || completed) return;
    setSelectedValue(value);
    const isReversed = Boolean(current.reversed);
    const score = isReversed ? ((3 - value) as IdmcLikertValue) : value;

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
      if (index < QUESTIONS.length - 1) {
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
    if (responses.length < QUESTIONS.length) {
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
        responses,
        scores: {
          axes: axisPercentages,
          points: axisPoints,
          global_score: Number(globalScore.toFixed(2)),
          level,
          variant: IDMC_VARIANT,
        },
        global_score: Number(globalScore.toFixed(2)),
        level,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await saveIdmcResultats(supabase, payload);
      if (dbError) throw dbError;

      invalidateLearnerSnapshotCache();

      const next = await redirectAfterSalarieAssessmentTest("idmc", "/dashboard/salarie");
      router.push(next);
    } catch (e: unknown) {
      setSavedMessage(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
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
              {completed ? "Test terminé" : `Question ${index + 1} sur ${QUESTIONS.length}`}
            </div>
          </div>

          <div className="text-[11px] font-extrabold uppercase tracking-[0.35em] text-emerald-700">Test IDMC Salarié</div>
          <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Votre cartographie IDMC (travail)</h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600">
            Répondez spontanément. Le but est d'identifier vos leviers de performance (méthodes, organisation, résolution…).
          </p>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">
              Axe {current.axis} — {IDMC_AXES_LABELS[current.axis]}
            </div>
            <div className="mt-3 text-lg font-extrabold leading-snug text-slate-900">{current.text}</div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {IDMC_LIKERT_OPTIONS.map((opt) => {
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
              <div className="mt-2 text-2xl font-black text-slate-900">{Math.round(globalScore)}%</div>
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
              {(Object.keys(IDMC_AXES_LABELS) as IdmcAxisKey[]).map((key) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>
                      {key} — {IDMC_AXES_LABELS[key]}
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
