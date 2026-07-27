"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import {
  GOOGLE_RATING,
  GOOGLE_REVIEW_COUNT,
  GOOGLE_REVIEWS_URL,
  JESSICA_FEATURED_REVIEWS,
  type JessicaGoogleReview,
} from "@/lib/jessica-contentin/google-reviews-data";
import { cn } from "@/lib/utils";

const SERIF = 'var(--font-fraunces), "Fraunces", Georgia, "Times New Roman", serif';

const AVIS_BG_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/newheroavis.jpeg";

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        opacity=".9"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        opacity=".75"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        opacity=".85"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        opacity=".7"
      />
    </svg>
  );
}

function AvisPhotoBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Image
        src={AVIS_BG_URL}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority={false}
      />
      <div className="absolute inset-0 bg-[#F2ECE4]/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,252,246,0.55)_0%,transparent_55%)]" />
    </div>
  );
}

function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-[#C6A664] text-[#C6A664]" : "text-[#E6D9C6]"}`}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: JessicaGoogleReview }) {
  const excerpt = review.text.length > 200 ? `${review.text.slice(0, 197).trim()}…` : review.text;

  return (
    <article className="relative flex h-full min-h-[340px] flex-col rounded-[1.35rem] bg-[#FBF7F1]/95 px-7 py-8 text-center shadow-[0_22px_50px_-28px_rgba(70,55,35,0.45)] backdrop-blur-[2px] sm:min-h-[360px] sm:px-8">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} />
        <GoogleG className="h-4 w-4 text-[#C6A664]" />
      </div>

      <h3
        className="mt-6 text-[1.65rem] font-medium leading-none tracking-tight text-[#2F2A25]"
        style={{ fontFamily: SERIF }}
      >
        {review.author_name}
      </h3>

      <div className="mx-auto mt-4 h-px w-10 bg-[#C6A664]/70" />

      <div className="relative mt-5 flex flex-1 flex-col justify-center">
        <span
          className="pointer-events-none absolute -left-1 -top-3 text-4xl leading-none text-[#C6A664]/55"
          style={{ fontFamily: SERIF }}
          aria-hidden
        >
          “
        </span>
        <p
          className="px-2 text-[15px] italic leading-relaxed text-[#5C5348]"
          style={{ fontFamily: SERIF }}
        >
          {excerpt}
        </p>
        <span
          className="pointer-events-none absolute -bottom-4 -right-1 text-4xl leading-none text-[#C6A664]/55"
          style={{ fontFamily: SERIF }}
          aria-hidden
        >
          ”
        </span>
      </div>
    </article>
  );
}

export function GoogleReviewsSection() {
  const reviews = JESSICA_FEATURED_REVIEWS;
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setPerPage(1);
      else if (window.innerWidth < 1024) setPerPage(2);
      else setPerPage(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(reviews.length / perPage));
  const safePage = Math.min(page, pageCount - 1);
  const visible = reviews.slice(safePage * perPage, safePage * perPage + perPage);

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1));
  }, [page, pageCount]);

  const go = (dir: -1 | 1) => {
    setPage((p) => (p + dir + pageCount) % pageCount);
  };

  return (
    <section
      className="relative overflow-hidden border-y border-[#E6D9C6]/50 py-16 md:py-24"
      aria-labelledby="avis-google-title"
    >
      <AvisPhotoBackdrop />

      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2
            id="avis-google-title"
            className="text-3xl font-medium tracking-tight text-[#2F2A25] md:text-[2.55rem] md:leading-[1.2]"
            style={{ fontFamily: SERIF }}
          >
            L&apos;accompagnement qui fait la{" "}
            <em className="italic font-medium text-[#2F2A25]">différence</em>.
          </h2>
          <div className="mx-auto mt-5 h-px w-14 bg-[#C6A664]/80" />
          <p className="mt-5 text-base text-[#5C5348] md:text-lg">
            Des retours concrets de parents et d&apos;apprenants.
          </p>
          <p className="mt-2 text-sm font-medium text-[#8B6F47] md:text-base">
            Note Google {GOOGLE_RATING}/5 — {GOOGLE_REVIEW_COUNT} avis vérifiés.
          </p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2.5 rounded-full border border-[#E5DED4] bg-[#F5F0E9]/90 px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2F2A25] shadow-[0_10px_28px_-18px_rgba(60,48,36,0.4)] transition hover:bg-[#EBE4D8]"
          >
            <GoogleG className="h-4 w-4 text-[#C6A664]" />
            Lire les avis Google
          </a>
        </motion.div>

        <div className="mt-12 md:mt-14">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${safePage}-${perPage}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className={cn(
                "grid gap-5",
                perPage === 1 && "grid-cols-1",
                perPage === 2 && "grid-cols-2",
                perPage === 3 && "grid-cols-3",
              )}
            >
              {visible.map((review) => (
                <ReviewCard key={`${review.author_name}-${review.relative_time_description}`} review={review} />
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E5DED4] bg-[#F5F0E9]/85 text-[#2F2A25] transition hover:bg-[#EBE4D8]"
              aria-label="Avis précédents"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Pages d’avis">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === safePage}
                  onClick={() => setPage(i)}
                  className={cn(
                    "h-2 w-2 rounded-full transition",
                    i === safePage ? "bg-[#8B6F47]" : "bg-[#8B6F47]/25 hover:bg-[#8B6F47]/45",
                  )}
                  aria-label={`Page ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#E5DED4] bg-[#F5F0E9]/85 text-[#2F2A25] transition hover:bg-[#EBE4D8]"
              aria-label="Avis suivants"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
