"use client";

import Link from "next/link";

export default function SoftSkillsLandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.9),_rgba(2,6,23,0.95)_55%,_rgba(0,0,0,1))]" />
        <div className="absolute inset-0 opacity-20">
          <div
            className="h-full w-full bg-[url('/images/neurons.jpg')] bg-cover bg-center"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-20">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">15 min</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Analyse IA</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Certifiant</span>
          </div>

          <h1 className="mt-8 text-4xl font-black uppercase tracking-wide sm:text-5xl lg:text-6xl">
            Débloquez votre potentiel : test soft skills
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/70">
            Découvrez votre intelligence émotionnelle, vos forces relationnelles et
            votre style de collaboration. Une analyse claire, utile et actionnable.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-full bg-emerald-400 px-8 py-3 text-sm font-black uppercase text-black shadow-[0_0_40px_rgba(16,185,129,0.35)]"
            >
              Passer le test (29,90€)
            </button>
            <span className="text-xs text-white/50">
              Paiement Stripe à connecter.
            </span>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span>✔ Résultats instantanés</span>
            <span>✔ Top 5 compétences clés</span>
            <span>✔ Restitution IA personnalisée</span>
          </div>

          <div className="mt-16">
            <Link
              href="/dashboard/apprenant"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50 hover:text-white"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
