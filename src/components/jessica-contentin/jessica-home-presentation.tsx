"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const PORTRAIT_PHOTO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Photo%20presentation.png";

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
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="mx-auto max-w-3xl space-y-6 text-justify text-[#2F2A25] lg:mx-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">Présentation</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Jessica CONTENTIN</h2>
            <p className="mt-3 text-lg text-[#5C5348] md:text-xl">
              Professeure certifiée de l&apos;Éducation nationale (CAPES) • Psychopédagogue certifiée en neuroéducation
            </p>
            <p className="mt-2 text-base text-[#5C5348] md:text-lg">
              Une approche fondée sur les neurosciences cognitives et les sciences de l&apos;apprentissage.
            </p>
          </div>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Professeure certifiée de l&apos;Éducation nationale, psychopédagogue certifiée en neuroéducation et
            titulaire de deux Masters universitaires, j&apos;accompagne depuis plus de dix ans des enfants, des
            adolescents, des étudiants et des adultes confrontés à des difficultés d&apos;apprentissage, de
            fonctionnement exécutif, de régulation émotionnelle ou d&apos;orientation.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            J&apos;accompagne les enfants, les adolescents, les étudiants ainsi que leurs familles confrontés à des
            difficultés d&apos;apprentissage, d&apos;attention, d&apos;organisation, de régulation émotionnelle,{" "}
            <Link href="/jessica-contentin/specialites/orientation-professionnelle" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              d&apos;orientation
            </Link>{" "}
            ou liées aux{" "}
            <Link href="/jessica-contentin/specialites/tnd" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              troubles du neurodéveloppement
            </Link>
            .
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon approche repose sur une compréhension approfondie des interactions entre les apprentissages, les émotions,
            les comportements et le fonctionnement cognitif afin d&apos;identifier les leviers favorisant l&apos;autonomie, le
            bien-être et la réussite de chacun.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Professeure certifiée de l&apos;Éducation nationale (CAPES) et titulaire de deux Masters universitaires,
            dont un obtenu avec la mention Très Bien, j&apos;ai développé au cours de mon parcours une expertise
            centrée sur les mécanismes des apprentissages, les fonctions exécutives, la régulation émotionnelle et
            les{" "}
            <Link href="/jessica-contentin/specialites/tnd" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              troubles du neurodéveloppement
            </Link>
            .
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon expérience professionnelle au sein de la Maison Départementale des Personnes Handicapées (MDPH) du Calvados,
            ainsi que mes travaux de recherche consacrés aux troubles du spectre de l&apos;autisme (TSA), ont renforcé mon
            expertise dans l&apos;accompagnement des besoins spécifiques et dans la compréhension des interactions entre les
            environnements familiaux, scolaires, médico-sociaux et sanitaires.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon accompagnement s&apos;appuie sur les connaissances actuelles issues des{" "}
            <Link href="/jessica-contentin/specialites/neuroeducation" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              neurosciences
            </Link>
            , de la{" "}
            <Link href="/jessica-contentin/specialites/strategie-apprentissage" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              psychopédagogie
            </Link>{" "}
            et de la{" "}
            <Link href="/jessica-contentin/specialites/neuroeducation" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              neuroéducation
            </Link>{" "}
            afin de proposer des stratégies personnalisées, adaptées aux besoins et aux ressources de chaque personne.
          </p>

          <div className="space-y-3 text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            <p>J&apos;interviens notamment dans l&apos;accompagnement :</p>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-[#9A7B52]">
              <li>
                des{" "}
                <Link href="/jessica-contentin/specialites/tnd" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  troubles du neurodéveloppement
                </Link>{" "}
                (TDAH, TSA, troubles DYS, Haut potentiel intellectuel) ;
              </li>
              <li>des difficultés attentionnelles, exécutives et organisationnelles ;</li>
              <li>
                des problématiques de{" "}
                <Link href="/jessica-contentin/specialites/therapie" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  régulation émotionnelle
                </Link>{" "}
                et de{" "}
                <Link href="/jessica-contentin/specialites/gestion-stress" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  gestion du stress
                </Link>{" "}
                ;
              </li>
              <li>de l&apos;anxiété scolaire et de la phobie scolaire ;</li>
              <li>
                des problématiques de{" "}
                <Link href="/jessica-contentin/specialites/confiance-en-soi" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  confiance en soi
                </Link>{" "}
                et de sentiment de compétence ;
              </li>
              <li>
                des difficultés d&apos;apprentissage et de{" "}
                <Link href="/jessica-contentin/specialites/strategie-apprentissage" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  méthodologie
                </Link>{" "}
                ;
              </li>
              <li>des situations de désengagement scolaire ou universitaire ;</li>
              <li>
                de l&apos;{" "}
                <Link href="/jessica-contentin/specialites/orientation-professionnelle" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
                  orientation
                </Link>{" "}
                et de la construction du projet d&apos;avenir.
              </li>
            </ul>
          </div>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Au-delà des difficultés rencontrées, ma démarche vise avant tout à permettre à chacun de{" "}
            <strong className="font-semibold text-[#2F2A25]">mieux comprendre son fonctionnement</strong> afin
            de développer des stratégies adaptées, renforcer son autonomie et mobiliser pleinement ses ressources
            dans les différents domaines de son quotidien.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            J&apos;accompagne également les familles à travers des temps de{" "}
            <Link href="/jessica-contentin/specialites/guidance-parentale" className="font-semibold text-[#8B6914] underline-offset-4 hover:underline">
              guidance parentale
            </Link>{" "}
            destinés à favoriser une meilleure compréhension des besoins de leur enfant et la mise en place de repères
            éducatifs cohérents, adaptés et sécurisants.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Chaque accompagnement s&apos;inscrit dans une démarche individualisée fondée sur l&apos;écoute, la compréhension du
            fonctionnement cognitif, émotionnel et comportemental de la personne, ainsi que sur la co-construction de
            stratégies adaptées à ses besoins, à ses ressources et à ses objectifs.
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

        <div className="relative mx-auto w-full max-w-md lg:sticky lg:top-24 lg:max-w-none lg:justify-self-end">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#EDE5D8] shadow-[0_24px_60px_-28px_rgba(60,48,36,0.22)] sm:max-w-md lg:max-w-lg">
            <Image
              src={PORTRAIT_PHOTO_URL}
              alt="Cabinet Jessica Contentin — espace d'accompagnement à Bretteville-sur-Odon"
              fill
              className="object-cover object-top"
              sizes="(min-width: 1024px) 40vw, 90vw"
              priority
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
