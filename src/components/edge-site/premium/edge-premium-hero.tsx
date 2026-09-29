"use client";

import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

const HERO_VIDEO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/Byound/Header/video%20hero%20section.mp4";

function HeroVideo({ className }: { className?: string }) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
    >
      <source src={HERO_VIDEO_URL} type="video/mp4" />
    </video>
  );
}

export function EdgePremiumHero() {
  const { links, routes } = useEdgePremiumConfig();

  return (
    <section className="relative isolate h-[100svh] min-h-[100svh] overflow-hidden bg-edge-black-deep">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 right-0 top-16 hidden overflow-hidden lg:top-[6.25rem] lg:left-auto lg:block lg:w-[62%] xl:w-[58%]"
        aria-hidden
      >
        <HeroVideo className="absolute inset-0 h-full w-full object-cover object-center" />
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 top-16 hidden bg-gradient-to-r from-edge-black-deep via-edge-black-deep/90 to-transparent lg:top-[6.25rem] lg:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-16 hidden w-[48%] bg-gradient-to-r from-edge-black-deep via-edge-black-deep/75 to-transparent lg:top-[6.25rem] lg:block"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-5 pb-0 pt-28 sm:px-8 lg:justify-center lg:px-10 lg:pb-20 lg:pt-36">
        <div className="max-w-[22rem] shrink-0 sm:max-w-lg lg:max-w-[32rem] xl:max-w-[36rem]">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-white/45 sm:text-xs">
            Alternance · Formation · Compétences
          </p>

          <h1 className="mt-7 text-[clamp(2.4rem,7.5vw,4.75rem)] font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:mt-8 lg:mt-10">
            Vos compétences
            <br />
            vous emmènent
            <br />
            plus loin.
          </h1>

          <p className="mt-7 max-w-[28rem] text-[15px] leading-relaxed text-white/50 sm:mt-9 sm:text-base">
            Trouvez votre voie en alternance, développez les compétences de vos équipes ou
            formez-vous pour votre prochain projet. Avec Byound, chaque compétence acquise peut
            ouvrir une nouvelle opportunité.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:mt-11 sm:flex-row sm:items-center sm:gap-4">
            <EdgePremiumButton
              href={routes.alternance}
              variant="white"
              showArrow
              className="sm:min-w-[220px]"
            >
              Découvrir l&apos;alternance
            </EdgePremiumButton>
            <EdgePremiumButton href={links.business} variant="secondary-dark">
              Découvrir Byound Business
            </EdgePremiumButton>
          </div>

          <p className="mt-4 text-[13px] leading-snug text-white/40">
            CFA : ouverture prévue à la rentrée 2027 —{" "}
            <a
              href={routes.contact}
              className="underline decoration-white/25 underline-offset-2 transition-colors hover:text-white/70 hover:decoration-white/50"
            >
              manifester votre intérêt
            </a>
            .
          </p>
        </div>

        <div className="relative mt-10 -mx-5 min-h-0 flex-1 overflow-hidden sm:-mx-8 sm:mt-12 lg:hidden">
          <HeroVideo className="absolute inset-0 h-full w-full object-cover object-[72%_center] sm:object-[68%_center]" />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-edge-black-deep to-transparent"
            aria-hidden
          />
        </div>
      </div>
    </section>
  );
}
