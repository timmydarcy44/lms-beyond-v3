"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  GOOGLE_RATING,
  GOOGLE_REVIEW_COUNT,
  GOOGLE_REVIEWS_URL,
  JESSICA_FEATURED_REVIEWS,
} from "@/lib/jessica-contentin/google-reviews-data";

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-[#C6A664] text-[#C6A664]" : "text-[#E6D9C6]"}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({
  author_name,
  rating,
  relative_time_description,
  text,
}: (typeof JESSICA_FEATURED_REVIEWS)[number]) {
  const excerpt = text.length > 180 ? `${text.slice(0, 177).trim()}…` : text;

  return (
    <article className="flex h-[380px] w-[260px] shrink-0 flex-col rounded-[1.75rem] border border-[#E6D9C6] bg-white p-6 shadow-[0_18px_48px_-28px_rgba(60,48,36,0.35)] sm:h-[400px] sm:w-[280px]">
      <Stars rating={rating} />
      <p className="mt-5 flex-1 text-[15px] leading-relaxed text-[#5C5348]">
        &ldquo;{excerpt}&rdquo;
      </p>
      <div className="mt-5 border-t border-[#E6D9C6]/80 pt-4">
        <p className="text-sm font-semibold text-[#2F2A25]">{author_name}</p>
        <p className="mt-0.5 text-xs text-[#5C5348]/70">{relative_time_description}</p>
      </div>
    </article>
  );
}

export function GoogleReviewsSection() {
  const reviews = JESSICA_FEATURED_REVIEWS.slice(0, 8);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section
      className="overflow-hidden border-y border-[#E6D9C6]/60 bg-[#F8F5F0] py-16 md:py-24"
      aria-labelledby="avis-google-title"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-md"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8B6F47]">
              Témoignages
            </p>
            <h2
              id="avis-google-title"
              className="mt-3 text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl"
            >
              Plus de 100 familles accompagnées
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5C5348]">
              Des retours concrets de parents et d’apprenants. Note Google {GOOGLE_RATING}/5 —{" "}
              {GOOGLE_REVIEW_COUNT} avis vérifiés.
            </p>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[#2F2A25] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-black"
            >
              Lire les avis Google
            </a>
          </motion.div>

          <div className="relative min-w-0">
            <div className="mb-4 flex justify-end gap-2 lg:absolute lg:-top-2 lg:right-0 lg:mb-0">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6D9C6] bg-white text-[#2F2A25] shadow-sm transition hover:bg-[#F8F5F0]"
                aria-label="Avis précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E6D9C6] bg-white text-[#2F2A25] shadow-sm transition hover:bg-[#F8F5F0]"
                aria-label="Avis suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div
              ref={scrollerRef}
              className="flex gap-4 overflow-x-auto pb-4 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((review, index) => (
                <motion.div
                  key={`${review.author_name}-${index}`}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.25) }}
                >
                  <ReviewCard {...review} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
