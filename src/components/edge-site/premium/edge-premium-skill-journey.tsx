"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

const STEPS = [
  {
    step: "01",
    title: "Apprendre",
    body: "Parcours en alternance, formations entreprises ou modules pour particuliers — selon votre projet.",
  },
  {
    step: "02",
    title: "Mettre en pratique",
    body: "Mise en situation réelle : entreprise, missions, projets. La compétence se construit en faisant.",
  },
  {
    step: "03",
    title: "Prouver ses compétences",
    body: "Profil Byound, suivi de progression et Open Badges pour rendre vos acquis visibles et crédibles.",
  },
  {
    step: "04",
    title: "Évoluer",
    body: "Chaque compétence validée ouvre la suite : nouveau rôle, nouvelle formation, nouvelle opportunité.",
  },
] as const;

export function EdgePremiumSkillJourney() {
  const { routes } = useEdgePremiumConfig();

  return (
    <section className="bg-edge-black-deep py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/40">
          Le parcours Byound
        </p>
        <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
          Apprendre. Pratiquer. Prouver. Évoluer.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/50">
          Alternants, entreprises et particuliers partagent la même logique : développer des
          compétences, les ancrer dans le réel, puis les rendre visibles.
        </p>

        <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((item, index) => (
            <li key={item.step} className="relative">
              {index < STEPS.length - 1 ? (
                <div
                  className="pointer-events-none absolute left-[calc(100%-0.5rem)] top-3 hidden h-px w-[calc(100%-2rem)] bg-white/10 lg:block"
                  aria-hidden
                />
              ) : null}
              <p className="text-[11px] font-medium tabular-nums tracking-[0.18em] text-white/35">
                {item.step}
              </p>
              <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{item.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/[0.08] pt-8 text-sm text-white/45">
          <span>Profil & progression — disponible dans l’espace apprenant</span>
          <Link
            href={routes.businessOpenBadges}
            className="inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-white"
          >
            Open Badges
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
