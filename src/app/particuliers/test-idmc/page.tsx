"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  computeIdmcResultFromResponses,
  IDMC_AXES_LABELS,
  IDMC_LIKERT_OPTIONS,
  IDMC_QUESTIONS,
  resolveIdmcVariantFromTypeProfil,
  type IdmcAxisKey,
  type IdmcLikertValue,
  type IdmcResponse,
  type IdmcVariant,
} from "@/lib/idmc/idmc-questions";
import { saveIdmcResultats } from "@/lib/idmc/idmc-save";

const ResultChart = ({
  scores,
  labels,
}: {
  scores: Record<IdmcAxisKey, number>;
  labels: Record<IdmcAxisKey, string>;
}) => {
  const items = (Object.keys(labels) as IdmcAxisKey[]).map((key) => ({
    key,
    label: labels[key],
    value: scores[key],
  }));

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="text-[12px] text-black/60">Histogramme des axes</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.key} className="space-y-1">
            <div className="text-[12px] font-semibold text-black/70">
              {item.label} — {item.value}%
            </div>
            <div className="h-2 w-full rounded-full bg-black/10">
              <div
                className="h-2 rounded-full bg-black"
                style={{ width: `${item.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function ParticuliersIdmcTestInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [variant, setVariant] = useState<IdmcVariant | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState<IdmcLikertValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [responses, setResponses] = useState<IdmcResponse[]>([]);

  useEffect(() => {
    const paramId = searchParams.get("profileId");
    if (paramId) {
      setProfileId(paramId);
      try {
        sessionStorage.setItem("particulierProfileId", paramId);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const storedId = sessionStorage.getItem("particulierProfileId");
      if (storedId) setProfileId(storedId);
    } catch {
      // ignore
    }
  }, [searchParams]);

  useEffect(() => {
    const loadVariant = async () => {
      if (!profileId) return;
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("profiles")
        .select("type_profil")
        .eq("id", profileId)
        .maybeSingle();
      setVariant(resolveIdmcVariantFromTypeProfil(data?.type_profil));
    };
    void loadVariant();
  }, [profileId]);

  const questions = variant ? IDMC_QUESTIONS[variant] : [];
  const current = questions[index];
  const progress = completed
    ? 100
    : questions.length
      ? Math.round(((index + 1) / questions.length) * 100)
      : 0;

  const { axisPercentages, axisPoints, globalScore, level } = useMemo(
    () => computeIdmcResultFromResponses(responses),
    [responses],
  );

  const handleSelect = (value: IdmcLikertValue) => {
    if (!current || !variant || selectedValue !== null || submitting || analyzing || completed) return;
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
      if (index < questions.length - 1) {
        setIndex((prev) => prev + 1);
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
    if (!variant || responses.length < questions.length) {
      setSavedMessage("Merci de répondre à toutes les questions.");
      return;
    }

    setSavingResults(true);
    setSavedMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase non configuré.");
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        alert("Erreur de session. Reconnecte-toi.");
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
          variant,
        },
        global_score: Number(globalScore.toFixed(2)),
        level,
        updated_at: new Date().toISOString(),
      };

      if (payload.profile_id !== user.id) {
        setSavedMessage("Erreur : identifiant de session invalide.");
        return;
      }

      const { error: dbError } = await saveIdmcResultats(supabase, payload);

      if (dbError) {
        console.error("[idmc] idmc_resultats error:", dbError);
        alert(`Erreur lors de l'enregistrement IDMC: ${dbError.message}`);
        return;
      }

      window.location.href = "/dashboard/apprenant";
    } catch (error) {
      setSavedMessage(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement.",
      );
    } finally {
      setSavingResults(false);
    }
  };

  if (!profileId) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center font-['Inter']">
          <h1 className="text-2xl font-semibold">Session expirée, merci de recommencer votre inscription</h1>
          <a
            href="/particuliers"
            className="mt-4 rounded-full border border-black px-5 py-2 text-sm font-semibold text-black"
          >
            Retour à l&apos;inscription
          </a>
        </div>
      </div>
    );
  }

  if (!variant || !current) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center font-['Inter']">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
          <p className="mt-4 text-sm text-black/60">Chargement du test IDMC…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-10 px-6 py-16 font-['Inter'] lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="h-[2px] w-full rounded-full bg-black/10">
              <div className="h-[2px] rounded-full bg-[#F97316]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-[12px] text-black/50">
              {completed ? "Test terminé" : `Question ${index + 1} sur ${questions.length}`}
            </div>
          </div>

          {!completed ? (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Test IDMC
              </h1>
              <p className="mt-2 text-[14px] text-black/70">{current.text}</p>

              <div className="mt-6 flex flex-row gap-3">
                {IDMC_LIKERT_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    disabled={submitting || analyzing}
                    className={`flex-1 rounded-2xl border px-3 py-3 text-center text-[12px] font-medium text-black transition ${
                      selectedValue === option.value
                        ? "border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.35)]"
                        : "border-black/10 bg-white hover:border-[#F97316]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {analyzing ? (
                <div className="mt-8 flex items-center gap-2 text-[12px] text-black/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                  Analyse en cours...
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Ton profil IDMC est prêt.
              </h1>
              <p className="text-[14px] text-black/70">
                Score global IDMC :{" "}
                <span className="font-semibold">{Number(globalScore.toFixed(1))}%</span>
              </p>
              <p className="text-[14px] text-black/70">
                Niveau : <span className="font-semibold">{level}</span>
              </p>
              <ResultChart scores={axisPercentages} labels={IDMC_AXES_LABELS} />
              <div className="space-y-1 text-[12px] text-black/60">
                {(Object.keys(IDMC_AXES_LABELS) as IdmcAxisKey[]).map((key) => (
                  <div key={key}>
                    {IDMC_AXES_LABELS[key]} : {axisPercentages[key]}%
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveResults}
                disabled={savingResults}
                className="w-full rounded-full border border-black bg-white px-6 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingResults ? "Enregistrement..." : "Enregistrer mes résultats"}
              </button>
              {savedMessage ? (
                <div className="text-[12px] text-black/60">{savedMessage}</div>
              ) : null}
            </div>
          )}
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -8 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white"
          >
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
              alt="Equipe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-white/10" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/10" />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md rounded-2xl border border-black/10 bg-white/80 p-6 shadow-2xl backdrop-blur-md"
            >
              <div className="text-center text-[14px] text-black">
                Profil complet ! Découvrez votre dashboard carrière.
              </div>
              <div className="mt-5 flex">
                <button
                  type="button"
                  onClick={() => {
                    setShowToast(false);
                    setTimeout(() => router.push("/dashboard/apprenant"), 0);
                  }}
                  className="w-full rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold text-white"
                >
                  Accéder au Dashboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ParticuliersIdmcTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ParticuliersIdmcTestInner />
    </Suspense>
  );
}
