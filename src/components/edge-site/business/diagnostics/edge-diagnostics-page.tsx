import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  LandPlot,
  LineChart,
  School,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { EdgeDiagnosticsHero } from "@/components/edge-site/business/diagnostics/edge-diagnostics-hero";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getAllDiagnostics } from "@/lib/edge-site/diagnostics-catalog";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const WHY_CARDS = [
  {
    icon: Target,
    title: "Identifier les forces",
    description: "Objectiver ce qui distingue déjà vos talents et vos équipes.",
  },
  {
    icon: TrendingUp,
    title: "Repérer les axes de progression",
    description: "Prioriser les leviers à travailler avec une lecture claire et actionnable.",
  },
  {
    icon: Sparkles,
    title: "Personnaliser les parcours IA",
    description: "Transformer chaque diagnostic en recommandations et modules adaptés.",
  },
  {
    icon: LineChart,
    title: "Mesurer les progrès dans le temps",
    description: "Comparer les évaluations successives et piloter le ROI compétences.",
  },
] as const;

const METHOD_STEPS = [
  { title: "Diagnostic", description: "Évaluation scientifique ciblée" },
  { title: "Analyse IA", description: "Lecture croisée et synthèse" },
  { title: "Rapport personnalisé", description: "Forces, axes, scores" },
  { title: "Open Badges", description: "Preuves vérifiables" },
  { title: "Skills Wallet", description: "Portefeuille de compétences" },
  { title: "Parcours personnalisé", description: "Développement guidé" },
  { title: "Nouvelle évaluation", description: "Mesure de progression" },
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
  const diagnostics = getAllDiagnostics();
  const catalogueHref = `${routes.businessDiagnostics}#catalogue`;

  return (
    <EdgePremiumShell overlayNav={false}>
      <div className={cn(inter.className, "bg-white text-neutral-950 antialiased")}>
        <EdgeDiagnosticsHero catalogueHref={catalogueHref} demoHref={routes.businessDemo} />

        <section className="border-b border-neutral-200 bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Enjeux
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
                Pourquoi réaliser un diagnostic ?
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                    <card.icon className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-5 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{card.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="catalogue"
          className="scroll-mt-24 border-b border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8 lg:px-10"
        >
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Catalogue
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
                Notre catalogue de diagnostics
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Une architecture extensible pour mesurer objectivement avant de développer —
                du cognitif au managérial.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {diagnostics.map((item) => {
                const href = edgeMarketingHref(`/business/diagnostics/${item.slug}`, host);
                const Icon = item.icon;
                return (
                  <article
                    key={item.slug}
                    className="group flex flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 transition duration-300 group-hover:border-neutral-300">
                      <Icon className="h-4 w-4 text-neutral-800" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-500">
                      {item.shortDescription}
                    </p>
                    <Link
                      href={href}
                      className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-950 transition hover:gap-2"
                    >
                      Découvrir
                      <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-white px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Méthodologie
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
                Notre méthodologie
              </h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-500">
                Le diagnostic n&apos;est pas une fin en soi : c&apos;est la porte d&apos;entrée d&apos;un
                écosystème de développement.
              </p>
            </div>

            <div className="mt-12 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-visible sm:px-0">
              <ol className="flex min-w-max gap-3 sm:min-w-0 sm:flex-wrap lg:grid lg:grid-cols-7 lg:gap-3">
                {METHOD_STEPS.map((step, index) => (
                  <li
                    key={step.title}
                    className="relative w-[168px] shrink-0 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:w-auto lg:w-auto"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-[11px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <Workflow className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.5} />
                    </div>
                    <p className="mt-3 text-sm font-semibold tracking-[-0.02em] text-neutral-950">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{step.description}</p>
                    {index < METHOD_STEPS.length - 1 ? (
                      <span
                        className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-neutral-300 lg:block"
                        aria-hidden
                      >
                        →
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="border-b border-neutral-200 bg-neutral-50 px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
                Différenciation
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
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
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
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
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
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
