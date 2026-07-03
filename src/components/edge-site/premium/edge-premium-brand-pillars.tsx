import { Award, BadgeCheck, Brain, Network, TrendingUp } from "lucide-react";

const PILLARS = [
  {
    icon: Brain,
    title: "IA intégrée",
    description: "Parcours personnalisés, diagnostics intelligents et recommandations formation en temps réel.",
  },
  {
    icon: BadgeCheck,
    title: "Open Badges",
    description: "Preuves de compétences vérifiables, partageables et reconnues par les employeurs.",
  },
  {
    icon: Network,
    title: "Réseau de spécialistes",
    description: "Formateurs et experts métier sélectionnés, évalués et certifiés par EDGE.",
  },
  {
    icon: TrendingUp,
    title: "Employabilité",
    description: "90 % d'insertion, alternance structurée et matching compétences ↔ opportunités.",
  },
  {
    icon: Award,
    title: "Certifications",
    description: "Parcours certifiants, badges IMS Global et valorisation des acquis professionnels.",
  },
] as const;

export function EdgePremiumBrandPillars({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";

  return (
    <section className={isDark ? "bg-[#050505] py-20 sm:py-28" : "bg-white py-20 sm:py-28"}>
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p
          className={
            isDark
              ? "text-[10px] font-medium uppercase tracking-[0.25em] text-[#3B82F6]/70"
              : "text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent"
          }
        >
          Ce qui nous différencie
        </p>
        <h2
          className={`mt-4 text-[clamp(1.5rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] ${isDark ? "text-white" : "text-edge-black-deep"}`}
        >
          Technologie, preuves et résultats — pas du marketing formation.
        </h2>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.title}
              className={
                isDark
                  ? "rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 transition hover:border-white/[0.14]"
                  : "rounded-[24px] border border-[#050505]/8 bg-[#F7F7F5] p-6 transition hover:shadow-[0_12px_40px_rgba(99,91,255,0.08)]"
              }
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${isDark ? "bg-[#635BFF]/15 text-[#a8a3ff]" : "bg-edge-accent/10 text-edge-accent"}`}
              >
                <pillar.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <h3 className={`mt-5 text-base font-semibold ${isDark ? "text-white" : "text-edge-black-deep"}`}>
                {pillar.title}
              </h3>
              <p className={`mt-2 text-sm leading-relaxed ${isDark ? "text-white/45" : "text-[#050505]/55"}`}>
                {pillar.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
