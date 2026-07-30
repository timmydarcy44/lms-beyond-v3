"use client";

import Image from "next/image";

import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

import {
  EDGE_PREMIUM_AVATARS,
  EDGE_PREMIUM_IMAGES,
} from "@/lib/edge-site/premium-constants";

export function EdgePremiumHero() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="relative min-h-[min(92svh,880px)] overflow-hidden bg-edge-black-deep">
      <div className="absolute inset-0 lg:left-[32%]" aria-hidden>
        <Image
          src={EDGE_PREMIUM_IMAGES.hero}
          alt="Professionnels en formation et développement de compétences"
          fill
          className="object-cover object-center lg:object-right-top"
          sizes="100vw"
          priority
          unoptimized
        />
      </div>

      <div
        className="absolute inset-0 bg-gradient-to-r from-edge-black-deep via-edge-black-deep/90 to-edge-black-deep/25 lg:to-edge-black-deep/15"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(255,255,255,0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[min(92svh,880px)] max-w-7xl items-center px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pb-24 lg:pt-32">
        <div className="max-w-xl lg:max-w-2xl">
          <h1 className="text-[clamp(2.5rem,5.5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
            Développons
            <br />
            les compétences
            <br />
            qui feront la
            <br />
            différence demain.
          </h1>

          <p className="mt-8 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">
            Identifier les besoins. Former. Valoriser les compétences.
            Un process clair pour faire évoluer la formation professionnelle.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <EdgePremiumButton href={links.formations} variant="white" showArrow className="sm:min-w-[220px]">
              Trouver une formation
            </EdgePremiumButton>
            <EdgePremiumButton href={links.conseiller} variant="secondary-dark">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2">
              {EDGE_PREMIUM_AVATARS.map((src, i) => (
                <div
                  key={src}
                  className="relative h-9 w-9 overflow-hidden rounded-full border-2 border-edge-black-deep"
                  style={{ zIndex: EDGE_PREMIUM_AVATARS.length - i }}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="36px" />
                </div>
              ))}
            </div>
            <p className="text-sm leading-snug text-white/50">
              <span className="font-medium text-white/80">+25 000 personnes formées</span>
              <br />
              500+ organisations nous font confiance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
