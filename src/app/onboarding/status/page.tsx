"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export default function OnboardingStatus() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [buildDone, setBuildDone] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(2), 2000);
    const timer2 = setTimeout(() => setStep(3), 4500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    const t = setTimeout(() => setBuildDone(true), 2000);
    return () => clearTimeout(t);
  }, [step]);

  const [answers, setAnswers] = useState({ enjeu: "", besoins: "", timing: "" });

  const isFormComplete = Boolean(answers.enjeu && answers.timing);

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#020617] px-6 py-20 font-sans text-white">
      <div className="relative mb-12 w-full max-w-3xl overflow-hidden rounded-[40px] border border-white/10 bg-white/5 p-10">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Sparkles size={80} className="text-indigo-500" aria-hidden />
        </div>

        <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold">
          <Sparkles className="text-indigo-400" size={24} aria-hidden />
          Configuration de votre intelligence RH
        </h2>

        <div className="space-y-6">
          <StatusItem
            label="Invitations envoyées avec succès"
            status={step >= 1 ? "done" : "waiting"}
            sub="Vos collaborateurs ont reçu leur accès."
          />
          <StatusItem
            label="Initialisation des tests et parcours"
            status={step === 2 ? "loading" : step > 2 ? "done" : "waiting"}
            sub="Préparation des tests DISC et Soft Skills."
          />
          <StatusItem
            label="Construction de votre dashboard dynamique"
            status={buildDone ? "done" : step === 3 ? "loading" : "waiting"}
            sub="L'IA prépare vos indicateurs de performance."
          />
        </div>
      </div>

      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h3 className="mb-2 text-xl font-bold">Affinez votre analyse</h3>
          <p className="text-sm text-gray-500">
            Pendant que nous préparons tout, aidez-nous à personnaliser vos insights.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Quel est votre principal enjeu actuel ?
            </label>
            <select
              value={answers.enjeu}
              className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition-all focus:border-indigo-500"
              onChange={(e) => setAnswers({ ...answers, enjeu: e.target.value })}
            >
              <option value="">Sélectionnez une option...</option>
              <option value="retention">Réduire le turnover / Fidélisation</option>
              <option value="recrutement">Optimiser le matching des recrues</option>
              <option value="conflits">Résoudre des tensions d&apos;équipe</option>
              <option value="performance">Booster la productivité individuelle</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Y a-t-il des collaborateurs avec des besoins particuliers ? (DYS, RQTH...)
            </label>
            <textarea
              value={answers.besoins}
              placeholder="Ex: 2 profils DYS identifiés..."
              className="h-24 w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none transition-all focus:border-indigo-500"
              onChange={(e) => setAnswers({ ...answers, besoins: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Dans combien de temps voulez-vous des résultats actionnables ?
            </label>
            <div className="grid grid-cols-3 gap-4">
              {["7 jours", "14 jours", "30 jours"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAnswers({ ...answers, timing: t })}
                  className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                    answers.timing === t
                      ? "border-indigo-500 bg-indigo-600"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="max-w-md text-center text-xs text-gray-600">
            À partir des résultats, Beyond va construire les profils et proposer des formations et accompagnements adaptés à
            chaque collaborateur.
          </p>

          <button
            type="button"
            onClick={() => router.push("/dashboard/entreprise")}
            disabled={!isFormComplete || step < 3}
            className={`flex items-center gap-3 rounded-2xl px-12 py-4 font-bold transition-all ${
              isFormComplete && step === 3
                ? "bg-indigo-600 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500"
                : "cursor-not-allowed bg-white/5 text-gray-600 opacity-50"
            }`}
          >
            Accéder à mon Dashboard <ArrowRight size={20} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  status,
  sub,
}: {
  label: string;
  status: "done" | "loading" | "waiting";
  sub: string;
}) {
  return (
    <div
      className={`flex items-start gap-4 transition-all duration-500 ${status === "waiting" ? "opacity-30" : "opacity-100"}`}
    >
      <div className="mt-1">
        {status === "done" && <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden />}
        {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-indigo-400" aria-hidden />}
        {status === "waiting" && <div className="h-6 w-6 rounded-full border-2 border-white/10" />}
      </div>
      <div>
        <h4 className="text-sm font-bold">{label}</h4>
        <p className="text-xs text-gray-500">{sub}</p>
      </div>
    </div>
  );
}
