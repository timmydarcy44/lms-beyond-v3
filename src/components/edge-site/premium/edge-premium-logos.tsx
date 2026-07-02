import { EDGE_PREMIUM_LOGOS } from "@/lib/edge-site/premium-constants";

export function EdgePremiumLogos() {
  return (
    <section className="bg-edge-cream py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-center text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
          ILS NOUS FONT CONFIANCE
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
          {EDGE_PREMIUM_LOGOS.map((name) => (
            <span
              key={name}
              className="select-none text-sm font-semibold tracking-[0.12em] text-black/25 transition-colors hover:text-black/40 sm:text-base"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
