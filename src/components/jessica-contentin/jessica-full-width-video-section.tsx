"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type JessicaFullWidthVideoSectionProps = {
  videoUrl: string;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ariaLabel?: string;
};

/** Bannière vidéo pleine largeur (style Revolut) : texte centré en haut, CTA optionnel. */
export function JessicaFullWidthVideoSection({
  videoUrl,
  title,
  subtitle,
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
      className="relative w-full overflow-hidden bg-[#1a1510]"
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a1510]/80 via-transparent to-transparent" />

        <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-14 text-center sm:px-10 sm:pt-20 md:pt-24 lg:px-16">
          <h3
            className="max-w-5xl text-[clamp(1.5rem,4.5vw,3.25rem)] font-normal leading-[1.2] tracking-tight text-white"
            style={{
              fontFamily: 'var(--font-fraunces), "Times New Roman", Times, Georgia, serif',
            }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/85 md:text-lg">
              {subtitle}
            </p>
          ) : null}
          {ctaLabel && ctaHref ? (
            <Link
              href={ctaHref}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-[#2F2A25] shadow-lg transition hover:bg-white/90 md:mt-10 md:px-10 md:py-4 md:text-base"
            >
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
