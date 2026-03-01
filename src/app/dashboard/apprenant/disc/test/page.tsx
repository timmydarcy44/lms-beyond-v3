"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type DiscLabel = "D" | "I" | "S" | "C";

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

export default function DiscTestPage() {
  const supabase = createSupabaseBrowserClient();
  const [index, setIndex] = useState(0);
  const [scores, setScores] = useState({ D: 0, I: 0, S: 0, C: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [responses, setResponses] = useState<
    Array<{ question_index: number; answer_text: string; answer_label: DiscLabel }>
  >([]);

  const current = discQuestions[index];
  const progress = Math.round(((index + 1) / discQuestions.length) * 100);
  const imageIndex = Math.floor(index / 5);

  const calculateProfile = () => ({ ...scores });

  const handleSelect = (value: DiscLabel, optionIndex: number) => {
    if (selectedIndex !== null || submitting || analyzing) return;
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

    setTimeout(async () => {
      if (index < discQuestions.length - 1) {
        setIndex((prev) => prev + 1);
        setSelectedIndex(null);
        return;
      }

      calculateProfile();
      setSubmitting(true);
      setAnalyzing(true);
      try {
        if (!supabase) return;
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user?.id) return;
        const entries = Object.entries(next) as Array<[DiscLabel, number]>;
        const dominant = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? "S";
        const profileLabel =
          dominant === "D"
            ? "Profil Dominant"
            : dominant === "I"
              ? "Profil Influent"
              : dominant === "S"
                ? "Profil Stable"
                : "Profil Consciencieux";

        const payload = {
          profile_id: userData.user.id,
          responses,
          scores: next,
          final_profile: profileLabel,
        };

        const { error } = await supabase.from("disc_resultats").upsert(payload, {
          onConflict: "profile_id",
        });
        if (error) {
          console.error("[disc] disc_resultats error:", error);
          return;
        }
        setTimeout(() => {
          window.location.href = "/dashboard/apprenant/idmc-intro";
        }, 900);
      } finally {
        setSubmitting(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-10 px-6 py-16 font-['Inter'] lg:grid-cols-2">
        <div className="flex flex-col justify-center">
          <div className="mb-8">
            <div className="h-[2px] w-full rounded-full bg-white/10">
              <div className="h-[2px] rounded-full bg-[#FFA500]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-[12px] text-white/50">Question {index + 1} sur 20</div>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
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
                      className={`w-full rounded-2xl border px-5 py-5 text-left text-[13px] text-white transition ${
                        selected
                          ? "border-[#FFA500] shadow-[0_0_25px_rgba(255,165,0,0.45)]"
                          : "border-white/10 bg-white/5 hover:border-[#FFA500]"
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
            <div className="mt-8 flex items-center gap-2 text-[12px] text-white/60">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              Analyse de votre profil en cours...
            </div>
          ) : null}
        </div>

        <div className="hidden items-center justify-center lg:flex">
          <motion.div
            key={imageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ y: -8 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5"
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
            <div className="absolute inset-0 bg-black/30" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
