"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { JessicaFullWidthVideoSection } from "@/components/jessica-contentin/jessica-full-width-video-section";

/** URL courte (réécrite sur le domaine vitrine Jessica ; route alias en local). */
const SPECIALITES_HREF = "/specialites";

export type ParcoursProgramCard = {
  headline: string;
  tag: string;
  href: string;
  /** Photo de fond si pas de vidéo */
  imageUrl?: string;
  /** Vidéo de fond (ex. carte « Apaiser le mental ») */
  videoUrl?: string;
  /** Affiche / poster pour la vidéo */
  posterUrl?: string;
};

type Props = {
  cards: readonly ParcoursProgramCard[];
  /** Vidéo sous la grille — format bannière (hauteur limitée), pas plein écran */
  featuredVideoUrl: string;
  featuredVideoTitle?: string;
  featuredVideoSubtitle?: string;
  /** Contenu affiché sous la grille des parcours (ex. objectifs / accordéon), avant la vidéo mise en avant */
  belowProgramCards?: ReactNode;
};

/**
 * Bloc « Choisissez votre accompagnement » : cartes type Tony Robbins
 * (texte centré en bas, dégradé chaud), + vidéo mise en avant en dessous.
 */
export function JessicaParcoursProgramCards({
  cards,
  featuredVideoUrl,
  featuredVideoTitle,
  featuredVideoSubtitle,
  belowProgramCards,
}: Props) {
  return (
    <>
    <motion.section
      id="parcours"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.05 }}
      className="scroll-mt-24 bg-gradient-to-b from-[#FFFCF9] via-[#FAF4EC] to-[#F3E8D8] px-4 py-12 sm:px-6 sm:py-14 md:px-10 md:py-16"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#9A7B52]">Parcours proposés</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2F2A25] sm:text-3xl md:text-4xl">
              Parcours proposés
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5C5348] sm:text-base">
              Découvrez les parcours d&apos;accompagnement et choisissez celui qui correspond à votre situation.
            </p>
          </div>
          <Link
            href={SPECIALITES_HREF}
            className="shrink-0 text-sm font-semibold text-[#8B6914] underline-offset-4 transition hover:text-[#C6A664] hover:underline"
          >
            Découvrir les parcours <span aria-hidden>&gt;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.headline}
              href={card.href}
              aria-label={`${card.headline} — ${card.tag}`}
              className="group relative block min-h-[420px] overflow-hidden rounded-2xl bg-[#2a2218] transition sm:min-h-[460px] lg:min-h-[500px]"
            >
              {card.videoUrl ? (
                <video
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                  src={card.videoUrl}
                  {...(card.posterUrl || card.imageUrl
                    ? { poster: card.posterUrl ?? card.imageUrl }
                    : {})}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              ) : null}

              {/* Chaleur : voile doré / sable en haut */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#C6A664]/18 via-transparent to-transparent" />
              {/* Zone lisible type Robbins : dégradé brun-chaud (pas noir froid) */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1c1510]/95 via-[#3d2e24]/65 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#4a3628]/40 via-transparent to-[#8b6914]/08" />

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-6 pb-9 pt-24 text-left sm:px-7 sm:pb-10 sm:pt-28">
                <h3 className="pr-2 text-lg font-bold uppercase leading-snug tracking-[0.04em] text-white drop-shadow-sm sm:text-xl">
                  {card.headline}
                </h3>
                <p className="mt-3 pr-2 text-sm leading-relaxed text-[#FAF0E6]/95 sm:mt-4 sm:text-[15px]">{card.tag}</p>
                <span className="mt-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E8D5B5] underline-offset-4 group-hover:underline sm:mt-6">
                  Découvrir le parcours
                </span>
              </div>
            </Link>
          ))}
        </div>

        {belowProgramCards ? <div className="mt-12 md:mt-16">{belowProgramCards}</div> : null}
      </div>
    </motion.section>

    {featuredVideoUrl && featuredVideoTitle ? (
      <JessicaFullWidthVideoSection
        videoUrl={featuredVideoUrl}
        title={featuredVideoTitle}
        subtitle={featuredVideoSubtitle}
        ariaLabel={featuredVideoTitle}
      />
    ) : null}
    </>
  );
}
