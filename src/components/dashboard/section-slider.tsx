"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SliderCard = {
  id: string;
  title: string;
  image?: string | null;
  cta?: string;
  meta?: string;
  category?: string | null;
  badge?: string;
  progress?: number;
  href?: string;
};

interface SectionSliderProps {
  title: string;
  cards: SliderCard[];
  accent?: "default" | "learner" | "formateur" | "admin";
}

export const SectionSlider = ({ title, cards, accent = "default" }: SectionSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const baseCtaClasses = "inline-flex h-9 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition";

  const accentClasses: Record<Required<SectionSliderProps>["accent"], string> = {
    learner:
      "bg-[linear-gradient(135deg,#FF512F,#DD2476)] text-white shadow-[0_16px_50px_rgba(221,36,118,0.35)] hover:brightness-110",
    formateur:
      "bg-[linear-gradient(135deg,#00C6FF,#0072FF)] text-white shadow-[0_16px_50px_rgba(0,114,255,0.35)] hover:brightness-110",
    admin:
      "bg-[linear-gradient(135deg,#8E2DE2,#4A00E0)] text-white shadow-[0_16px_50px_rgba(138,43,226,0.35)] hover:brightness-110",
    default: "bg-white/90 text-black hover:bg-white",
  };

  const ctaClasses = cn(baseCtaClasses, accentClasses[accent] ?? accentClasses.default);

  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center justify-between w-full">
        <h3 className="text-lg font-semibold text-white md:text-xl">{title}</h3>
        {cards.length > 0 && (
          <div className="hidden items-center gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => scrollBy(-320)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => scrollBy(320)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          <p className="text-sm">Aucun contenu disponible pour le moment.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-none flex gap-4 overflow-x-auto pb-2 pr-2 md:gap-6 w-full"
        >
          {cards.map((card, index) => (
          <Link
            key={card.id}
            href={card.href ?? `#${card.id}`}
            className="group relative min-w-[240px] max-w-[240px] flex-shrink-0 overflow-hidden rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="relative aspect-[3/4]"
            >
              {card.image && card.image.trim() !== "" ? (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105 group-hover:brightness-110"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 space-y-3">
                <div className="space-y-2">
                  {card.badge ? (
                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                      {card.badge}
                    </span>
                  ) : null}
                  <p className="text-sm font-semibold text-white md:text-base">
                    {card.title}
                  </p>
                  {card.meta ? (
                    <p className="text-xs text-white/70 md:text-sm">{card.meta}</p>
                  ) : null}
                </div>
                {typeof card.progress === "number" ? (
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white"
                      style={{ width: `${Math.min(Math.max(card.progress, 0), 100)}%` }}
                    />
                  </div>
                ) : null}
                <span className={cn(ctaClasses)}>
                  <Play className="h-4 w-4" />
                  {card.cta ?? "Reprendre"}
                </span>
              </div>
            </motion.div>
          </Link>
          ))}
        </div>
      )}
    </section>
  );
};


