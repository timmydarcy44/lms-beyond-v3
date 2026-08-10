import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

type Props = {
  productsHref: string;
  demoHref: string;
};

export function EdgeDiagnosticsHero({ productsHref, demoHref }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.035),transparent_55%)]" />
      <div className="relative mx-auto max-w-4xl px-5 py-24 text-center sm:px-8 sm:py-28 lg:px-10 lg:py-32">
        <p className="font-edge-sf text-[12px] font-medium uppercase tracking-[0.24em] text-neutral-400">
          Diagnostics de compétences
        </p>
        <h1 className="font-edge-display mt-6 text-[clamp(2.75rem,8vw,5.5rem)] leading-[1.02] text-neutral-950">
          Évaluez les soft skills
          <br />
          avec nos tests psychométriques.
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-neutral-500 sm:text-xl">
          Soft Skills, IDMC (Indice de Maîtrise Cognitive) et test comportemental — pour mesurer
          objectivement avant de développer, certifier et suivre les talents.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <EdgePremiumButton href={productsHref} showArrow shape="revolut">
            Découvrir les tests
          </EdgePremiumButton>
          <EdgePremiumButton href={demoHref} variant="secondary-light" shape="revolut">
            Demander une démonstration
          </EdgePremiumButton>
        </div>
      </div>
    </section>
  );
}
