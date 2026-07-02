"use client";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

export function EdgePremiumExpertSection() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="border-y border-black/[0.06] bg-edge-cream py-16 sm:py-20">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-[1.2] tracking-[-0.02em] text-edge-black-deep">
          Vous êtes formateur ou expert métier ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-black/50">
          Rejoignez l&apos;écosystème EDGE et intervenez sur des parcours conçus pour développer
          les compétences qui font la différence.
        </p>
        <div className="mt-8">
          <EdgePremiumButton href={links.expertSignup} variant="primary" showArrow shape="revolut">
            Devenir formateur / expert
          </EdgePremiumButton>
        </div>
      </div>
    </section>
  );
}
