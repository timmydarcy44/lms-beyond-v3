"use client";

import Image from "next/image";
import { useRef } from "react";
import { EDGE_EXPERTS } from "@/lib/parcours";
import { cn } from "@/lib/utils";

function scrollCarousel(el: HTMLDivElement | null, direction: -1 | 1) {
  if (!el) return;
  const card = el.querySelector<HTMLElement>("[data-expert-card]");
  const step = card ? card.offsetWidth + 12 : 232;
  el.scrollBy({ left: direction * step, behavior: "smooth" });
}

export function EdgeExpertsSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-[#0a0a0a] py-12" aria-labelledby="experts-title">
      <div className="mb-6 flex items-end justify-between gap-6 px-10">
        <div className="min-w-0">
          <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">NOS EXPERTS</p>
          <h2
            id="experts-title"
            className="mt-2 text-[clamp(1.35rem,2.5vw,1.75rem)] font-medium leading-tight tracking-[-0.01em] text-white"
          >
            Apprenez avec ceux qui l&apos;ont vraiment fait.
          </h2>
          <p className="mt-2 max-w-lg text-[13px] leading-snug text-white/45">
            Chaque parcours EDGE est construit et validé par des professionnels en activité.
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollCarousel(trackRef.current, -1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white"
            aria-label="Experts précédents"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            onClick={() => scrollCarousel(trackRef.current, 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:text-white"
            aria-label="Experts suivants"
          >
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className={cn(
          "flex gap-3 overflow-x-auto scroll-smooth px-10 pb-1",
          "snap-x snap-mandatory",
          "scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {EDGE_EXPERTS.map((expert) => (
          <article
            key={expert.nom}
            data-expert-card
            className="relative aspect-[2/3] w-[min(58vw,200px)] shrink-0 snap-start overflow-hidden rounded-md bg-[#1a1a18] sm:w-[200px] md:w-[220px]"
          >
            <Image
              src={expert.image}
              alt={`${expert.nom} — ${expert.titre}, ${expert.institution}`}
              fill
              className="object-cover object-[center_15%]"
              sizes="(max-width: 640px) 58vw, 220px"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 42%, transparent 72%)",
              }}
              aria-hidden
            />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-16 text-center">
              <p className="text-[15px] font-medium leading-tight text-white">{expert.nom}</p>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/[0.5]">{expert.titre}</p>
              <p className="mt-2 text-[10px] font-normal uppercase tracking-[0.1em] text-[#FF3B30]">
                {expert.institution}
              </p>
              <p className="mt-2 line-clamp-2 text-[10px] leading-snug text-white/[0.35]">{expert.specialiteEdge}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
