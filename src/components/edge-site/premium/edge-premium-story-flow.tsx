"use client";

import { Award, Briefcase, ChevronDown, GraduationCap, LineChart } from "lucide-react";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

const STEPS = [
  {
    id: "former",
    label: "Former",
    tagline: "Parcours, alternance et formations entreprise",
    description:
      "Des programmes conçus avec les entreprises — pas des cours génériques. Présentiel, distanciel, blended et catalogue sur mesure.",
    icon: GraduationCap,
    accent: "from-[#635BFF]/20 to-transparent",
  },
  {
    id: "evaluer",
    label: "Évaluer",
    tagline: "Mesurer les compétences réelles",
    description:
      "Diagnostics, analytics et IA pour cartographier les écarts, suivre la progression et piloter le ROI formation.",
    icon: LineChart,
    accent: "from-[#3B82F6]/20 to-transparent",
  },
  {
    id: "certifier",
    label: "Certifier",
    tagline: "Open Badges & certifications reconnues",
    description:
      "Valorisez chaque compétence acquise avec des preuves vérifiables — Open Badges IMS Global et parcours certifiants.",
    icon: Award,
    accent: "from-[#10B981]/15 to-transparent",
  },
  {
    id: "recruter",
    label: "Recruter",
    tagline: "Employabilité & matching talents",
    description:
      "Connectez les compétences certifiées aux opportunités : alternance, recrutement et réseau de spécialistes EDGE.",
    icon: Briefcase,
    accent: "from-[#635BFF]/15 to-transparent",
  },
] as const;

export function EdgePremiumStoryFlow() {
  const { links } = useEdgePremiumConfig();

  return (
    <section className="relative overflow-hidden bg-[#050505] py-24 sm:py-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(59,130,246,0.12),transparent_55%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#3B82F6]/80">
          La plateforme EDGE
        </p>
        <h2 className="mt-4 max-w-3xl text-[clamp(1.85rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
          Plus qu&apos;un organisme de formation.
          <br />
          <span className="text-white/45">Une plateforme SaaS de compétences.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/50">
          EDGE ne se contente pas de dispenser des cours. Nous formons, évaluons, certifions et
          connectons les talents — pour des résultats mesurables, pas des promesses.
        </p>

        <div className="mt-16 flex flex-col items-center gap-0 lg:flex-row lg:items-stretch lg:gap-4">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex w-full max-w-md flex-col items-center lg:max-w-none lg:flex-1">
              <article
                className={`relative w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-7 backdrop-blur-sm transition hover:border-white/[0.14] hover:bg-white/[0.05]`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-60`} aria-hidden />
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <step.icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
                    Étape {index + 1}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">{step.label}</h3>
                  <p className="mt-1 text-sm font-medium text-[#635BFF]/90">{step.tagline}</p>
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
