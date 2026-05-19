"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

export type SequenceSlide = {
  id: string;
  title: string;
  href: string;
  index: number;
};

type SequenceSliderProps = {
  slides: SequenceSlide[];
  coverUrl: string;
  isCoverVideo: boolean;
};

export function SequenceSlider({ slides, coverUrl, isCoverVideo }: SequenceSliderProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.85) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Défiler vers la gauche"
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90 md:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        aria-label="Défiler vers la droite"
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/70 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/90 md:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pl-0 pr-2 [-ms-overflow-style:none] [scrollbar-width:none] md:px-12 [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="group relative aspect-video w-[min(78vw,300px)] shrink-0 snap-start overflow-hidden rounded-xl border border-white/[0.08] bg-black sm:w-[min(70vw,340px)] md:w-[380px]"
          >
            <div className="pointer-events-none absolute inset-0">
              {isCoverVideo && coverUrl ? (
                <LazyBandwidthVideo
                  src={coverUrl}
                  rootMargin="0px 240px 0px 240px"
                  className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:opacity-100"
                  wrapperClassName="pointer-events-none absolute inset-0"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-95 transition duration-300 group-hover:opacity-100" />
              ) : (
                <div className="h-full w-full bg-neutral-900" />
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 md:p-5">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Séquence {slide.index}
              </span>
              <span className="line-clamp-2 text-left text-sm font-semibold leading-snug text-white md:text-base">{slide.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
