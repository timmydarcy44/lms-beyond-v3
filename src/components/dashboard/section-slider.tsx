"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  theme?: "light" | "dark";
  variant?: "default" | "compact";
}

const CARD_GRADIENTS: Record<Required<SectionSliderProps>["accent"], string> = {
  learner: "from-slate-100 via-white to-blue-50",
  formateur: "from-sky-100 via-white to-sky-50",
  admin: "from-violet-100 via-white to-indigo-50",
  default: "from-slate-100 via-white to-slate-50",
};

const HALO_GRADIENTS: Record<Required<SectionSliderProps>["accent"], string> = {
  learner: "from-amber-300/45 via-transparent to-transparent",
  formateur: "from-sky-300/45 via-transparent to-transparent",
  admin: "from-purple-300/45 via-transparent to-transparent",
  default: "from-slate-100/35 via-transparent to-transparent",
};

export const SectionSlider = ({
  title,
  cards,
  accent = "default",
  theme = "light",
  variant = "default",
}: SectionSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";
  const isCompact = variant === "compact";

  const scrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="w-full space-y-6">
      <div className="flex w-full items-center justify-between">
        <h3
          className={cn(
            "text-xl font-semibold tracking-tight md:text-2xl",
            isDark ? "text-white" : "text-slate-900",
          )}
        >
          {title}
        </h3>
        {cards.length > 0 && (
          <div className="hidden items-center gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "rounded-full",
                isDark
                  ? "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-100",
              )}
              onClick={() => scrollBy(-320)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "rounded-full",
                isDark
                  ? "border-white/15 bg-white/5 text-white/60 hover:bg-white/10"
                  : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-100",
              )}
              onClick={() => scrollBy(320)}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border p-8 text-center",
            isDark
              ? "border-white/10 bg-white/5 text-white/70"
              : "border-slate-200 bg-white text-slate-500",
          )}
        >
          <p className="text-sm">Aucun contenu disponible pour le moment.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-none flex w-full snap-x gap-6 overflow-x-auto pb-2 pr-2 md:gap-8"
        >
          {cards.map((card, index) => {
            const progressValue =
              typeof card.progress === "number"
                ? Math.min(Math.max(card.progress, 0), 100)
                : 0;
            const categoryLabel = card.badge ?? card.category ?? "Programme";

            if (isCompact) {
              return (
                <Link
                  key={card.id}
                  href={card.href ?? `#${card.id}`}
                  className={cn(
                    "group relative min-w-[220px] max-w-[220px] flex-shrink-0 snap-start overflow-hidden rounded-[28px] transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2",
                    isDark
                      ? "focus-visible:ring-white/20"
                      : "focus-visible:ring-slate-900/10",
                  )}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="relative h-full"
                  >
                    <div
                      className={cn(
                        "relative aspect-[16/9] overflow-hidden rounded-[28px] border transition duration-500",
                        isDark
                          ? "border-white/15 bg-white/5 shadow-[0_45px_110px_-70px_rgba(0,0,0,0.75)]"
                          : "border-white/90 bg-gradient-to-b from-white via-[#f6f7fb] to-[#e4e7f5] shadow-[0_60px_120px_-75px_rgba(15,23,42,0.45)]",
                      )}
                    >
                      {card.image && card.image.trim() !== "" ? (
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f8fafc,#cbd5f5)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 space-y-2 px-4 pb-4">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]",
                            isDark ? "text-white/75" : "text-slate-600",
                          )}
                        >
                          {categoryLabel}
                        </span>
                        <p
                          className={cn(
                            "text-base font-semibold leading-tight",
                            isDark ? "text-white" : "text-slate-900",
                          )}
                        >
                          {card.title}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 px-1">
                      <div
                        className={cn(
                          "flex items-center text-[10px] font-semibold uppercase tracking-[0.22em]",
                          isDark ? "text-white/60" : "text-slate-500",
                        )}
                      >
                        <span>Progression</span>
                        <span className="ml-auto text-[11px]">{progressValue}%</span>
                      </div>
                      <div
                        className={cn(
                          "h-1 overflow-hidden rounded-full",
                          isDark ? "bg-white/15" : "bg-slate-200/80",
                        )}
                      >
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            accent === "formateur"
                              ? isDark
                                ? "bg-sky-300"
                                : "bg-sky-500"
                              : accent === "admin"
                                ? isDark
                                  ? "bg-violet-300"
                                  : "bg-violet-500"
                                : isDark
                                  ? "bg-white"
                                  : "bg-slate-900",
                          )}
                          style={{ width: `${progressValue}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            }

            const haloGradient = HALO_GRADIENTS[accent] ?? HALO_GRADIENTS.default;

            return (
              <Link
                key={card.id}
                href={card.href ?? `#${card.id}`}
                className={cn(
                  "group relative min-w-[360px] max-w-[360px] flex-shrink-0 snap-start overflow-hidden rounded-[32px] transition hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2",
                  isDark
                    ? "bg-white/5 focus-visible:ring-white/20"
                    : "bg-white focus-visible:ring-slate-900/10",
                )}
              >
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="relative flex h-full flex-col rounded-[32px]"
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 rounded-[32px] opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-70",
                      `bg-gradient-to-br ${haloGradient}`,
                    )}
                  />
                  <div
                    className={cn(
                      "relative flex h-full flex-col gap-6 rounded-[32px] border transition duration-500",
                      isDark
                        ? "border-white/10 bg-white/10 px-6 py-6 backdrop-blur-sm shadow-[0_45px_90px_-60px_rgba(0,0,0,0.7)]"
                        : "border-white/80 bg-gradient-to-b from-white via-[#f6f7fb] to-[#eef1ff] px-6 py-6 shadow-[0_60px_110px_-70px_rgba(15,23,42,0.45)]",
                    )}
                  >
                    <div
                      className={cn(
                        "relative overflow-hidden rounded-[26px] border border-white/50 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] transition duration-700 group-hover:shadow-[0_40px_80px_-35px_rgba(15,23,42,0.55)]",
                        isDark ? "bg-white/10" : "bg-white",
                      )}
                      style={{ aspectRatio: "3 / 4" }}
                    >
                      {card.image && card.image.trim() !== "" ? (
                        <Image
                          src={card.image}
                          alt={card.title}
                          fill
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#f8fafc,#cbd5f5)]" />
                      )}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em]",
                            isDark ? "bg-white/15 text-white/70" : "bg-white/80 text-slate-600",
                          )}
                        >
                          {categoryLabel}
                        </span>
                        <p
                          className={cn(
                            "text-lg font-semibold leading-snug",
                            isDark ? "text-white" : "text-slate-900",
                          )}
                        >
                          {card.title}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div
                          className={cn(
                            "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]",
                            isDark ? "text-white/60" : "text-slate-500",
                          )}
                        >
                          <span>Progression</span>
                          <span className="ml-auto">{progressValue}%</span>
                        </div>
                        <div
                          className={cn(
                            "h-1 overflow-hidden rounded-full",
                            isDark ? "bg-white/15" : "bg-slate-200/80",
                          )}
                        >
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              accent === "formateur"
                                ? isDark
                                  ? "bg-sky-300"
                                  : "bg-sky-500"
                                : accent === "admin"
                                  ? isDark
                                    ? "bg-violet-300"
                                    : "bg-violet-500"
                                  : isDark
                                    ? "bg-white"
                                    : "bg-slate-900",
                            )}
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};


