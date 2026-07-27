"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GOOGLE_REVIEW_COUNT,
  GOOGLE_REVIEWS_URL,
} from "@/lib/jessica-contentin/google-reviews-data";
import { JESSICA_CREAM_CTA } from "@/lib/jessica-contentin/cream-cta";

const HERO_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/nouvellephotohero.png";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1920&q=80";

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

export { JESSICA_CREAM_CTA };

function HeroImage({
  mediaFailed,
  onError,
  className,
  fill = false,
  style,
}: {
  mediaFailed: boolean;
  onError: () => void;
  className: string;
  fill?: boolean;
  style?: CSSProperties;
}) {
  if (mediaFailed) {
  // eslint-disable-next-line @next/next/no-img-element
    return <img src={FALLBACK_IMAGE} alt="" className={className} />;
  }

  if (fill) {
    return (
      <Image
        src={HERO_IMAGE_URL}
        alt="Jessica Contentin — psychopédagogue"
        fill
        priority
        sizes="100vw"
        className={className}
        style={style}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={HERO_IMAGE_URL}
      alt="Jessica Contentin — psychopédagogue"
      width={2400}
      height={1600}
      priority
      sizes="100vw"
      className={className}
      onError={onError}
    />
  );
}

export function VideoHero() {
  const [mediaFailed, setMediaFailed] = useState(false);

  return (
    <section
      id="accueil-video"
      className="relative w-full scroll-mt-0 overflow-hidden bg-[#F2ECE4] min-h-[100dvh] md:min-h-0"
    >
      {/* Mobile : image plein écran — cadrage sur la personne et le cahier nevo */}
      <div className="absolute inset-0 md:hidden" aria-hidden>
        <HeroImage
          mediaFailed={mediaFailed}
          onError={() => setMediaFailed(true)}
          fill
          className="object-cover"
          style={{ objectPosition: "64% 46%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F2ECE4]/96 via-[#F2ECE4]/72 to-[#F2ECE4]/25" />
      </div>

      {/* Desktop : image en intégralité */}
      <div className="relative hidden w-full md:block">
        <HeroImage
          mediaFailed={mediaFailed}
          onError={() => setMediaFailed(true)}
          className="block h-auto w-full"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F2ECE4]/88 via-[#F2ECE4]/45 to-transparent"
          aria-hidden
        />
      </div>

      {/* Contenu — plein écran mobile, centré desktop */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-10 pt-20 sm:px-6 sm:pb-12 md:absolute md:inset-0 md:min-h-0 md:justify-center md:px-16 md:pb-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="max-w-xl lg:max-w-2xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-[#2F2A25] sm:text-3xl md:text-4xl lg:text-[2.75rem]"
            style={{ fontFamily: FONT }}
          >
            Comprendre le fonctionnement pour individualiser l&apos;accompagnement.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-[#5C5348] sm:mt-5 sm:text-base md:text-lg"
            style={{ fontFamily: FONT }}
          >
            Chaque accompagnement est fondé sur une compréhension individualisée du fonctionnement
            cognitif, attentionnel et émotionnel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-6 flex flex-col items-start gap-4 sm:mt-8 sm:gap-5"
          >
            <Button
              asChild
              size="lg"
              className={`${JESSICA_CREAM_CTA} w-full px-8 py-6 text-base sm:w-auto sm:px-10 sm:py-7 md:text-lg`}
              style={{ fontFamily: FONT }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>

            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-1.5 text-[#5C5348] transition hover:text-[#2F2A25]"
              style={{ fontFamily: FONT }}
            >
              <span className="inline-flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#C6A664] text-[#C6A664]" />
                ))}
              </span>
              <span className="text-sm md:text-[0.95rem]">
                <span className="font-medium">5/5 sur Google</span>
                <span className="text-[#5C5348]/45"> · </span>
                <span>{GOOGLE_REVIEW_COUNT} avis</span>
              </span>
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
