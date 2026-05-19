"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const PORTRAIT_PHOTO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Jessica%20contentin%20re.jpg";

/** Bloc présentation d’accueil (cabinet Jessica CONTENTIN). */
export function JessicaHomePresentation() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 md:py-20"
    >
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14 lg:items-center">
        <div className="mx-auto max-w-3xl space-y-6 text-[#2F2A25] lg:mx-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">Présentation</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Jessica CONTENTIN</h2>
            <p className="mt-3 text-lg text-[#5C5348] md:text-xl">
              Professeure en santé • Psychopédagogue • Certifiée en neuroéducation
            </p>
            <p className="mt-2 text-base text-[#5C5348] md:text-lg">
              Cabinet situé à Bretteville-sur-Odon, près de Caen
            </p>
          </div>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Professeure certifiée en santé dans l&apos;enseignement supérieur et psychopédagogue spécialisée en
            neuroéducation, j&apos;accompagne les enfants, adolescents, étudiants et familles confrontés à des difficultés
            d&apos;apprentissage, émotionnelles, attentionnelles ou scolaires.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Titulaire d&apos;un Master en Ingénierie des Politiques Sanitaires et Sociales (IAE de Caen), d&apos;un second
            master obtenu avec mention Très Bien ainsi que d&apos;un concours national de l&apos;Éducation nationale dans le
            domaine de la santé, j&apos;ai progressivement développé une expertise centrée sur les mécanismes des
            apprentissages, le fonctionnement neurocognitif, les fonctions exécutives et les troubles du
            neurodéveloppement.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon approche s&apos;appuie sur les apports des neurosciences cognitives, de la psychopédagogie et de la
            neuroéducation afin de mieux comprendre les interactions entre cognition, émotions, attention, régulation
            émotionnelle et apprentissages.
          </p>

          <div className="space-y-3 text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            <p>
              Je suis également certifiée en psychopédagogie et neuroéducation, avec une spécialisation dans
              l&apos;accompagnement :
            </p>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#9A7B52]">
              <li>des troubles du neurodéveloppement,</li>
              <li>des difficultés attentionnelles et exécutives,</li>
              <li>de l&apos;anxiété scolaire,</li>
              <li>de la phobie scolaire,</li>
              <li>des difficultés de régulation émotionnelle,</li>
              <li>ainsi que des problématiques de confiance en soi et de décrochage scolaire.</li>
            </ul>
          </div>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon expérience professionnelle au sein de la MDPH du Calvados, ainsi que mes travaux de recherche autour des
            troubles du spectre de l&apos;autisme (TSA), ont renforcé ma réflexion autour de l&apos;inclusion, de la
            coordination des accompagnements et des besoins spécifiques liés aux troubles du neurodéveloppement.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Par ailleurs, mon premier mémoire de recherche portait sur la transdisciplinarité dans l&apos;accompagnement des
            enfants présentant un trouble du spectre de l&apos;autisme (TSA), renforçant ainsi ma réflexion autour du travail
            collaboratif et de la coordination des accompagnements.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Passionnée par la psychologie des apprentissages et le fonctionnement cognitif, j&apos;adopte une approche
            globale intégrant les dimensions cognitives, émotionnelles, attentionnelles et comportementales de chaque
            jeune.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon objectif est d&apos;aider chaque jeune à mieux comprendre son fonctionnement, développer des stratégies
            adaptées, renforcer son autonomie et retrouver un meilleur équilibre dans ses apprentissages et son quotidien.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            J&apos;accompagne également les familles avec une approche bienveillante, structurée et individualisée afin de
            soutenir durablement l&apos;épanouissement scolaire, émotionnel et personnel de leur enfant.
          </p>

          <div className="flex flex-wrap gap-3 border-t border-[#E6D9C6]/80 pt-6">
            <Button asChild className="rounded-full bg-[#C6A664] px-6 text-white hover:bg-[#B88A44]">
              <Link href="/jessica-contentin/a-propos">En savoir plus</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-full border-[#C6A664]/50 bg-[#FDF9F3] text-[#2F2A25] hover:bg-[#F8F2EA]"
            >
              <Link href="/jessica-contentin/specialites">Les accompagnements</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:justify-self-end">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#EDE5D8] shadow-[0_24px_60px_-28px_rgba(60,48,36,0.22)] sm:max-w-md lg:aspect-[4/5] lg:max-w-lg">
            <Image
              src={PORTRAIT_PHOTO_URL}
              alt="Jessica Contentin — accompagnement"
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 40vw, 90vw"
              priority
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
