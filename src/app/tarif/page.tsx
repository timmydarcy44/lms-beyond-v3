"use client";

import React, { useState } from "react";
import { ArrowRight, Check, Info } from "lucide-react";

type FeatureRow = { text: string; included: boolean };

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [collabs, setCollabs] = useState(25);

  const calculatePrice = (basePricePerSeat: number) => {
    const annualDiscount = isAnnual ? 0.8 : 1;
    return Math.round(basePricePerSeat * collabs * annualDiscount);
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-white selection:bg-indigo-500/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute -right-[10%] top-[20%] h-[30%] w-[30%] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Une tarification qui{" "}
            <span className="text-indigo-500">grandit avec vous.</span>
          </h1>
          <p className="text-xl text-gray-400">Choisissez vos fonctionnalités. Ajustez votre volume.</p>
        </div>

        <div className="mb-16 flex flex-col items-center justify-between gap-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl md:flex-row">
          <div className="w-full flex-1">
            <label className="mb-4 block text-sm font-bold uppercase tracking-widest text-gray-500">
              Nombre de collaborateurs : <span className="ml-2 text-2xl text-white">{collabs}</span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={collabs}
              onChange={(e) => setCollabs(parseInt(e.target.value, 10))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-700 accent-indigo-500"
              aria-valuemin={5}
              aria-valuemax={100}
              aria-valuenow={collabs}
              aria-label="Nombre de collaborateurs"
            />
          </div>

          <div className="flex shrink-0 rounded-xl border border-white/10 bg-[#0f172a] p-1">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-lg px-6 py-2 text-sm transition-all ${!isAnnual ? "bg-indigo-600 shadow-lg text-white" : "text-gray-400 hover:text-white"}`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm transition-all ${isAnnual ? "bg-indigo-600 shadow-lg text-white" : "text-gray-400 hover:text-white"}`}
            >
              Annuel{" "}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="mb-24 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <PricingCard
            name="Essentiel"
            tagline="L'essentiel pour piloter."
            price={calculatePrice(10)}
            features={[
              { text: "Dashboard manager", included: true },
              { text: "Tests DISC + Soft Skills", included: true },
              { text: "Micro-learning illimité", included: true },
              { text: "Signaux faibles (Hebdo)", included: true },
              { text: "Analyses IA Oracle", included: false },
            ]}
          />

          <PricingCard
            name="Croissance"
            tagline="Le choix des équipes performantes."
            price={calculatePrice(18)}
            highlighted
            features={[
              { text: "Tout le plan Essentiel", included: true },
              { text: "Analyses IA Oracle", included: true },
              { text: "Indice de rétention", included: true },
              { text: "Radar comparatif", included: true },
              { text: "Accompagnement expert", included: false },
            ]}
          />

          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl">
            <div>
              <h3 className="mb-2 text-2xl font-bold">Accompagné</h3>
              <p className="mb-8 text-sm text-gray-400">
                Pour une transformation profonde guidée par l&apos;humain.
              </p>
              <div className="mb-8 text-4xl font-bold">Sur Devis</div>
              <ul className="space-y-4 text-sm text-gray-300">
                <li className="flex items-center gap-3">
                  <Check size={16} className="shrink-0 text-indigo-500" /> Restitutions par experts
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} className="shrink-0 text-indigo-500" /> Coaching trimestriel
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} className="shrink-0 text-indigo-500" /> Plan de dév. co-construit
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="mt-12 w-full rounded-2xl border border-white/20 py-4 font-bold transition-all hover:bg-white/10"
            >
              Parler à un expert
            </button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-16">
          <h2 className="mb-12 flex items-center gap-3 text-2xl font-bold">
            <Info className="h-7 w-7 shrink-0 text-indigo-500" aria-hidden />
            Comparer les modes
          </h2>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-bold text-indigo-400">Mode Autonome (SaaS)</h4>
              <p className="text-sm leading-relaxed text-gray-400">
                Vous gérez votre diagnostic et vos plans de progrès via la plateforme. Idéal pour les managers
                qui veulent des données temps réel et des outils de micro-coaching en libre-service.{" "}
                <strong>Micro-learnings inclus.</strong>
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-purple-400">Mode Accompagné (Mission)</h4>
              <p className="text-sm leading-relaxed text-gray-400">
                Nos experts interviennent pour analyser les données avec vous, animer des ateliers et coacher vos
                équipes. C&apos;est la garantie d&apos;un changement de culture durable.{" "}
                <strong>Formations certifiantes incluses.</strong>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

type PricingCardProps = {
  name: string;
  tagline: string;
  price: number;
  features: FeatureRow[];
  highlighted?: boolean;
};

function PricingCard({ name, tagline, price, features, highlighted = false }: PricingCardProps) {
  return (
    <div
      className={`rounded-3xl border p-10 transition-all duration-300 ${
        highlighted
          ? "border-indigo-500 bg-indigo-600/10 shadow-[0_0_50px_rgba(79,70,229,0.15)] backdrop-blur-xl lg:scale-105"
          : "border-white/10 bg-white/5 backdrop-blur-xl"
      }`}
    >
      <h3 className="mb-2 text-2xl font-bold">{name}</h3>
      <p className="mb-8 text-sm text-gray-500">{tagline}</p>
      <div className="mb-10 flex items-baseline gap-2">
        <span className="text-5xl font-bold">{price}€</span>
        <span className="text-gray-500">/ mois</span>
      </div>
      <ul className="mb-12 space-y-4">
        {features.map((f, i) => (
          <li
            key={`${f.text}-${i}`}
            className={`flex items-center gap-3 text-sm ${f.included ? "text-gray-200" : "text-gray-600 line-through"}`}
          >
            <Check size={16} className={`shrink-0 ${f.included ? "text-indigo-500" : "text-gray-700"}`} />{" "}
            {f.text}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold transition-all ${
          highlighted ? "bg-indigo-600 text-white hover:bg-indigo-500" : "bg-white/10 hover:bg-white/20"
        }`}
      >
        Choisir ce plan <ArrowRight size={18} aria-hidden />
      </button>
    </div>
  );
}
