"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, PenLine, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { JessicaRemoteImage } from "@/components/jessica-contentin/jessica-remote-image";

export type DownloadResourceSlide = {
  id: string;
  title: string;
  description: string;
  detail: string;
  imageUrl: string;
};

const SLIDE_ICONS = [Download, PenLine, Home, PenLine, Home] as const;

type Props = {
  slides: DownloadResourceSlide[];
};

export function ParcoursDownloadResourcesSlider({ slides }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = slides.length;
  const active = slides[activeIndex] ?? slides[0];
  const Icon = SLIDE_ICONS[activeIndex % SLIDE_ICONS.length];

  const go = (delta: number) => {
    setActiveIndex((prev) => (prev + delta + count) % count);
  };

  if (!active) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_-24px_rgba(47,42,37,0.18)]">
      <div className="grid lg:grid-cols-2">
        {/* Texte — gauche */}
        <div className="flex flex-col justify-between gap-8 p-8 md:p-10 lg:min-h-[480px]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#9A7B52]">
              Ressources à télécharger
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#2F2A25] md:text-3xl">
              Des outils concrets pour le quotidien
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#5C5348] md:text-base">
              Fiches interactives, grilles et protocoles pensés pour être utilisés, annotés et adaptés à votre
              situation familiale.
            </p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
              className="space-y-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C6A664]/12 text-[#8B6914]">
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="text-xl font-semibold text-[#2F2A25]">{active.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5C5348]">{active.description}</p>
              <p className="text-sm leading-relaxed text-[#7A6F62]">{active.detail}</p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`${slide.title} — diapositive ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === activeIndex ? "w-8 bg-[#C6A664]" : "w-2 bg-slate-200 hover:bg-slate-300",
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Diapositive précédente"
                onClick={() => go(-1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#2F2A25] transition hover:bg-slate-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Diapositive suivante"
                onClick={() => go(1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#2F2A25] transition hover:bg-slate-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Maquettes portrait (iPhone déjà dans l'image) — droite */}
        <div className="relative flex min-h-[420px] items-center justify-center bg-gradient-to-br from-[#F4F1EC] via-[#EDE8E0] to-[#E8E2D8] px-6 py-12 lg:min-h-[560px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(198,166,100,0.12),transparent_55%)]" />
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.38, ease: "easeOut" }}
              className="relative z-10 w-[min(100%,320px)]"
            >
              <JessicaRemoteImage
                src={active.imageUrl}
                alt={active.title}
                priority={activeIndex === 0}
                className="h-auto w-full drop-shadow-[0_32px_48px_-16px_rgba(47,42,37,0.35)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
