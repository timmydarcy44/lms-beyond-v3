"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HERO_IMAGE_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/hero%20section%202%20(1).png";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1920&q=80";

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';

export function VideoHero() {
  const [mediaFailed, setMediaFailed] = useState(false);

  return (
    <motion.section
      id="accueil-video"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen w-full overflow-hidden scroll-mt-0"
    >
      <div className="absolute inset-0">
        {mediaFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={FALLBACK_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <Image
              src={HERO_IMAGE_URL}
              alt="Jessica Contentin — psychopédagogue"
              fill
              priority
              sizes="100vw"
              className="object-cover object-[72%_42%] md:object-left [filter:saturate(1.08)_contrast(1.03)_sepia(0.08)_hue-rotate(-4deg)]"
              onError={() => setMediaFailed(true)}
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/14 via-orange-600/10 to-rose-900/18 mix-blend-soft-light"
              aria-hidden
            />
          </>
        )}
        {/* Lisibilité du texte blanc sans encadré */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent md:from-black/50 md:via-black/20"
          aria-hidden
        />
        {mediaFailed ? <div className="absolute inset-0 bg-[#2F2A25]/55" /> : null}
      </div>

      <div className="relative z-10 flex min-h-screen items-center px-6 pt-24 pb-16 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-2xl"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-3xl font-semibold leading-[1.15] tracking-tight text-white md:text-4xl lg:text-[2.75rem]"
            style={{ fontFamily: FONT }}
          >
            Comprendre le fonctionnement pour individualiser l&apos;accompagnement.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/90 md:text-lg"
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
            className="mt-8"
          >
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#C4704B] px-8 py-6 text-base text-white shadow-[0_12px_32px_-12px_rgba(196,112,75,0.65)] hover:bg-[#A85A38] md:text-lg"
              style={{ fontFamily: FONT }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
