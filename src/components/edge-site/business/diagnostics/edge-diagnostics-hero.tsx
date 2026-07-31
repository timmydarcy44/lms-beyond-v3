import { BadgeCheck, BrainCircuit, Radar, Wallet } from "lucide-react";

import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";

type Props = {
  catalogueHref: string;
  demoHref: string;
};

export function EdgeDiagnosticsHero({ catalogueHref, demoHref }: Props) {
  return (
    <section className="relative overflow-hidden border-b border-neutral-200 bg-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,0,0,0.03),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-10 lg:py-24">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400">
            Diagnostics de compétences
          </p>
          <h1 className="mt-5 max-w-xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[3.25rem]">
            Mesurez les compétences.
            <br />
            Développez les talents.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-500 sm:text-lg">
            Plus de 40 diagnostics scientifiques permettant d&apos;évaluer les compétences cognitives,
            comportementales, émotionnelles et managériales afin de personnaliser les parcours de
            développement.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <EdgePremiumButton href={catalogueHref} showArrow shape="revolut">
              Découvrir les diagnostics
            </EdgePremiumButton>
            <EdgePremiumButton href={demoHref} variant="secondary-light" shape="revolut">
              Demander une démonstration
            </EdgePremiumButton>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -inset-4 rounded-[2rem] bg-neutral-100/80 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-neutral-50 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_48px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between border-b border-neutral-200/80 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-neutral-300" />
                <span className="h-2 w-2 rounded-full bg-neutral-300" />
                <span className="h-2 w-2 rounded-full bg-neutral-300" />
              </div>
              <p className="text-[11px] font-medium tracking-wide text-neutral-400">EDGE Skills OS</p>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:row-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    Radar
                  </p>
                  <Radar className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                </div>
                <div className="relative mx-auto mt-6 aspect-square w-[78%] max-w-[180px]">
                  <div className="absolute inset-0 rounded-full border border-neutral-200" />
                  <div className="absolute inset-[18%] rounded-full border border-neutral-200" />
                  <div className="absolute inset-[36%] rounded-full border border-neutral-200" />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                    <polygon
                      points="50,18 78,42 68,78 32,78 22,42"
                      fill="rgba(10,10,10,0.06)"
                      stroke="rgba(10,10,10,0.55)"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
                <p className="mt-4 text-center text-xs text-neutral-500">Profil multi-axes</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    Score
                  </p>
                  <span className="text-2xl font-semibold tracking-tight text-neutral-950">84</span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full w-[84%] rounded-full bg-neutral-950" />
                </div>
                <p className="mt-3 text-xs text-neutral-500">Indice global de maturité</p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    Badges
                  </p>
                  <BadgeCheck className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                </div>
                <div className="mt-4 flex gap-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[10px] font-semibold text-neutral-700"
                    >
                      0{i + 1}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">
                    Wallet
                  </p>
                  <Wallet className="h-4 w-4 text-neutral-400" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-sm font-medium text-neutral-950">Skills Wallet</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  Compétences certifiées, partageables et suivies dans le temps.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:col-span-2">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                    <BrainCircuit className="h-4 w-4 text-neutral-700" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-950">Parcours IA recommandé</p>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      Diagnostic → analyse → Open Badges → wallet → progression continue.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
