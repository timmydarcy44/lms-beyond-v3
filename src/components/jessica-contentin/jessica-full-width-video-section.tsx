"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { JESSICA_CREAM_CTA } from "@/lib/jessica-contentin/cream-cta";
import { cn } from "@/lib/utils";

type JessicaFullWidthVideoSectionProps = {
  videoUrl: string;
  title: string;
  subtitle?: string;
  footnote?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ariaLabel?: string;
};

/** Bannière vidéo pleine largeur : texte centré en haut, voile crème, CTA optionnel. */
export function JessicaFullWidthVideoSection({
  videoUrl,
  title,
  subtitle,
  footnote,
  ctaLabel,
  ctaHref,
  ariaLabel,
}: JessicaFullWidthVideoSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      aria-label={ariaLabel ?? title}
      className="relative w-full overflow-hidden bg-[#F2ECE4]"
    >
      <div className="relative min-h-[min(88vh,920px)] w-full">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />

        <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-14 text-center sm:px-10 sm:pt-20 md:pt-24 lg:px-16">
          <h3
            className="max-w-5xl text-[clamp(1.5rem,4.5vw,3.25rem)] font-normal leading-[1.2] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)]"
            style={{
              fontFamily: 'var(--font-fraunces), "Times New Roman", Times, Georgia, serif',
            }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/90 drop-shadow-[0_1px_12px_rgba(0,0,0,0.3)] md:text-lg">
              {subtitle}
            </p>
          ) : null}
          {footnote ? (
            <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-white/80 drop-shadow-[0_1px_10px_rgba(0,0,0,0.28)] md:text-sm">
              {footnote}
            </p>
          ) : null}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className={cn(
                JESSICA_CREAM_CTA,
                "mt-8 inline-flex items-center justify-center px-8 py-3.5 text-sm md:mt-10 md:px-10 md:py-4 md:text-base",
              )}
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
