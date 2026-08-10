import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import { ProductPicto } from "@/components/edge-site/business/diagnostics/edge-diagnostics-pictos";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { getFlagshipDiagnostics } from "@/lib/edge-site/diagnostics-catalog";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import { getEdgeMarketingRoutes } from "@/lib/edge-site/marketing-routes";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

export async function EdgePremiumDiagnosticsSection() {
  const host = (await headers()).get("host");
  const routes = getEdgeMarketingRoutes(host);
  const diagnostics = getFlagshipDiagnostics();

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-edge-sf text-[12px] font-medium uppercase tracking-[0.24em] text-black/40">
            Diagnostics
          </p>
          <h2 className="font-edge-display mt-5 text-[clamp(2.25rem,5.5vw,4rem)] leading-[1.05] text-edge-black-deep">
            Mesurez les compétences.
            <br />
            Développez les talents.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-black/50 sm:text-lg">
            Soft Skills, IDMC et test comportemental — trois diagnostics scientifiques pour
            objectiver le potentiel avant de former, certifier et suivre la progression.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {diagnostics.map((item) => {
            const href = edgeMarketingHref(`/business/diagnostics/${item.slug}`, host);
            const isComportemental = item.slug === "test-comportemental";
            return (
              <Link
                key={item.slug}
                href={href}
                className="group flex flex-col rounded-[1.75rem] border border-black/[0.08] bg-neutral-950 p-6 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(5,5,5,0.18)] sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-edge-sf text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    {item.productCode ?? item.title}
                  </h3>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition duration-300 group-hover:scale-105">
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center py-6">
                  {isComportemental ? (
                    <div className="relative mx-auto h-44 w-[min(100%,190px)] overflow-hidden">
                      <Image
                        src={EDGE_PREMIUM_IMAGES.diagComportemental}
                        alt="Aperçu du test comportemental"
                        width={380}
                        height={760}
                        className="absolute left-1/2 top-0 w-[118%] max-w-none -translate-x-1/2 object-cover object-top drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition duration-500 group-hover:scale-[1.02]"
                        sizes="190px"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent" />
                    </div>
                  ) : (
                    <ProductPicto
                      slug={item.slug}
                      className="h-36 w-36 drop-shadow-[0_0_28px_rgba(255,255,255,0.12)] transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <p className="font-edge-sf text-base font-semibold tracking-[-0.02em] text-white">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.shortDescription}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <EdgePremiumButton href={routes.businessDiagnostics} showArrow shape="revolut">
            Voir tous les diagnostics
          </EdgePremiumButton>
          <Link
            href={routes.businessDemo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-edge-black-deep transition hover:gap-2"
          >
            Demander une démonstration
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </section>
  );
}
