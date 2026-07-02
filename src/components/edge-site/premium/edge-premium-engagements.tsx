import Image from "next/image";
import Link from "next/link";
import { Award, Briefcase, GraduationCap, TrendingUp } from "lucide-react";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

const ENGAGEMENTS = [
  {
    title: "Former",
    description:
      "Des formations en alternance et en ligne conçues avec les entreprises pour des métiers d'avenir.",
    image: EDGE_PREMIUM_IMAGES.former,
    icon: GraduationCap,
    href: "/edge-lab/parcours",
  },
  {
    title: "Développer",
    description:
      "Développez les compétences de vos équipes grâce à notre plateforme LMS intelligente.",
    image: EDGE_PREMIUM_IMAGES.developper,
    icon: TrendingUp,
    href: "/edge-lab/edge-online",
  },
  {
    title: "Recruter",
    description:
      "Identifiez les talents, évaluez les compétences et simplifiez vos processus de recrutement.",
    image: EDGE_PREMIUM_IMAGES.recruter,
    icon: Briefcase,
    href: "/edge-lab/entreprises",
  },
  {
    title: "Certifier",
    description:
      "Valorisez les compétences avec des certifications reconnues et des Open Badges.",
    image: EDGE_PREMIUM_IMAGES.certifier,
    icon: Award,
    href: "/edge-lab/parcours",
  },
] as const;

export function EdgePremiumEngagements() {
  return (
    <section className="bg-edge-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
          UNE PLATEFORME, 4 ENGAGEMENTS
        </p>
        <h2 className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-edge-black-deep">
          Former. Développer. Recruter. Certifier.
        </h2>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {ENGAGEMENTS.map((item) => (
            <article
              key={item.title}
              className="group flex flex-col overflow-hidden rounded-[24px] bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(5,5,5,0.08)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 90vw, 320px"
                />
                <div className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-edge-black-deep text-white shadow-lg">
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold text-edge-black-deep">{item.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-black/50">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-edge-accent transition-opacity hover:opacity-80"
                >
                  Découvrir →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
