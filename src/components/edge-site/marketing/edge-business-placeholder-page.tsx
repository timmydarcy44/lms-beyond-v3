import { headers } from "next/headers";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { EdgePremiumShell } from "@/components/edge-site/premium/edge-premium-shell";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";

type Props = {
  title: string;
  description: string;
  label?: string;
};

export async function EdgeBusinessPlaceholderPage({ title, description, label = "EDGE Business" }: Props) {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);

  return (
    <EdgePremiumShell overlayNav={false}>
      <section className="relative overflow-hidden bg-edge-black-deep px-5 pb-20 pt-28 sm:px-8 sm:pt-32 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(99,91,255,0.14),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">{label}</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
            {title}
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/55 sm:text-lg">{description}</p>
          <p className="mt-4 text-sm text-white/35">
            Cette page sera enrichie prochainement. En attendant, nos équipes peuvent vous accompagner.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={routes.businessDemo} showArrow shape="revolut">
              Demander une démo
            </EdgePremiumButton>
            <EdgePremiumButton href={routes.contact} variant="secondary-dark" shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </EdgePremiumShell>
  );
}
