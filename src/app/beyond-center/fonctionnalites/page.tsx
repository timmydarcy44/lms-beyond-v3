import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FEATURE_LIST } from "@/lib/data/beyond-center-features";

export const metadata: Metadata = {
  title: "Fonctionnalités Beyond LMS | Builder, Parcours, Tests & Analytics",
  description:
    "Découvrez l’ensemble des fonctionnalités Beyond LMS : builder modulaire, orchestration de parcours, drive pédagogique, messagerie, tests intelligents et analytics temps réel.",
};

export default function FonctionnalitesPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/0 to-black/60" />
        <div className="relative mx-auto max-w-5xl px-6 py-32 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
            Beyond LMS
          </span>
          <h1 className="text-5xl font-semibold tracking-tight md:text-7xl">
            Toutes les fonctionnalités
            <span className="block text-white/60">
              pour créer, piloter et scaler vos expériences d’apprentissage
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/70 md:text-xl">
            Builder modulaire, orchestration de parcours, drive sécurisé,
            messagerie collaborative, tests intelligents et analytics temps
            réel. Tout est pensé pour offrir un LMS premium, élégant et
            entièrement intégré.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
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
            <Link href="/beyond-center/lms">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base font-medium border-2 border-white/20 text-white transition-all duration-300 hover:bg-white/10"
              >
                Voir la présentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_LIST.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.slug}
                  href={feature.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  {feature.mediaUrl ? (
                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                      <Image
                        src={feature.mediaUrl}
                        alt={feature.label}
                        fill
                        className="object-cover transition-all duration-500 group-hover:scale-105"
                        sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-40" />
                      <div className="absolute left-6 bottom-6 flex items-center gap-3 text-white">
                        <span className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="text-sm uppercase tracking-[0.2em] text-white/80">
                          {feature.label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
                      <span className="rounded-xl bg-black/5 p-3">
                        <Icon className="h-6 w-6 text-black" />
                      </span>
                      <span className="text-sm font-medium uppercase tracking-widest text-gray-500">
                        {feature.label}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-6 px-6 py-8">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">
                        {feature.label}
                      </h2>
                      <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-black">
                      Explorer
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div className="rounded-3xl border border-white bg-white p-10 shadow-xl">
              <h3 className="text-3xl font-semibold text-gray-900">
                Une plateforme unifiée
              </h3>
              <p className="mt-4 text-gray-600">
                Chaque fonctionnalité fonctionne de concert. Créez vos contenus,
                orchestrez les parcours, animez vos communautés et mesurez
                l’impact — le tout dans une expérience ultra premium.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>• Expérience apprenant continue et personnalisée</li>
                <li>• Automatisations intelligentes sur tout le parcours</li>
                <li>• Interfaces pensées pour les équipes pédagogiques</li>
                <li>• Sécurité, données et conformité intégrées nativement</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white bg-white p-10 shadow-xl">
              <h3 className="text-3xl font-semibold text-gray-900">
                Accompagnement premium
              </h3>
              <p className="mt-4 text-gray-600">
                Nous vous aidons à industrialiser vos programmes tout en gardant
                une expérience apprenant haut de gamme, quel que soit votre
                volume.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li>• Onboarding orchestré par nos Learning Engineers</li>
                <li>• Design de templates personnalisés et de parcours types</li>
                <li>• Support prioritaire et communauté d’experts</li>
                <li>• Feuille de route co-construite avec vos équipes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}



