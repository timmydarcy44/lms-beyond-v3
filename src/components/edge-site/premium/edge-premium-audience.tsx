"use client";

import Image from "next/image";
import { ArrowRight, Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

export function EdgePremiumAudience() {
  const { links } = useEdgePremiumConfig();

  const cards = [
    {
      title: "Apprenants",
      description:
        "Trouvez votre formation, développez vos compétences et construisez votre avenir.",
      cta: "Découvrir l'univers apprenants",
      href: links.apprenants,
      image: EDGE_PREMIUM_IMAGES.apprenants,
      alt: "Jeune apprenante avec un sac à dos",
      icon: GraduationCap,
      gradient: "from-[#1e1648]/75 via-[#0e0c18]/88 to-[#050505]",
    },
    {
      title: "Business",
      description: "Formez vos équipes, développez les compétences et pilotez la performance.",
      cta: "Découvrir l'univers business",
      href: links.business,
      image: EDGE_PREMIUM_IMAGES.business,
      alt: "Dirigeant ou manager en entreprise",
      icon: Briefcase,
      gradient: "from-[#0d1a3a]/75 via-[#080c16]/88 to-[#050505]",
    },
  ] as const;

  return (
    <section className="bg-edge-black-deep py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
          POUR QUI ?
        </p>
        <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
          Choisissez votre univers
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className="group relative isolate min-h-[360px] overflow-hidden rounded-[28px] border border-white/[0.07] transition-[border-color,box-shadow] duration-300 hover:border-white/[0.14] hover:shadow-[0_16px_48px_rgba(99,91,255,0.08)] sm:min-h-[400px]"
            >
              <div className={cn("absolute inset-0 rounded-[28px] bg-gradient-to-br", card.gradient)} aria-hidden />

              <div className="absolute inset-y-0 right-0 w-[58%] overflow-hidden rounded-r-[28px] sm:w-[52%]">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 58vw, 480px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 shadow-[inset_0_0_60px_rgba(99,91,255,0.06)] transition-opacity duration-300 group-hover:opacity-100" aria-hidden />

              <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between p-8 sm:min-h-[400px] sm:p-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white">
                  <card.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>

                <div className="max-w-[54%] sm:max-w-[50%]">
                  <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{card.description}</p>
                  <Link
                    href={card.href}
                    className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-edge-black-deep transition-colors hover:bg-white/92"
                  >
                    {card.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
