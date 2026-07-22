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
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 md:py-28"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
        <div className="mx-auto max-w-3xl space-y-6 text-justify text-[#2F2A25] lg:mx-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9A7B52]">Présentation</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Jessica CONTENTIN</h2>
            <p className="mt-3 text-lg text-[#5C5348] md:text-xl">
              Professeure certifiée de l&apos;Éducation nationale • Psychopédagogue certifiée en neuroéducation
            </p>
          </div>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Lorsqu&apos;un enfant, un adolescent ou un étudiant rencontre des difficultés d&apos;apprentissage,
            d&apos;attention, d&apos;organisation ou de gestion des émotions, il est souvent difficile de savoir
            pourquoi.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon rôle est d&apos;identifier ce qui freine son fonctionnement afin de construire des stratégies
            concrètes, adaptées à ses besoins et à ses ressources.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Professeure certifiée de l&apos;Éducation nationale (CAPES), psychopédagogue certifiée en neuroéducation
            et titulaire de deux Masters universitaires, j&apos;accompagne depuis plus de 10 ans les enfants, les
            adolescents, les étudiants et leurs familles.
          </p>

          <p className="text-base leading-relaxed text-[#2F2A25]/90 md:text-lg">
            Mon approche s&apos;appuie sur les connaissances actuelles en neurosciences cognitives, en
            psychopédagogie et en neuroéducation afin de favoriser l&apos;autonomie, la confiance et la réussite.
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

        <div className="relative mx-auto w-full max-w-md pt-2 lg:sticky lg:top-28 lg:max-w-none lg:justify-self-end lg:pt-4">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#EDE5D8] shadow-[0_24px_60px_-28px_rgba(60,48,36,0.22)] sm:max-w-md lg:max-w-[28rem]">
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
