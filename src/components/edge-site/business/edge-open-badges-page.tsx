import { headers } from "next/headers";
import { Award, BadgeCheck, Share2, Shield, Sparkles, Workflow } from "lucide-react";

import { EdgeOpenBadgesHero } from "@/components/edge-site/business/edge-open-badges-hero";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";

const WHY_ITEMS = [
  {
    icon: Sparkles,
    title: "Valoriser les compétences invisibles",
    description:
      "Les savoir-faire acquis sur le terrain ou en formation méritent d'être reconnus. L'open badge rend ces acquis lisibles et partageables.",
  },
  {
    icon: Shield,
    title: "Certifier avec confiance",
    description:
      "Chaque badge est vérifiable, horodaté et rattaché à un critère précis. Vos apprenants et collaborateurs disposent d'une preuve crédible de leurs acquis.",
  },
  {
    icon: Share2,
    title: "Amplifier votre marque employeur",
    description:
      "Les badges partagés sur LinkedIn, les CV ou les portfolios renforcent la visibilité de vos parcours et de votre expertise.",
  },
];

const HOW_STEPS = [
  {
    step: "01",
    title: "Définir les compétences",
    description:
      "Identifiez les compétences à certifier : soft skills, savoir-faire métier, modules de formation ou jalons de parcours.",
  },
  {
    step: "02",
    title: "Attribuer les badges",
    description:
      "Délivrez un badge à la fin d'une formation, d'un module validé ou d'une évaluation réussie — manuellement ou automatiquement.",
  },
  {
    step: "03",
    title: "Vérifier et partager",
    description:
      "Le badge est consultable en ligne, vérifiable par un tiers et partageable en un clic sur les réseaux professionnels.",
  },
];

export async function EdgeOpenBadgesPage() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav={false}>
      <EdgeOpenBadgesHero signupHref={edgeMarketingHref("/entreprises/connexion", host)} />

      <section className="bg-white px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
              Open Badges
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-[#050505] sm:text-4xl">
              Pourquoi l&apos;open badge ?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#050505]/60 sm:text-lg">
              Dans un monde où les compétences évoluent vite, la reconnaissance formelle devient un
              avantage stratégique — pour vos équipes comme pour vos apprenants.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {WHY_ITEMS.map((item) => (
              <article
                key={item.title}
                className="rounded-[24px] border border-[#050505]/8 bg-[#FAFAFA] p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(99,91,255,0.1)]"
              >
                <div className="mb-5 inline-flex rounded-2xl bg-edge-accent/10 p-3 text-edge-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#050505]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#050505]/55">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-edge-black-deep px-5 py-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
              Processus
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
              Comment ça fonctionne
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
              Un parcours simple en trois étapes pour certifier, suivre et valoriser les compétences
              acquises.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {HOW_STEPS.map((item) => (
              <article
                key={item.step}
                className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-7"
              >
                <span className="text-5xl font-semibold tracking-tight text-white/10">{item.step}</span>
                <div className="mt-4 flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-edge-accent" />
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={routes.businessDemo} showArrow shape="revolut">
              Demander une démo
            </EdgePremiumButton>
            <EdgePremiumButton href={routes.contact} variant="secondary-dark" shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>

      <section className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-edge-accent/10 p-3 text-edge-accent">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-[#050505]">
                Prêt à lancer vos open badges ?
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#050505]/55">
                EDGE vous accompagne pour structurer vos critères, délivrer vos premiers badges et
                mesurer leur impact.
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#050505]/10 px-4 py-2 text-sm text-[#050505]/70">
            <BadgeCheck className="h-4 w-4 text-edge-accent" />
            Badges vérifiables et partageables
          </div>
        </div>
      </section>
    </EdgePremiumShell>
  );
}
