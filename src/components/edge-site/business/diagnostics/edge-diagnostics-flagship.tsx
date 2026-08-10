import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ProductPicto } from "@/components/edge-site/business/diagnostics/edge-diagnostics-pictos";
import type { EdgeDiagnostic } from "@/lib/edge-site/diagnostics-catalog";
import { cn } from "@/lib/utils";

type Props = {
  diagnostics: EdgeDiagnostic[];
  hrefFor: (slug: string) => string;
};

export function EdgeDiagnosticsFlagship({ diagnostics, hrefFor }: Props) {
  return (
    <section id="produits" className="scroll-mt-24 bg-neutral-950 px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="font-edge-sf text-[12px] font-medium uppercase tracking-[0.22em] text-neutral-500">
            Nos tests phares
          </p>
          <h2 className="font-edge-display mt-5 text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.05] text-white">
            Évaluez les soft skills dès le recrutement, et tout au long de la carrière
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Soft Skills, IDMC et test comportemental — trois diagnostics scientifiques pour
            objectiver le potentiel avant de former, certifier et suivre la progression.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {diagnostics.map((item) => {
            const href = hrefFor(item.slug);
            return (
              <article
                key={item.slug}
                className={cn(
                  "group flex flex-col rounded-[1.75rem] border border-white/10 bg-[#141414] p-6 transition duration-300",
                  "hover:-translate-y-0.5 hover:border-white/20 hover:bg-[#181818] sm:p-7",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-edge-sf text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    {item.productCode ?? item.title}
                  </h3>
                  <Link
                    href={href}
                    aria-label={`Découvrir ${item.title}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white text-neutral-950 transition duration-300 group-hover:scale-105"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={2} />
                  </Link>
                </div>

                <div className="flex flex-1 items-center justify-center py-10">
                  <ProductPicto
                    slug={item.slug}
                    className="h-40 w-40 drop-shadow-[0_0_28px_rgba(255,255,255,0.12)] transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>

                <p className="text-sm leading-relaxed text-neutral-400">{item.shortDescription}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
