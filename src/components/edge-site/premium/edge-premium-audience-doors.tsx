"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

export function EdgePremiumAudienceDoors() {
  const { routes, links } = useEdgePremiumConfig();

  const universes = [
    {
      eyebrow: "Byound School",
      title: "Construisez votre avenir.",
      description: "École, alternance et reconversion à Caen.",
      cta: "Explorer School",
      href: routes.alternance,
      image: EDGE_PREMIUM_IMAGES.apprenants,
      imagePosition: "center",
    },
    {
      eyebrow: "Byound Business",
      title: "Faites progresser vos équipes.",
      description: "Formations, diagnostics et suivi des compétences.",
      cta: "Explorer Business",
      href: links.business,
      image: EDGE_PREMIUM_IMAGES.business,
      imagePosition: "center 35%",
    },
  ] as const;

  return (
    <section className="bg-[#f7f7f5] py-16 text-edge-black-deep sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <h2 className="max-w-4xl text-[clamp(2.25rem,5vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.05em]">
          Deux univers. Une même ambition.
        </h2>

        <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-4">
          {universes.map((universe) => (
            <article
              key={universe.title}
              className="group border-black/10 lg:first:border-r lg:first:pr-4 lg:last:pl-4"
            >
              <div className="flex min-h-[225px] flex-col px-1 pb-8 sm:min-h-[255px] sm:px-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-black/45">
                  {universe.eyebrow}
                </p>
                <h3 className="mt-7 max-w-[30rem] text-[clamp(2rem,4vw,3.4rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
                  {universe.title}
                </h3>
                <p className="mt-4 text-base text-black/55">{universe.description}</p>
                <Link
                  href={universe.href}
                  className="mt-auto inline-flex w-fit items-center gap-2 border-b border-black/30 pb-1 text-sm font-medium transition-opacity hover:opacity-60"
                >
                  {universe.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div
                className="relative aspect-[4/3] overflow-hidden bg-[#070b1f] bg-cover transition-transform duration-500 group-hover:scale-[0.995]"
                style={{
                  backgroundImage: `linear-gradient(135deg, rgba(7,11,31,.1), rgba(43,34,145,.3)), url("${universe.image}")`,
                  backgroundPosition: universe.imagePosition,
                }}
                role="img"
                aria-label={universe.description}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
