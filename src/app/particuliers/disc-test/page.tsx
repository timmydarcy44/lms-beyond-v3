"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DiscLabel = "D" | "I" | "S" | "C";
type DiscScores = { D: number; I: number; S: number; C: number };

const discQuestions: Array<{ options: Array<{ t: string; v: DiscLabel }> }> = [
  { options: [{ t: "J'agis vite pour des résultats", v: "D" }, { t: "J'enthousiasme les autres", v: "I" }, { t: "Je garde un rythme stable", v: "S" }, { t: "Je vérifie la précision", v: "C" }] },
  { options: [{ t: "J'analyse logiquement", v: "C" }, { t: "Je suis à l'écoute", v: "S" }, { t: "Je vais droit au but", v: "D" }, { t: "Je suis amical", v: "I" }] },
  { options: [{ t: "J'aime la routine claire", v: "S" }, { t: "J'aime être reconnu", v: "I" }, { t: "Je respecte les règles", v: "C" }, { t: "Je prends des risques", v: "D" }] },
  { options: [{ t: "Je perds patience vite", v: "D" }, { t: "Je déteste l'improvisation", v: "C" }, { t: "Je déteste être seul", v: "I" }, { t: "Je cherche l'harmonie", v: "S" }] },
  { options: [{ t: "Je suis loyal/fiable", v: "S" }, { t: "Je décide avec assurance", v: "D" }, { t: "Je vérifie la qualité", v: "C" }, { t: "Je motive par l'optimisme", v: "I" }] },
  { options: [{ t: "J'aime influencer", v: "I" }, { t: "Je suis les protocoles", v: "C" }, { t: "Je contrôle la situation", v: "D" }, { t: "Je suis prévisible", v: "S" }] },
  { options: [{ t: "Je suis patient", v: "S" }, { t: "Je suis compétitif", v: "D" }, { t: "J'aime convaincre", v: "I" }, { t: "J'analyse les preuves", v: "C" }] },
  { options: [{ t: "Je suis réservé", v: "C" }, { t: "Je suis discret", v: "S" }, { t: "Je suis direct", v: "D" }, { t: "J'exprime mes émotions", v: "I" }] },
  { options: [{ t: "Focus Résultats", v: "D" }, { t: "Focus Méthodes", v: "S" }, { t: "Focus Logique", v: "C" }, { t: "Focus Relation", v: "I" }] },
  { options: [{ t: "Je suis charismatique", v: "I" }, { t: "Je suis pointilleux", v: "C" }, { t: "Je suis déterminé", v: "D" }, { t: "Je suis posé", v: "S" }] },
  { options: [{ t: "J'aime collaborer", v: "I" }, { t: "J'aime l'autonomie", v: "D" }, { t: "J'aime la structure", v: "C" }, { t: "J'aime la bienveillance", v: "S" }] },
  { options: [{ t: "Je demande de la rigueur", v: "C" }, { t: "Je fais des compliments", v: "I" }, { t: "Je pousse au dépassement", v: "D" }, { t: "Je sécurise les autres", v: "S" }] },
  { options: [{ t: "Je suis instinctif", v: "I" }, { t: "Je suis systématique", v: "C" }, { t: "Je décide vite", v: "D" }, { t: "Je prends mon temps", v: "S" }] },
  { options: [{ t: "Haine du changement", v: "S" }, { t: "Haine de l'erreur", v: "D" }, { t: "Haine du désordre", v: "C" }, { t: "Haine de l'isolement", v: "I" }] },
  { options: [{ t: "Focus Chiffres", v: "C" }, { t: "Focus Objectifs", v: "D" }, { t: "Focus Plaisir", v: "I" }, { t: "Focus Expérience", v: "S" }] },
  { options: [{ t: "Coéquipier fiable", v: "S" }, { t: "Leader directif", v: "D" }, { t: "Expert technique", v: "C" }, { t: "Animateur né", v: "I" }] },
  { options: [{ t: "Besoin de perfection", v: "C" }, { t: "Besoin de calme", v: "S" }, { t: "Besoin d'exigence", v: "D" }, { t: "Besoin de nouveauté", v: "I" }] },
  { options: [{ t: "Réagit par l'émotion", v: "I" }, { t: "Réagit par la critique", v: "C" }, { t: "Réagit par l'agacement", v: "D" }, { t: "Réagit par le retrait", v: "S" }] },
  { options: [{ t: "Valeur : Patience", v: "S" }, { t: "Valeur : Logique", v: "C" }, { t: "Valeur : Force", v: "D" }, { t: "Valeur : Créativité", v: "I" }] },
  { options: [{ t: "Priorité : Relation", v: "I" }, { t: "Priorité : Temps", v: "D" }, { t: "Priorité : Zéro erreur", v: "C" }, { t: "Priorité : Paix", v: "S" }] },
];

