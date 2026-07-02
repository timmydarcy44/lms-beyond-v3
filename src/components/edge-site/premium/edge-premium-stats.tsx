import { Building2, TrendingUp, Users } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "+25 000",
    label: "apprenants formés",
  },
  {
    icon: Building2,
    value: "500+",
    label: "entreprises partenaires",
  },
  {
    icon: TrendingUp,
    value: "90%",
    label: "de taux d'insertion professionnelle",
  },
] as const;

export function EdgePremiumStats() {
  return (
    <section id="decouvrir-edge" className="scroll-mt-20 bg-edge-cream py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-start gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <div>
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-edge-black-deep">
            Les entreprises n&apos;embauchent
            <br />
            plus uniquement des diplômés.
            <br />
            Elles recherchent des{" "}
            <span className="text-edge-accent">compétences.</span>
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-black/50">
            EDGE forme aux compétences recherchées par le marché — en alternance, en ligne et en
            entreprise — pour des parcours concrets et des résultats mesurables.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-3 lg:grid-cols-1 lg:gap-12 xl:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="group">
              <stat.icon
                className="h-5 w-5 text-black/30 transition-colors group-hover:text-edge-accent"
                strokeWidth={1.5}
              />
              <p className="mt-4 text-3xl font-semibold tracking-tight text-edge-black-deep sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm leading-snug text-black/45">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
