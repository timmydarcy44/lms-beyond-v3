import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Image from "next/image";
import {
  Building2,
  GraduationCap,
  LandPlot,
  School,
} from "lucide-react";

import { EdgeDiagnosticsFlagship } from "@/components/edge-site/business/diagnostics/edge-diagnostics-flagship";
import { EdgeDiagnosticsHero } from "@/components/edge-site/business/diagnostics/edge-diagnostics-hero";
import { EdgeDiagnosticsOrbit } from "@/components/edge-site/business/diagnostics/edge-diagnostics-orbit";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getFlagshipDiagnostics } from "@/lib/edge-site/diagnostics-catalog";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const POTENTIAL_STEPS = [
  {
    n: "01",
    title: "Objectiver le potentiel",
    description:
      "Remplacez l'intuition par des mesures scientifiques sur le comportement, la cognition et les soft skills.",
  },
  {
    n: "02",
    title: "Personnaliser le développement",
    description:
      "Chaque rapport ouvre sur des Open Badges, un Skills Wallet et un parcours IA adapté au profil.",
  },
  {
    n: "03",
    title: "Mesurer la progression",
    description:
      "Réévaluez dans le temps, comparez les cohortes et pilotez le ROI compétences avec des analytics.",
  },
] as const;

const USE_CASES = [
  {
    icon: Building2,
    title: "Entreprise",
    items: ["Identifier les potentiels", "Former plus efficacement", "Mesurer le ROI"],
  },
  {
    icon: GraduationCap,
    title: "CFA",
    items: ["Personnaliser les parcours", "Valoriser les compétences", "Suivre les progressions"],
  },
  {
    icon: School,
    title: "Écoles",
    items: ["Orientation", "Réussite", "Compétences transversales"],
  },
  {
    icon: LandPlot,
    title: "Administration",
    items: ["Gestion des talents", "Mobilité", "Développement des compétences"],
  },
] as const;

const OTHER_PLATFORM = ["Simple questionnaire", "Rapport PDF", "Résultat statique"] as const;

const EDGE_PLATFORM = [
  "Diagnostic scientifique",
  "Analyse IA",
  "Open Badges",
  "Skills Wallet",
  "Suivi dans le temps",
  "Analytics",
  "Personnalisation automatique",
] as const;

export async function EdgeDiagnosticsPage() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const flagship = getFlagshipDiagnostics();
  const productsHref = `${routes.businessDiagnostics}#produits`;

  const hrefFor = (slug: string) => edgeMarketingHref(`/business/diagnostics/${slug}`, host);

  return (
    <EdgePremiumShell overlayNav={false} navChrome="light">
      <div className={cn(inter.className, "font-edge-sf bg-white text-neutral-950 antialiased")}>
        <EdgeDiagnosticsHero productsHref={productsHref} demoHref={routes.businessDemo} />

        <EdgeDiagnosticsFlagship diagnostics={flagship} hrefFor={hrefFor} />

        <section className="border-b border-neutral-200 bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="font-edge-display text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] text-neutral-950">
                Débloquez le potentiel des individus et des organisations
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-500">
                Soft Skills, IDMC et test comportemental forment la porte d&apos;entrée d&apos;un
                écosystème complet de développement des talents.
              </p>
            </div>

            <div className="mt-12">
              <EdgeDiagnosticsOrbit />
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {POTENTIAL_STEPS.map((step) => (
                <article key={step.n} className="border-t border-neutral-200 pt-6">
                  <p className="text-3xl font-semibold tracking-tight text-neutral-300">{step.n}</p>
                  <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-neutral-950">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-500">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-neutral-950 px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <h2 className="max-w-xl font-edge-display text-[clamp(1.85rem,4vw,2.75rem)] leading-[1.08] text-white">
              Prêt à transformer votre façon d&apos;évaluer les talents ?
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <EdgePremiumButton href={routes.businessDemo} showArrow shape="revolut" variant="white">
                Demander une démonstration
              </EdgePremiumButton>
              <EdgePremiumButton href={productsHref} variant="outline-white" shape="revolut">
                Voir les tests
              </EdgePremiumButton>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="font-edge-sf text-[12px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Test comportemental
              </p>
              <h2 className="font-edge-display mt-4 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-neutral-950">
                Un profil comportemental clair, en quelques minutes.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-neutral-500 sm:text-lg">
                Le test comportemental EDGE révèle les préférences d&apos;action, d&apos;influence, de
                stabilité et de rigueur. Chaque réponse construit un profil actionnable pour manager,
                recruter et collaborer plus efficacement.
              </p>
              <div className="mt-8">
                <EdgePremiumButton
                  href={edgeMarketingHref("/business/diagnostics/test-comportemental", host)}
                  showArrow
                  shape="revolut"
                >
                  Découvrir le test
                </EdgePremiumButton>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[340px]">
              <Image
                src={EDGE_PREMIUM_IMAGES.diagComportemental}
                alt="Aperçu du test comportemental EDGE sur mobile"
                width={680}
                height={1200}
                className="h-auto w-full object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.12)]"
                sizes="(max-width: 768px) 80vw, 340px"
                priority={false}
              />
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Différenciation
              </p>
              <h2 className="font-edge-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-neutral-950">
                Pourquoi EDGE ?
              </h2>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-neutral-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  Autres plateformes
                </p>
                <ul className="mt-6 space-y-3">
                  {OTHER_PLATFORM.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 border-b border-neutral-100 pb-3 text-sm text-neutral-500 last:border-0 last:pb-0"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-neutral-950 bg-neutral-950 p-7 text-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                  EDGE
                </p>
                <ul className="mt-6 space-y-3">
                  {EDGE_PLATFORM.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-neutral-100 last:border-0 last:pb-0"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Cas d&apos;usage
              </p>
              <h2 className="font-edge-display mt-4 text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-neutral-950">
                Cas d&apos;usage
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {USE_CASES.map((useCase) => (
                <article
                  key={useCase.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                    <useCase.icon className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                    {useCase.title}
                  </h3>
                  <ul className="mt-4 space-y-2">
                    {useCase.items.map((item) => (
                      <li key={item} className="text-sm leading-relaxed text-neutral-500">
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl rounded-[1.75rem] border border-neutral-200 bg-neutral-50 px-6 py-12 sm:px-10 sm:py-14">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-edge-display text-[clamp(2.25rem,5vw,3.5rem)] leading-[1.05] text-neutral-950">
                Transformez vos évaluations en véritables leviers de développement.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Diagnostic → IA → Open Badges → Skills Wallet → Parcours → Progression → Analytics.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <EdgePremiumButton href={routes.business} showArrow shape="revolut">
                  Découvrir EDGE
                </EdgePremiumButton>
                <EdgePremiumButton href={routes.businessDemo} variant="secondary-light" shape="revolut">
                  Demander une démonstration
                </EdgePremiumButton>
              </div>
            </div>
          </div>
        </section>
      </div>
    </EdgePremiumShell>
  );
}