const ResultChart = ({ scores }: { scores: DiscScores }) => {
  const items = [
    { key: "D", label: "Dominance", value: scores.D, color: "#EF4444" },
    { key: "I", label: "Influence", value: scores.I, color: "#F59E0B" },
    { key: "S", label: "Stabilité", value: scores.S, color: "#10B981" },
    { key: "C", label: "Conformité", value: scores.C, color: "#3B82F6" },
  ];
  const maxScore = Math.max(scores.D, scores.I, scores.S, scores.C, 1);

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="text-[12px] text-black/60">Histogramme comportemental</div>
      <div className="mt-4 flex h-40 items-end gap-4">
        {items.map((item) => {
          const height = Math.round((item.value / maxScore) * 140);
          return (
            <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-md"
                style={{
                  height: `${height}px`,
                  background: item.color,
                }}
              />
              <div className="text-[11px] font-semibold text-black/70">{item.label}</div>
              <div className="text-[12px] font-semibold text-black">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function ParticuliersDiscTestInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState<DiscScores>({ D: 0, I: 0, S: 0, C: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [savingResults, setSavingResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [showEmployabilityPrompt, setShowEmployabilityPrompt] = useState(false);
  const [responses, setResponses] = useState<
    Array<{ question_index: number; answer_text: string; answer_label: DiscLabel }>
  >([]);

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

  const current = discQuestions[index];
  const progress = completed
    ? 100
    : Math.round(((index + 1) / discQuestions.length) * 100);
  const imageIndex = Math.floor(index / 5);

  const result = useMemo(() => {
    const entries = Object.entries(scores) as Array<[DiscLabel, number]>;
    const dominant = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "S";
    const label =
      dominant === "D"
        ? "Profil Dominant"
        : dominant === "I"
          ? "Profil Influent"
          : dominant === "S"
            ? "Profil Stable"
            : "Profil Consciencieux";
    return { dominant, label };
  }, [scores]);

  const handleSelect = (value: DiscLabel, optionIndex: number) => {
    if (selectedIndex !== null || submitting || analyzing || completed) return;
    setSelectedIndex(optionIndex);
    const next = { ...scores, [value]: scores[value] + 1 };
    setScores(next);
    const selectedOption = current.options[optionIndex];
    if (selectedOption) {
      setResponses((prev) => [
        ...prev.filter((item) => item.question_index !== index + 1),
        {
          question_index: index + 1,
          answer_text: selectedOption.t,
          answer_label: selectedOption.v,
        },
      ]);
    }

    setTimeout(() => {
      if (index < discQuestions.length - 1) {
        setIndex((prev) => prev + 1);
        setSelectedIndex(null);
        return;
      }

      setSubmitting(true);
      setAnalyzing(true);
      setTimeout(() => {
        setAnalyzing(false);
        setSubmitting(false);
        setCompleted(true);
        setSelectedIndex(null);
      }, 900);
    }, 300);
  };

  const handleSaveResults = async () => {
    if (responses.length === 0) {
      setSavedMessage("Aucune réponse à enregistrer.");
      return;
    }

    setSavingResults(true);
    setSavedMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Supabase non configuré.");
      }
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        setSavedMessage("Connecte-toi pour sauvegarder tes résultats.");
        return;
      }
      const userId = userData.user.id;
      const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      let profileExists = false;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", userId)
          .maybeSingle();
        if (profileRow?.id) {
          profileExists = true;
          break;
        }
        await wait(500);
      }
      if (!profileExists) {
        setSavedMessage("Connecte-toi pour sauvegarder tes résultats.");
        return;
      }

      const payload = {
        profile_id: userId,
        scores,
        final_profile: result.label,
      };
      const { error } = await supabase
        .from("disc_resultats")
        .upsert(payload, { onConflict: "profile_id" });
      if (error) {
        console.error("[disc] disc_resultats error:", error);
        throw new Error(error.message || "Erreur lors de l'enregistrement.");
      }

      const { error: roleError } = await supabase
        .from("profiles")
        .update({ role: "student" })
        .eq("id", userId);
      if (roleError) {
        throw new Error(roleError.message || "Erreur lors de la mise à jour.");
      }

      setShowEmployabilityPrompt(true);
    } catch (error) {
      setSavedMessage(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement."
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
              {completed ? "Test terminé" : `Question ${index + 1} sur 20`}
            </div>
          </div>

          {!completed ? (
            <>
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Lequel vous correspond le mieux ?
              </h1>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {current.options.map((option, optionIndex) => {
                      const selected = selectedIndex === optionIndex;
                      return (
                        <motion.button
                          key={option.t}
                          onClick={() => handleSelect(option.v, optionIndex)}
                          whileHover={{ scale: 1.02 }}
                          disabled={submitting || analyzing}
                          className={`w-full rounded-2xl border px-5 py-5 text-left text-[13px] text-black transition ${
                            selected
                              ? "border-[#F97316] shadow-[0_0_25px_rgba(249,115,22,0.35)]"
                              : "border-black/10 bg-white hover:border-[#F97316]"
                          }`}
                        >
                          {option.t}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {analyzing ? (
                <div className="mt-8 flex items-center gap-2 text-[12px] text-black/60">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                  Analyse de votre profil en cours...
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl">
                Ton profil est prêt.
              </h1>
              <p className="text-[14px] text-black/70">
                Résultat principal : <span className="font-semibold">{result.label}</span>
              </p>
              <ResultChart scores={scores} />
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
            key={imageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -8 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white"
          >
            <img
              src={
                [
                  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=1200&q=80",
                  "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
                ][imageIndex % 4]
              }
              alt="Equipe"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-white/10" />
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {showEmployabilityPrompt && (
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
                Pour améliorer votre employabilité, nous vous offrons votre test de motivation{" "}
                <span className="font-semibold">IDMC</span>.
              </div>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployabilityPrompt(false);
                    setTimeout(() => router.push("/particuliers/test-idmc"), 0);
                  }}
                  className="flex-1 rounded-full border border-black bg-black px-4 py-2 text-xs font-semibold text-white"
                >
                  Faire le test
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployabilityPrompt(false);
                    setTimeout(() => router.push("/dashboard/apprenant"), 0);
                  }}
                  className="flex-1 rounded-full border border-black px-4 py-2 text-xs font-semibold text-black"
                >
                  Ignorer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ParticuliersDiscTestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ParticuliersDiscTestInner />
    </Suspense>
  );
}
