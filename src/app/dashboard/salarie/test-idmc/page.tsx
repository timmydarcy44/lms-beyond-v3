"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { AssessmentChoice, AssessmentTestFrame } from "@/components/salarie/assessment-test-frame";

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
        setSavedMessage("Erreur de session. Reconnectez-vous.");
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
      void fetch("/api/dashboard/salarie/test-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: "idmc" }),
      });

      const next = await redirectAfterSalarieAssessmentTest("idmc", "/dashboard/salarie");
      router.push(next);
    } catch (e: unknown) {
      setSavedMessage(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSavingResults(false);
    }
  };

  const quit = (
    <button
      type="button"
      onClick={() => router.push("/dashboard/salarie")}
      className="text-sm font-medium text-[#8A8F98]"
    >
      Quitter
    </button>
  );

  if (completed) {
    return (
      <AssessmentTestFrame
        stepLabel="Test terminé"
        progress={100}
        kicker="IDMC"
        title="Votre résultat"
        footer={
          <>
            {quit}
            <button
              type="button"
              disabled={savingResults}
              onClick={() => void handleSaveResults()}
              className="rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingResults ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <p className="text-[56px] font-extrabold leading-none tracking-[-0.05em]">{Math.round(globalScore)}%</p>
        <p className="mt-2 text-[16px] text-[#5C6370]">{level}</p>
        <div className="mt-8 space-y-4">
          {(Object.keys(IDMC_AXES_LABELS) as IdmcAxisKey[]).map((key) => (
            <div key={key}>
              <div className="flex items-baseline justify-between gap-3 text-[14px]">
                <span className="text-[#3A3D45]">{IDMC_AXES_LABELS[key]}</span>
                <span className="font-semibold">{axisPercentages[key]}%</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#E8E6E1]">
                <div className="h-full rounded-full bg-[#111111]" style={{ width: `${axisPercentages[key]}%` }} />
              </div>
            </div>
          ))}
        </div>
        {savedMessage ? <p className="mt-6 text-sm text-[#9B2335]">{savedMessage}</p> : null}
      </AssessmentTestFrame>
    );
  }

  return (
    <AssessmentTestFrame
      stepLabel={analyzing ? "Analyse…" : `Question ${index + 1} sur ${QUESTIONS.length}`}
      progress={progress}
      kicker={IDMC_AXES_LABELS[current.axis]}
      title={current.text}
      footer={quit}
    >
      <div className="flex flex-col gap-3">
        {IDMC_LIKERT_OPTIONS.map((opt) => (
          <AssessmentChoice
            key={opt.value}
            label={opt.label}
            selected={selectedValue === opt.value}
            disabled={selectedValue !== null || submitting || analyzing}
            onClick={() => handleSelect(opt.value)}
          />
        ))}
      </div>
    </AssessmentTestFrame>
  );
}

export default function SalarieIdmcTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <TestInner />
    </Suspense>
  );
}
