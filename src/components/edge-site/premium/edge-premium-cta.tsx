"use client";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

export function EdgePremiumCta() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="bg-edge-cream pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-[28px] bg-[#070b1f] px-8 py-16 text-center sm:rounded-[32px] sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute -top-60 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(91,80,255,0.32),transparent_62%)] blur-3xl" />
          </div>
          <div className="relative">
          <h2 className="mx-auto max-w-2xl text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
            Prêt à développer votre potentiel
            <br />
            ou celui de vos équipes ?
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <EdgePremiumButton href={links.contact} variant="white" shape="revolut">
              Nous contacter
            </EdgePremiumButton>
            <EdgePremiumButton href={links.demo} variant="outline-white" shape="revolut">
              Demander une démo
            </EdgePremiumButton>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
