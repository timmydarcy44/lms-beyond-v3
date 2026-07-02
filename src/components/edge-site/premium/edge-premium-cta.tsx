"use client";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

export function EdgePremiumCta() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="bg-edge-cream pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden rounded-[28px] bg-edge-black-deep px-8 py-16 text-center sm:rounded-[32px] sm:px-16 sm:py-20">
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
    </section>
  );
}
