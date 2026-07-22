import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Award, Brain, Heart, ListOrdered, Monitor, Sparkles, Users } from "lucide-react";
import { CREDIBILITY_ITEMS } from "@/lib/jessica-contentin/specialty-offer-content";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";

export const metadata: Metadata = {
  title: "Ma méthode — Neuroéducation & accompagnement personnalisé",
  description:
    "Approche fondée sur les neurosciences : comprendre son fonctionnement cognitif et émotionnel pour construire des stratégies personnalisées et durables.",
};

const STEPS = [
  {
    title: "Comprendre votre fonctionnement",
    text: "Nous identifions ensemble vos difficultés, vos ressources et vos objectifs grâce à une analyse approfondie de votre situation.",
  },
  {
    title: "Construire des stratégies adaptées",
    text: "Des outils concrets sont mis en place pour améliorer les apprentissages, l'organisation, la gestion des émotions ou les fonctions exécutives selon vos besoins.",
  },
  {
    title: "Expérimenter au quotidien",
    text: "Les stratégies sont appliquées entre les séances afin d'observer leur efficacité dans les situations réelles.",
  },
  {
    title: "Ajuster et consolider",
    text: "Chaque rendez-vous permet d'analyser les progrès réalisés, d'affiner les outils et de développer progressivement votre autonomie.",
  },
] as const;

const DIGITAL_TOOLS = [
  "des parcours personnalisés sur NEVO",
  "des fiches de synthèse",
  "des exercices ciblés",
  "des quiz interactifs",
  "des ressources adaptées à votre profil",
  "des outils méthodologiques réutilisables au quotidien",
] as const;

export default function JessicaMethodePage() {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <section className="border-b border-[#E6D9C6]/50 bg-gradient-to-b from-[#FFFCF9] to-[#F8F5F0] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">Méthode</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#2F2A25] md:text-5xl">
            Une approche fondée sur les neurosciences pour comprendre avant d&apos;agir
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[#5C5348]">
            Chaque personne apprend, réfléchit et s&apos;adapte différemment. Mon approche consiste à
            analyser votre fonctionnement cognitif, émotionnel et comportemental afin de construire des
            stratégies personnalisées, scientifiquement fondées et applicables au quotidien.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-[#5C5348]">
            Mon objectif n&apos;est pas de multiplier les conseils, mais de vous donner les outils pour
            devenir progressivement autonome dans vos apprentissages, votre organisation et votre gestion
            des difficultés.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm md:col-span-2">
            <Users className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Qui suis-je</h2>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Professeure certifiée de l&apos;Éducation nationale, psychopédagogue certifiée en
              neuroéducation et titulaire de deux Masters universitaires, j&apos;accompagne depuis plus de
              dix ans des enfants, des adolescents, des étudiants et des adultes confrontés à des
              difficultés d&apos;apprentissage, de fonctionnement exécutif, de régulation émotionnelle ou
              d&apos;orientation.
            </p>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Mon approche s&apos;appuie sur les connaissances actuelles issues des neurosciences
              cognitives, de la psychologie du développement et des sciences de l&apos;éducation afin de
              proposer un accompagnement rigoureux, individualisé et durable.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm md:col-span-2">
            <Award className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">
              Une expertise fondée sur la science et l&apos;expérience
            </h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {CREDIBILITY_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-[#E6D9C6]/80 bg-[#FFFCF9] px-4 py-3 text-sm leading-relaxed text-[#2F2A25]"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A664]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <Brain className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Ma vision de la neuroéducation</h2>
            <p className="mt-2 text-sm font-semibold text-[#8B6F47]">
              Comprendre le fonctionnement pour individualiser l&apos;accompagnement.
            </p>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              La neuroéducation repose sur une idée simple : apprendre efficacement nécessite d&apos;abord
              de comprendre comment chacun fonctionne. Les difficultés d&apos;apprentissage, d&apos;attention
              ou de régulation émotionnelle trouvent souvent leur origine dans des mécanismes cognitifs
              qu&apos;il est possible d&apos;identifier et de prendre en compte.
            </p>
            <p className="mt-4 leading-relaxed text-[#5C5348]">
              Mon approche s&apos;appuie sur les connaissances scientifiques actuelles afin de construire
              des stratégies individualisées, durables et directement applicables au quotidien.
            </p>
          </article>

          <article className="rounded-3xl border border-[#E6D9C6] bg-white p-8 shadow-sm">
            <ListOrdered className="mb-4 h-8 w-8 text-[#C6A664]" />
            <h2 className="text-2xl font-semibold text-[#2F2A25]">Comment se déroule un accompagnement</h2>
            <p className="mt-2 text-sm font-semibold text-[#8B6F47]">
              Une méthode progressive, personnalisée et mesurable
            </p>
            <ol className="mt-5 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-sm font-bold text-[#8B6F47]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[#2F2A25]">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#5C5348]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm leading-relaxed text-[#5C5348]">
              L&apos;objectif n&apos;est pas de créer une dépendance à l&apos;accompagnement, mais de vous
              transmettre des méthodes durables que vous pourrez mobiliser de façon autonome.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#E6D9C6]/50 bg-white py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            <div>
              <Monitor className="mb-4 h-8 w-8 text-[#C6A664]" />
              <h2 className="text-2xl font-semibold text-[#2F2A25]">Présentiel & outils numériques</h2>
              <p className="mt-2 text-sm font-semibold text-[#8B6F47]">
                L&apos;accompagnement continue entre les séances
              </p>
              <p className="mt-4 leading-relaxed text-[#5C5348]">
                Le travail ne s&apos;arrête pas à la fin d&apos;un rendez-vous.
              </p>
              <p className="mt-4 leading-relaxed text-[#5C5348]">
                Entre deux séances, vous bénéficiez d&apos;un environnement numérique conçu pour favoriser
                la consolidation des apprentissages et maintenir une progression régulière.
              </p>
            </div>
            <div className="rounded-3xl border border-[#E6D9C6] bg-[#FFFCF9] p-8">
              <p className="text-sm font-semibold text-[#2F2A25]">Selon votre accompagnement, vous pouvez accéder à :</p>
              <ul className="mt-4 space-y-2.5 text-[#5C5348]">
                {DIGITAL_TOOLS.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A664]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-relaxed text-[#5C5348]">
                Cette continuité permet d&apos;ancrer progressivement les nouvelles stratégies et de
                favoriser leur transfert dans la vie scolaire, universitaire ou professionnelle.
              </p>
              <Link
                href="/ressources/application-neuro-adaptee"
                className="mt-5 inline-flex text-sm font-semibold text-[#8B6F47] hover:underline"
              >
                Découvrir NEVO →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-[#C6A664]" />
          <h2 className="mt-4 text-2xl font-bold text-[#2F2A25] md:text-3xl">
            Un accompagnement pour gagner en autonomie
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#5C5348]">
            Comprendre son fonctionnement, expérimenter des stratégies concrètes et consolider les acquis —
            en cabinet et entre les séances.
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
