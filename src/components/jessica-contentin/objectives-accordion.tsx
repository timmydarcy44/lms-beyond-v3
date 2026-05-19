"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function isVideoMediaUrl(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

export type ObjectiveItem = {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
};

const defaultObjectives: ObjectiveItem[] = [
  {
    id: "comprendre",
    title: "Mieux comprendre son fonctionnement cognitif et émotionnel",
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&q=80",
  },
  {
    id: "ressources",
    title: "Identifier ses ressources et ses points de blocage",
    imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=80",
  },
  {
    id: "strategies",
    title: "Mettre en place des stratégies adaptées",
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80",
  },
  {
    id: "emotions",
    title: "Améliorer la gestion des émotions",
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1600&q=80",
  },
  {
    id: "organisation",
    title: "Structurer les apprentissages et l’organisation",
    imageUrl: "https://images.unsplash.com/photo-1504151932400-72d4384f04b3?w=1600&q=80",
  },
  {
    id: "stabilite",
    title: "Retrouver un fonctionnement plus stable et efficace",
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&q=80",
  },
];

export function ObjectivesAccordion({
  title = "Objectifs de l’accompagnement",
  subtitle = "Sélectionnez un objectif pour voir le détail.",
  objectives = defaultObjectives,
  /** Typo très grande à gauche (type Tony Robbins) + pas de pastilles « mot-clé » */
  largeTitles = false,
  /** Bloc inséré sous « Choisissez votre accompagnement » : titres plus petits, moins de padding */
  embedded = false,
  className,
}: {
  title?: string;
  subtitle?: string;
  objectives?: ObjectiveItem[];
  largeTitles?: boolean;
  embedded?: boolean;
  className?: string;
}) {
  const items = useMemo(() => objectives.filter(Boolean), [objectives]);
  const [activeIndex, setActiveIndex] = useState(0);

  const active = items[Math.min(activeIndex, Math.max(0, items.length - 1))];

  const showHeroStrip = largeTitles && !embedded;
  const navTitleClass = embedded
    ? "text-lg font-bold tracking-tight md:text-xl lg:text-2xl"
    : largeTitles
      ? "text-[clamp(2.25rem,6.5vw,4.25rem)] leading-[0.98] md:text-[clamp(2.5rem,5vw,3.75rem)]"
      : "text-lg font-semibold md:text-xl";

  const outerClass = cn(
    "mx-auto max-w-7xl",
    embedded ? "px-4 py-6 md:px-6 md:py-8" : "px-4 py-16 md:px-8 md:py-24",
    className,
  );

  const inner = (
    <>
      <header className={cn(embedded ? "mb-6 md:mb-8" : "mb-10 md:mb-14", largeTitles && !embedded ? "max-w-2xl" : "")}>
        {showHeroStrip ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52] md:text-xs">
            ● Les axes de l&apos;accompagnement
          </p>
        ) : null}
        <h2
          className={cn(
            "font-semibold tracking-tight text-[#2F2A25]",
            embedded ? "mt-1 text-xl md:text-2xl" : largeTitles ? "mt-3 text-2xl md:text-3xl" : "text-3xl md:text-4xl",
          )}
        >
          {title}
        </h2>
        {subtitle ? (
          <p className={cn("mt-2 text-[#5C5348]", embedded ? "text-xs md:text-sm" : "text-sm md:text-base")}>
            {subtitle}
          </p>
        ) : null}
      </header>

      <div className={cn("grid gap-12 lg:grid-cols-2 lg:items-stretch", embedded ? "gap-8 lg:gap-10" : "lg:gap-16")}>
        {/* Liste — sans bordures ni encadrés */}
        <nav className="flex flex-col" aria-label={title}>
          {items.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "group flex w-full items-end justify-between gap-4 border-0 bg-transparent py-2 text-left transition md:py-3",
                  largeTitles && !embedded ? "border-b border-transparent hover:border-[#E6D9C6]/80" : "",
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={cn(
                    "min-w-0 font-bold tracking-tight text-[#1a1614] transition group-hover:text-[#5c4330]",
                    isActive && "text-[#8B6914]",
                    navTitleClass,
                  )}
                >
                  {item.title}
                </span>
                {largeTitles && !embedded ? (
                  <span
                    className={cn(
                      "mb-2 shrink-0 text-sm font-medium transition",
                      isActive ? "text-[#9A7B52] opacity-100" : "text-[#9A7B52]/0 group-hover:text-[#9A7B52]/80",
                    )}
                  >
                    Explorer&nbsp;&gt;
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Visuel — léger arrondi, sans cadre */}
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-2xl bg-[#EDE5D8]",
            embedded ? "min-h-[280px] lg:min-h-[360px]" : "min-h-[380px] lg:min-h-[480px]",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active?.id ?? "empty"}
              initial={{ opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {active?.imageUrl ? (
                isVideoMediaUrl(active.imageUrl) ? (
                  <video
                    key={active.imageUrl}
                    className="absolute inset-0 h-full w-full object-cover"
                    src={active.imageUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                    preload="metadata"
                  />
                ) : (
                  <Image
                    src={active.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 45vw, 100vw"
                    className="object-cover"
                    priority
                  />
                )
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2218]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p
                  className={cn(
                    "font-bold leading-tight text-white drop-shadow-md",
                    embedded ? "text-lg md:text-xl" : largeTitles ? "text-3xl md:text-4xl" : "text-2xl",
                  )}
                >
                  {active?.title}
                </p>
                {active?.description ? (
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90">{active.description}</p>
                ) : null}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className={outerClass}>{inner}</div>;
  }

  return <section className={outerClass}>{inner}</section>;
}
