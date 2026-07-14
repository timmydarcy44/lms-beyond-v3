"use client";

import { HERO_VIDEO_URL, SF_PRO } from "@/lib/clement-lepley/constants";

type ClementLepleyHeroProps = {
  onDevisClick?: () => void;
  onSimulateClick?: () => void;
};

export function ClementLepleyHero({ onDevisClick, onSimulateClick }: ClementLepleyHeroProps) {
  return (
    <section id="accueil" className="relative min-h-screen w-full overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        poster=""
      >
        <source src={HERO_VIDEO_URL} type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10"
        aria-hidden
      />

      <div
        className="relative z-10 flex min-h-screen items-center px-6 pt-24 pb-16 lg:px-16"
        style={{ fontFamily: SF_PRO }}
      >
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Donner vie à votre extérieur
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
            De l&apos;idée à la création, Clément Lepley s&apos;occupe de tout. Vous n&apos;avez
            qu&apos;à profiter de votre extérieur.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={onDevisClick}
              className="rounded-sm bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Demander un devis
            </button>
            <button
              type="button"
              onClick={onSimulateClick}
              className="rounded-sm border border-white/60 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              Simuler mon extérieur
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
