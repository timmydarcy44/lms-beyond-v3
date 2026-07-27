"use client";

import { useState } from "react";
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

export function VideoHero() {
  const [mediaFailed, setMediaFailed] = useState(false);

  return (
    <motion.section
      id="accueil-video"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full scroll-mt-0 overflow-hidden bg-[#F2ECE4]"
    >
      {/* Image en intégralité : pas de object-cover qui coupe cheveux / chaussures */}
      <div className="relative w-full">
        {mediaFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={FALLBACK_IMAGE} alt="" className="block h-auto w-full" />
        ) : (
          <Image
            src={HERO_IMAGE_URL}
            alt="Jessica Contentin — psychopédagogue"
            width={2400}
            height={1600}
            priority
            sizes="100vw"
            className="block h-auto w-full"
            onError={() => setMediaFailed(true)}
          />
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#F2ECE4]/88 via-[#F2ECE4]/45 to-transparent md:from-[#F2ECE4]/78 md:via-[#F2ECE4]/28 md:to-transparent"
          aria-hidden
        />

        <div className="absolute inset-0 z-10 flex items-center px-6 pt-24 pb-16 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-xl lg:max-w-2xl"
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl font-semibold leading-[1.15] tracking-tight text-[#2F2A25] md:text-4xl lg:text-[2.75rem]"
              style={{ fontFamily: FONT }}
            >
              Comprendre le fonctionnement pour individualiser l&apos;accompagnement.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-[#5C5348] md:text-lg"
              style={{ fontFamily: FONT }}
            >
              Chaque accompagnement est fondé sur une compréhension individualisée du fonctionnement
              cognitif, attentionnel et émotionnel.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-8 flex flex-col items-start gap-5"
            >
              <Button
                asChild
                size="lg"
                className={`${JESSICA_CREAM_CTA} px-10 py-7 text-base md:text-lg`}
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
      </div>
    </motion.section>
  );
}
