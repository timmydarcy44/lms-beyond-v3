import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FEATURES,
  FeatureContent,
  FeatureSlug,
} from "@/lib/data/beyond-center-features";

type PageProps = {
  params: {
    slug: FeatureSlug;
  };
};

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(FEATURES).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const feature = FEATURES[params.slug];
  if (!feature) {
    return {};
  }

  return {
    title: `${feature.label} | Beyond LMS`,
    description: feature.heroDescription,
  };
}

export default function FeatureDetailPage({ params }: PageProps) {
  const feature = FEATURES[params.slug];

  if (!feature) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <Hero feature={feature} />
      <Outcomes feature={feature} />
      <Sections feature={feature} />
      <Metrics feature={feature} />
      <Cta />
    </div>
  );
}

function Hero({ feature }: { feature: FeatureContent }) {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/70" />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-12 px-6 py-28 md:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
            Fonctionnalité Beyond LMS
          </span>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            {feature.headline}
          </h1>
          <p className="mt-4 text-lg text-white/70 md:text-xl">
            {feature.subheadline}
          </p>
          <p className="mt-6 text-base leading-relaxed text-white/65 md:text-lg">
            {feature.heroDescription}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/beyond-center/rendez-vous">
              <Button
                size="lg"
                className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  color: "#000000",
                }}
              >
                Réserver une démo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/beyond-center/pre-inscription">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base font-medium border-2 border-white/20 text-white transition-all duration-300 hover:bg-white/10"
              >
                Accéder à l’offre
              </Button>
            </Link>
          </div>
        </div>
        {feature.mediaUrl && (
          <div className="relative flex items-center justify-center">
            <div className="relative h-[420px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/5 via-white/10 to-white/5 shadow-[0_25px_70px_-20px_rgba(15,23,42,0.65)]">
              <Image
                src={feature.mediaUrl}
                alt={feature.label}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 100vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function Outcomes({ feature }: { feature: FeatureContent }) {
  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
          <h2 className="text-3xl font-semibold text-gray-900 md:text-4xl">
            Ce que vous débloquez avec {feature.label}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {feature.outcomes.map((outcome) => (
              <div
                key={outcome}
                className="flex items-start gap-3 rounded-xl bg-gray-50 px-5 py-4"
              >
                <span className="rounded-full bg-black text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <p className="text-sm font-medium leading-relaxed text-gray-700">
                  {outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Sections({ feature }: { feature: FeatureContent }) {
  return (
    <section className="bg-gray-50 px-6 py-24">
      <div className="mx-auto max-w-6xl space-y-10">
        {feature.sections.map((section) => (
          <div
            key={section.title}
            className="grid grid-cols-1 gap-8 rounded-3xl border border-white bg-white p-10 shadow-lg md:grid-cols-[1fr_1fr]"
          >
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                {section.title}
              </h3>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {section.description}
              </p>
            </div>
            {section.bullets && (
              <ul className="space-y-3 text-sm text-gray-600">
                {section.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2 rounded-xl bg-gray-50 px-4 py-3"
                  >
                    <span className="mt-1 h-2 w-2 rounded-full bg-black" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Metrics({ feature }: { feature: FeatureContent }) {
  if (!feature.metrics?.length) {
    return null;
  }

  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-gray-100 bg-white p-10 shadow-xl">
        <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">
          Des résultats mesurables
        </h3>
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {feature.metrics.map((metric) => (
            <div key={metric.label} className="text-center">
              <div className="text-4xl font-semibold text-black">
                {metric.value}
              </div>
              <div className="mt-2 text-xs uppercase tracking-[0.3em] text-gray-500">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="bg-black px-6 py-24 text-white">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-4xl font-semibold md:text-5xl">
          Prêt à proposer une expérience LMS ultra-premium&nbsp;?
        </h2>
        <p className="mt-4 text-white/70 md:text-lg">
          Réservez une démonstration personnalisée avec un Learning Engineer et
          concevons ensemble vos parcours d’apprentissage signature.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/beyond-center/rendez-vous">
            <Button
              size="lg"
              className="rounded-full px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              style={{
                backgroundColor: "#FFFFFF",
                color: "#000000",
              }}
            >
              Réserver une démo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/beyond-center/fonctionnalites">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-base font-medium border-2 border-white/20 text-white transition-all duration-300 hover:bg-white/10"
            >
              Voir toutes les fonctionnalités
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}



