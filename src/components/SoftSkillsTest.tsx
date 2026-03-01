"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

type SoftSkill = "Empathie" | "Résilience" | "Leadership" | "Esprit critique" | "Communication" | "Adaptabilité";

type Question = {
  id: string;
  skill: SoftSkill;
  text: string;
};

const questions: Question[] = [
  { id: "q1", skill: "Empathie", text: "Je perçois facilement les émotions des autres." },
  { id: "q2", skill: "Empathie", text: "Je sais adapter mon discours pour mettre quelqu’un à l’aise." },
  { id: "q3", skill: "Empathie", text: "Je me mets rapidement à la place d’un collègue." },
  { id: "q4", skill: "Résilience", text: "Je rebondis rapidement après un échec." },
  { id: "q5", skill: "Résilience", text: "Je garde le cap malgré les obstacles." },
  { id: "q6", skill: "Résilience", text: "Je transforme les difficultés en apprentissages." },
  { id: "q7", skill: "Leadership", text: "Je prends des initiatives pour faire avancer un groupe." },
  { id: "q8", skill: "Leadership", text: "Je sais donner une direction claire." },
  { id: "q9", skill: "Leadership", text: "Je motive facilement les autres." },
  { id: "q10", skill: "Esprit critique", text: "Je vérifie les informations avant d’y croire." },
  { id: "q11", skill: "Esprit critique", text: "Je compare les options avant de décider." },
  { id: "q12", skill: "Esprit critique", text: "Je remets en question les idées reçues." },
  { id: "q13", skill: "Communication", text: "Je sais expliquer clairement une idée complexe." },
  { id: "q14", skill: "Communication", text: "J’adapte mon ton selon l’interlocuteur." },
  { id: "q15", skill: "Adaptabilité", text: "Je m’ajuste vite quand la situation change." },
];

const options = [
  { label: "Pas du tout", value: 1 },
  { label: "Peu", value: 2 },
  { label: "Plutôt", value: 3 },
  { label: "Beaucoup", value: 4 },
];

const images = [
  "https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
];

export function SoftSkillsTest() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selected = answers[currentQuestion.id];
  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);
  const image = images[currentIndex % images.length];

  const scores = useMemo(() => {
    const grouped: Record<SoftSkill, number[]> = {
      Empathie: [],
      Résilience: [],
      Leadership: [],
      "Esprit critique": [],
      Communication: [],
      Adaptabilité: [],
    };
    questions.forEach((q) => {
      grouped[q.skill].push(answers[q.id] || 0);
    });
    return Object.entries(grouped).map(([skill, values]) => ({
      skill,
      score: Math.round((values.reduce((a, b) => a + b, 0) / (values.length * 4)) * 100),
    }));
  }, [answers]);

  const handleSelect = (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) {
      setShowResults(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto grid min-h-screen max-w-5xl place-items-center px-6 py-12">
          <div className="w-full space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <h1 className="text-3xl font-semibold">Résultats</h1>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={scores}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                  <Radar dataKey="score" stroke="#F59E0B" fill="rgba(245,158,11,0.3)" />
                  <Tooltip
                    contentStyle={{ background: "#0B0B0B", border: "1px solid rgba(255,255,255,0.1)" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-[#9CA3AF]">
              Ton profil révèle un leadership collaboratif avec une forte résilience. Tu communiques clairement tout en
              gardant un esprit critique affûté.
            </p>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                "https://beyond-connect.fr",
              )}`}
              className="inline-flex rounded-full bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-black"
            >
              Partager sur LinkedIn
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden items-center justify-center bg-black lg:flex">
          <motion.div
            key={image}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-[80%] w-[80%] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_0_60px_rgba(245,158,11,0.2)]"
          >
            <img src={image} alt="Ambiance" className="h-full w-full object-cover" />
          </motion.div>
        </div>

        <div className="flex min-h-screen flex-col justify-between px-8 py-12">
          <div>
            <div className="h-1 w-full rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-[#F59E0B]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-sm text-[#9CA3AF]">
              Question {currentIndex + 1} sur {questions.length}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="mt-10 space-y-6"
              >
                <h1 className="text-3xl font-semibold">{currentQuestion.text}</h1>
              </motion.div>
            </AnimatePresence>

            <div className="mt-10 grid gap-4">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleSelect(opt.value)}
                  className={`rounded-2xl border px-6 py-5 text-left text-sm font-medium transition ${
                    selected === opt.value
                      ? "border-[#F59E0B] bg-[#F59E0B]/20 text-white"
                      : "border-white/10 bg-white/5 hover:border-[#F59E0B] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end">
            {selected ? (
              <button
                onClick={handleNext}
                className="rounded-full bg-[#F59E0B] px-6 py-3 text-sm font-semibold text-black"
              >
                Suivant
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
