"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

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
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#9A7B52]">Parcours</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#2F2A25] sm:text-3xl md:text-4xl">
              Choisissez votre accompagnement
            </h2>
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

              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-9 pt-24 text-center sm:pb-10 sm:pt-28">
                <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#F0E4D4]">
                  Jessica Contentin
                </p>
                <h3 className="mt-4 max-w-[15rem] text-xl font-bold uppercase leading-tight tracking-[0.06em] text-white drop-shadow-sm sm:text-2xl">
                  {card.headline}
                </h3>
                <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-[#FAF0E6]/95 sm:text-[15px]">{card.tag}</p>
                <span className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#E8D5B5] underline-offset-4 group-hover:underline">
                  Découvrir le parcours
                </span>
              </div>
            </Link>
          ))}
        </div>

        {belowProgramCards ? <div className="mt-12 md:mt-16">{belowProgramCards}</div> : null}
      </div>
    </motion.section>

    {/* Vidéo bannière — taille contenue, texte centré comme la référence */}
    <section aria-label={featuredVideoTitle ?? "Vidéo"} className="bg-gradient-to-b from-[#F3E8D8] to-[#FAF7F2] px-4 py-10 md:px-8 md:py-14">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl bg-[#2a2210] shadow-[0_28px_70px_-28px_rgba(45,36,28,0.4)]">
        <div className="relative aspect-video max-h-[min(72vh,640px)] min-h-[200px] w-full">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={featuredVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/45" />
          {(featuredVideoTitle || featuredVideoSubtitle) && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              {featuredVideoTitle ? (
                <h3 className="max-w-4xl text-2xl font-light tracking-tight text-white drop-shadow-md md:text-4xl lg:text-5xl">
                  {featuredVideoTitle}
                </h3>
              ) : null}
              {featuredVideoSubtitle ? (
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90 md:text-lg">
                  {featuredVideoSubtitle}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
    </>
  );
}
