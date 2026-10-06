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
    <section className="relative isolate flex min-h-[100svh] overflow-hidden bg-[#070b1f]">
      <HeroVideo className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-75 sm:object-center" />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,25,0.96)_0%,rgba(6,12,36,0.78)_46%,rgba(4,8,25,0.28)_78%,rgba(4,8,25,0.48)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,25,0.7)_0%,transparent_30%,transparent_62%,rgba(4,8,25,0.82)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_26%_34%,rgba(87,72,255,0.42),transparent_44%),radial-gradient(ellipse_at_76%_68%,rgba(20,99,255,0.24),transparent_46%)] mix-blend-screen"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end px-5 pb-16 pt-36 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
        <div className="max-w-[52rem]">
          <h1 className="text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-white">
            Vos compétences.
            <br />
            Votre prochaine étape.
          </h1>

          <p className="mt-7 max-w-[38rem] text-[clamp(1rem,1.6vw,1.35rem)] leading-[1.45] text-white/75">
            Une école pour construire votre avenir.
            <br />
            Des solutions pour développer vos équipes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <EdgePremiumButton
              href={routes.alternance}
              variant="white"
              className="sm:min-w-[200px]"
            >
              Découvrir l&apos;école
            </EdgePremiumButton>
            <EdgePremiumButton href={links.business} variant="secondary-dark">
              Solutions entreprises
            </EdgePremiumButton>
          </div>

          <p className="mt-4 text-xs leading-snug text-white/55">
            CFA · Ouverture prévue en 2027 —{" "}
            <a
              href={routes.contact}
              className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
            >
              manifester votre intérêt
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
