"use client";

import Link from "next/link";

export default function SoftSkillsIntroPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(17,24,39,0.95),_rgba(3,7,18,0.98)_55%,_rgba(0,0,0,1))]" />
        <div className="absolute inset-0 opacity-20">
          <div
            className="h-full w-full bg-[url('/images/neurons.jpg')] bg-cover bg-center"
            aria-hidden
          />
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">
            <span className="rounded-full border border-white/25 px-3 py-1">2026</span>
            <span className="rounded-full border border-white/25 px-3 py-1">Élite</span>
            <span className="rounded-full border border-white/25 px-3 py-1">★★★★★</span>
          </div>

          <h1 className="mt-8 max-w-4xl text-4xl font-black uppercase tracking-wide sm:text-5xl lg:text-6xl">
            DÉBLOQUEZ VOTRE POTENTIEL : SOFT SKILLS
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/70">
            Une lecture précise de votre intelligence émotionnelle et de vos
            compétences relationnelles. Résultats clairs, actionnables et certifiants.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-full bg-[#E50914] px-8 py-3 text-sm font-black uppercase text-white shadow-[0_0_40px_rgba(229,9,20,0.45)] transition hover:shadow-[0_0_60px_rgba(229,9,20,0.75)]"
            >
              COMMENCER LE TEST
            </button>
            <span className="text-xs text-white/50">Lien Stripe à connecter.</span>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-4 text-sm text-white/50">
            <span>✔ Certification Beyond</span>
            <span>✔ Analyse IA avancée</span>
            <span>✔ Top 5 compétences clés</span>
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
