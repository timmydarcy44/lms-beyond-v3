"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function SoftSkillsIntroPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [fadeOutIntro, setFadeOutIntro] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const totalDurationMs = 4200;
    const fadeDurationMs = 500;
    const fadeTimer = setTimeout(() => setFadeOutIntro(true), totalDurationMs - fadeDurationMs);
    const endTimer = setTimeout(() => setShowIntro(false), totalDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, []);

  const handleStartTest = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout-soft-skills", {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error || "Erreur paiement");
      }
      window.location.href = payload.url;
    } catch (error) {
      console.error(error);
      setIsLoading(false);
      alert("Une erreur est survenue. Merci de réessayer.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {showIntro && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white text-black transition-opacity duration-500 ${
            fadeOutIntro ? "opacity-0" : "opacity-100"
          }`}
          aria-live="polite"
        >
          <div className="flex items-center gap-4">
            <span className="h-2.5 w-2.5 rounded-full bg-black animate-bounce" aria-hidden />
            <div className="text-lg font-semibold tracking-wide">
              <span className="intro-word intro-word-1">Prêt</span>
              <span className="intro-word intro-word-2"> pour développer</span>
              <span className="intro-word intro-word-3"> vos soft skills.</span>
            </div>
          </div>
          <style jsx>{`
            .intro-word {
              opacity: 0;
              display: inline-block;
              animation: introFade 1.2s ease-in-out forwards;
            }
            .intro-word-1 {
              animation-delay: 0s;
            }
            .intro-word-2 {
              animation-delay: 1.2s;
            }
            .intro-word-3 {
              animation-delay: 2.4s;
            }
            @keyframes introFade {
              0% {
                opacity: 0;
                transform: translateY(6px);
              }
              20% {
                opacity: 1;
                transform: translateY(0);
              }
              60% {
                opacity: 1;
                transform: translateY(0);
              }
              100% {
                opacity: 0;
                transform: translateY(-4px);
              }
            }
          `}</style>
        </div>
      )}
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
              onClick={handleStartTest}
              disabled={isLoading}
              className="rounded-full bg-[#E50914] px-8 py-3 text-sm font-black uppercase text-white shadow-[0_0_40px_rgba(229,9,20,0.45)] transition hover:shadow-[0_0_60px_rgba(229,9,20,0.75)]"
            >
              {isLoading ? "Redirection..." : "COMMENCER LE TEST"}
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
