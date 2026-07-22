"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import {
  GOOGLE_RATING,
  GOOGLE_REVIEW_COUNT,
  GOOGLE_REVIEWS_URL,
  JESSICA_FEATURED_REVIEWS,
} from "@/lib/jessica-contentin/google-reviews-data";

const PREVIEW_LENGTH = 160;

function Stars({ rating = 5, className = "h-4 w-4" }: { rating?: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${className} ${i < rating ? "fill-[#C6A664] text-[#C6A664]" : "text-[#E6D9C6]"}`}
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
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > PREVIEW_LENGTH;
  const displayText =
    !needsTruncation || expanded ? text : `${text.slice(0, PREVIEW_LENGTH).trimEnd()}…`;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#E6D9C6] bg-white p-6 shadow-[0_12px_40px_-28px_rgba(60,48,36,0.28)]">
      <Stars rating={rating} />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-[#2F2A25]">{author_name}</h3>
        <time className="shrink-0 text-xs text-[#5C5348]/80">{relative_time_description}</time>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#5C5348]">
        &ldquo;{displayText}&rdquo;
        {needsTruncation ? (
          <>
            {" "}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="font-semibold text-[#8B6F47] underline-offset-2 hover:underline"
            >
              {expanded ? "Réduire" : "Lire la suite"}
            </button>
          </>
        ) : null}
      </p>
    </article>
  );
}

export function GoogleReviewsSection() {
  const reviews = JESSICA_FEATURED_REVIEWS.slice(0, 8);

  return (
    <section className="border-y border-[#E6D9C6]/60 bg-[#F8F5F0] py-16 md:py-20" aria-labelledby="avis-google-title">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 id="avis-google-title" className="text-3xl font-semibold tracking-tight text-[#2F2A25] md:text-4xl">
            Ils m&apos;ont accordé leur confiance.
          </h2>
          <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-sm text-[#2F2A25] md:text-base">
            <Stars className="h-[1.05rem] w-[1.05rem]" />
            <span className="font-semibold">
              {GOOGLE_RATING}/5 sur Google – {GOOGLE_REVIEW_COUNT} avis
            </span>
          </p>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-[#8B6F47] underline-offset-4 hover:underline"
          >
            Voir tous les avis Google
          </a>
        </motion.div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {reviews.map((review, index) => (
            <motion.div
              key={`${review.author_name}-${index}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.04 }}
            >
              <ReviewCard {...review} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
