import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Heart, Sparkles, Users } from "lucide-react";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export const metadata: Metadata = {
  title: "Ma méthode — Neuroéducation & accompagnement personnalisé",
  description:
    "Découvrez l'approche de Jessica Contentin : parcours, vision de la neuroéducation, accompagnement présentiel et outils numériques comme NEVO.",
};

export default function JessicaMethodePage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="border-b border-[#E6D9C6]/50 bg-gradient-to-b from-[#FFFCF9] to-[#F8F5F0] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Méthode</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#2F2A25] md:text-5xl">
            Une approche qui relie science, bienveillance et résultats concrets
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5C5348]">
            Cette page présente ma philosophie d&apos;accompagnement : comprendre le fonctionnement de chaque
            personne pour construire des stratégies durables, en cabinet et entre les séances.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <Users className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Qui je suis</h2>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Professeure en santé, psychopédagogue et certifiée en neuroéducation, j&apos;accompagne enfants,
              adolescents, étudiants et familles depuis plus de dix ans. Mon parcours mêcle terrain éducatif,
              clinique et ingénierie pédagogique.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <Brain className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Ma vision de la neuroéducation</h2>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Apprendre, c&apos;est aussi apprendre à se connaître. Je m&apos;appuie sur les sciences cognitives et
              affectives pour proposer des stratégies réalistes, adaptées au profil de chacun — pas des recettes
              génériques.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <Sparkles className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Comment se déroule un accompagnement</h2>
            <ul className="mt-4 space-y-3 text-[#5C5348]">
              <li>• Bilan des besoins et des objectifs</li>
              <li>• Mise en place de stratégies concrètes et mesurables</li>
              <li>• Suivi régulier avec ajustements progressifs</li>
              <li>• Implication des parents ou de l&apos;entourage quand c&apos;est pertinent</li>
            </ul>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <Heart className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Présentiel + outils numériques</h2>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Les séances en cabinet ou en visio posent le cadre. Entre deux rendez-vous, des ressources et la
              plateforme <strong>NEVO</strong> prolongent le travail : révisions, quiz, fiches et routines
              d&apos;apprentissage adaptées.
            </p>
            <Link
              href="/ressources/application-neuro-adaptee"
              className="mt-4 inline-flex text-sm font-semibold text-[#8B6F47] hover:underline"
            >
              Découvrir NEVO →
            </Link>
          </article>
        </div>
      </section>

      <section className="border-t border-[#E6D9C6]/50 bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-bold text-[#2F2A25] md:text-3xl">Les résultats que je vise</h2>
          <p className="mt-4 text-lg leading-relaxed text-[#5C5348]">
            Plus d&apos;autonomie, moins de stress, une meilleure compréhension de soi et des outils réutilisables
            dans la durée — à l&apos;école, à la maison et dans la vie quotidienne.
          </p>
          <Button
            asChild
            className="mt-8 rounded-full bg-[#C6A664] px-8 py-6 text-lg text-white hover:bg-[#B88A44]"
          >
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Prendre rendez-vous
              <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
