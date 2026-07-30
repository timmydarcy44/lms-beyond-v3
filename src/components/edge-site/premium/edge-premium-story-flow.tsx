"use client";

import { Award, ChevronDown, ClipboardList, GraduationCap } from "lucide-react";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

const STEPS = [
  {
    id: "identifications",
    label: "Identifications",
    tagline: "Cartographier les compétences réelles",
    description:
      "Diagnostics et analyses pour identifier les forces, les écarts et les priorités de développement — avant toute formation.",
    icon: ClipboardList,
  },
  {
    id: "formations",
    label: "Formations",
    tagline: "Développer ce qui compte vraiment",
    description:
      "Des parcours conçus avec les métiers : ciblés, concrets et orientés résultats — pas des catalogues génériques.",
    icon: GraduationCap,
  },
  {
    id: "valorisations",
    label: "Valorisations des compétences",
    tagline: "Rendre les acquis visibles et crédibles",
    description:
      "Open Badges, certifications et preuves vérifiables pour valoriser chaque compétence acquise auprès des employeurs.",
    icon: Award,
  },
] as const;

export function EdgePremiumStoryFlow() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="relative overflow-hidden bg-[#050505] py-24 sm:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
          Notre process
        </p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
          Parce que les organismes de formation doivent évoluer.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/50">
          Identifier. Former. Valoriser. Un process clair pour transformer les compétences en
          résultats mesurables — pas des intentions.
        </p>

        <div className="mt-16 flex flex-col items-center gap-0 lg:flex-row lg:items-stretch lg:gap-5">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex w-full max-w-md flex-col items-center lg:max-w-none lg:flex-1">
              <article className="relative w-full overflow-hidden rounded-[28px] border border-white/[0.1] bg-white/[0.04] p-7 transition hover:border-white/[0.18] hover:bg-white/[0.06]">
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                      <step.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Étape {index + 1}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">{step.label}</h3>
                  <p className="mt-1 text-sm font-medium text-white/70">{step.tagline}</p>
                  <p className="mt-4 text-sm leading-relaxed text-white/50">{step.description}</p>
                </div>
              </article>
              {index < STEPS.length - 1 ? (
                <ChevronDown className="my-4 h-6 w-6 shrink-0 text-white/20 lg:hidden" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <EdgePremiumButton href={links.business} variant="white" shape="revolut">
            Découvrir EDGE Business
          </EdgePremiumButton>
          <EdgePremiumButton href={links.formations} variant="outline-white" shape="revolut">
            Voir les formations
          </EdgePremiumButton>
        </div>
      </div>
    </section>
  );
}
