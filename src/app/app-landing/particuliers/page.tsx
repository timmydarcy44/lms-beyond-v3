"use client";

import Link from "next/link";
import { glassCardClass, glassPanelClass, glassFaqClass } from "@/app/app-landing/feature-styles";

export default function ParticuliersPage() {
  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "linear-gradient(to right, #C7224F, #F17D21)" }}
    >
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center text-center">
        <div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl animate-pulse"
          style={{ background: "radial-gradient(circle, #ffffff, transparent)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-20">
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6 text-white">
            L'intelligence artificielle au service de votre plein potentiel.
          </h1>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-10">
            Que vous cherchiez à compenser un trouble ou à atteindre l'excellence académique, nevo. est
            votre allié. Libérez-vous des tâches chronophages pour vous concentrer sur ce qui compte
            vraiment : la compréhension et la création.
          </p>
          <Link
            href="/app-landing/signup"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-[#be1354] font-semibold hover:scale-105 transition-transform"
          >
            Commencer mon essai gratuit
          </Link>

          <div className="mt-12 max-w-4xl mx-auto">
            <div className={`${glassPanelClass} p-6`}>
              <div className="h-64 rounded-2xl border border-white/30 bg-white/10 flex items-center justify-center text-white/70 shadow-lg">
                [PHOTO HD] Étudiant(e) concentré(e) dans un café/bibliothèque moderne
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-white">À chaque défi sa solution nevo.</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "L'Étudiant en quête d'Excellence",
                desc: "Optimisez chaque minute. Pour ceux qui visent les sommets (Concours, Grandes Écoles, Médecine), nevo. devient votre centre de commande. Automatisez vos synthèses et passez 100% de votre temps en mémorisation active et en résolution de problèmes complexes.",
              },
              {
                title: "Le Profil Neuro-Atypique",
                desc: "Transformez vos barrières en forces. TDAH, Dys ou TSA : nos outils de neuro-ergonomie adaptent vos cours à votre mode de fonctionnement unique pour une autonomie retrouvée.",
              },
            ].map((profile) => (
              <div key={profile.title} className={glassCardClass}>
                <h3 className="text-lg font-semibold mb-2 text-white">{profile.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{profile.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-semibold mb-6 text-white">
          Ne travaillez pas plus dur, travaillez plus intelligemment.
        </h2>
        <p className="text-white/80 text-lg leading-relaxed mb-8">
          La performance cognitive n'est pas une question de temps passé devant un livre, mais de qualité
          d'engagement. nevo. est un facilitateur d'apprentissage qui élimine la friction pour propulser
          votre excellence académique.
        </p>
        <div className={`${glassPanelClass} p-6 space-y-3`}>
          <p className="text-white/90 text-sm">
            Réduction de la charge mentale : l'IA gère la structure, vous gérez le sens.
          </p>
          <p className="text-white/90 text-sm">
            État de Flow : nos outils de Focus vous isolent du bruit numérique.
          </p>
          <p className="text-white/90 text-sm">
            Clarté immédiate : la Reformulation simplifie les concepts les plus abstraits en un clic.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white text-[#0F1117]">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-[#0F1117]">
            L'humain au cœur de la transformation.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-3xl border border-[#E8E9F0] p-6 shadow-sm bg-white">
              <div className="h-48 rounded-2xl bg-[#F3F4F6] mb-6 flex items-center justify-center text-sm text-[#9CA3AF]">
                [PHOTO] Clara, étudiante en Droit
              </div>
              <p className="text-[#4B5563] mb-4">
                "nevo. a divisé mon temps de fiche par trois. Je ne subis plus mes cours, je les maîtrise."
              </p>
              <p className="text-sm font-semibold text-[#111827]">Clara, étudiante en Droit</p>
            </div>
            <div className="rounded-3xl border border-[#E8E9F0] p-6 shadow-sm bg-white">
              <div className="h-48 rounded-2xl bg-[#F3F4F6] mb-6 flex items-center justify-center text-sm text-[#9CA3AF]">
                [PHOTO] Marc, en reconversion
              </div>
              <p className="text-[#4B5563] mb-4">
                "Reprendre les études à 40 ans était un défi. nevo. a été le facilitateur dont j'avais
                besoin pour me remettre à niveau rapidement."
              </p>
              <p className="text-sm font-semibold text-[#111827]">Marc, en reconversion</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-10 text-white">
            Tout ce dont vous avez besoin, en un seul lieu.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className={glassCardClass}>
              <h3 className="text-lg font-semibold mb-2 text-white">Génération de fiches</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Pour ne plus jamais synthétiser à la main.
              </p>
              <Link href="/app-landing/features/fiches-revision" className="underline underline-offset-4">
                Découvrir
              </Link>
            </div>
            <div className={glassCardClass}>
              <h3 className="text-lg font-semibold mb-2 text-white">Quiz & Flashcards</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Pour tester vos connaissances sans stress.
              </p>
              <div className="flex gap-4">
                <Link href="/app-landing/features/quiz" className="underline underline-offset-4">
                  Quiz
                </Link>
                <Link href="/app-landing/features/flashcards" className="underline underline-offset-4">
                  Flashcards
                </Link>
              </div>
            </div>
            <div className={glassCardClass}>
              <h3 className="text-lg font-semibold mb-2 text-white">Traduction & Reformulation</h3>
              <p className="text-white/80 text-sm leading-relaxed mb-4">
                Pour rendre accessible n'importe quelle source étrangère.
              </p>
              <div className="flex gap-4">
                <Link href="/app-landing/features/traduction" className="underline underline-offset-4">
                  Traduction
                </Link>
                <Link href="/app-landing/features/reformulation" className="underline underline-offset-4">
                  Reformulation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-semibold mb-8 text-white">Questions fréquentes</h2>
        <div className="space-y-4">
          {[
            {
              q: "Est-ce que nevo. convient aux collégiens/lycéens ?",
              a: (
                <>
                  Absolument. nevo. est conçu pour être intuitif dès le plus jeune âge, aidant à construire
                  des méthodes de travail solides pour le Brevet ou le Bac.
                </>
              ),
            },
            {
              q: "Mon enfant est dyslexique, comment l'aider ?",
              a: (
                <>
                  En utilisant le mode Audio et les polices adaptées, vous réduisez sa fatigue nerveuse. Il
                  peut enfin se concentrer sur le fond du cours plutôt que de buter sur les mots.
                </>
              ),
            },
            {
              q: "Quel est le prix pour un particulier ?",
              a: (
                <>
                  Nous proposons un abonnement accessible avec une période d'essai gratuite, car nous
                  pensons que l'accessibilité cognitive ne devrait pas être un luxe.
                </>
              ),
            },
          ].map((item) => (
            <details key={item.q} className={glassFaqClass}>
              <summary className="cursor-pointer font-semibold text-white">{item.q}</summary>
              <div className="text-white/80 text-sm leading-relaxed mt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className={`${glassPanelClass} p-6 flex flex-col md:flex-row items-center justify-between`}>
            <div className="text-left">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Découvrir nos offres pour les pro
              </h2>
              <p className="text-white/80">
                Accompagnez vos apprenants avec des outils neuro-inclusifs à grande échelle.
              </p>
            </div>
            <Link
              href="/professionnels"
              className="mt-4 md:mt-0 inline-flex items-center justify-center px-6 py-3 rounded-full bg-white text-[#be1354] font-semibold"
            >
              Voir les offres pro
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
