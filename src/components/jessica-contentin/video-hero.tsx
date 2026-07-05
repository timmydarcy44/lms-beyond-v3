"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

/** Fichier public Supabase — hero vitrine */
const HERO_VIDEO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/video%20presentration%20cabinet%20hero.MOV";

const BOOKING_URL = "https://perfactive.fr/psychopedagogue/rocquancourt/jessica-contentin";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1496307653780-42ee777d4833?w=1920&q=80";

export function VideoHero() {
  const [mediaFailed, setMediaFailed] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const tryPlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      await el.play();
      setNeedsPlay(el.paused);
    } catch {
      setNeedsPlay(true);
    }
  };

  return (
    <motion.section
      id="accueil-video"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative mx-0 mb-0 h-[calc(100vh-4rem)] min-h-[560px] scroll-mt-4 overflow-hidden md:mx-4 md:mb-4 md:rounded-2xl"
    >
      {/* Vidéo pleine frame — lisibilité du texte assurée par le panneau crème (z-10), sans voile sur la vidéo */}
      <div className="absolute inset-0">
        {mediaFailed ? (
          <img
            src={FALLBACK_IMAGE}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              src={HERO_VIDEO_URL}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster={FALLBACK_IMAGE}
              className="absolute inset-0 h-full w-full object-cover [filter:saturate(1.12)_contrast(1.04)_sepia(0.14)_hue-rotate(-6deg)]"
              onError={() => setMediaFailed(true)}
              onLoadedMetadata={() => void tryPlay()}
              onCanPlay={() => void tryPlay()}
              onPlay={() => setNeedsPlay(false)}
              onPause={() => {
                const el = videoRef.current;
                if (el && el.currentTime < 0.25) setNeedsPlay(true);
              }}
            />
            {/* Filtre chaud léger (ambiance dorée / coucher de soleil) sans masquer la vidéo */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/18 via-orange-600/12 to-rose-900/22 mix-blend-soft-light"
              aria-hidden
            />
          </>
        )}
        {mediaFailed ? <div className="absolute inset-0 bg-[#F8F2EA]/80" /> : null}
      </div>

      {/* Texte sur panneau crème lisible */}
      <div className="relative z-10 flex h-full items-center px-6 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl rounded-2xl border border-white/55 bg-white/20 p-6 shadow-[0_18px_60px_-28px_rgba(0,0,0,0.45)] backdrop-blur-xl md:p-8"
        >
          <p
            className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9A7B52] md:text-base"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            JESSICA CONTENTIN
          </p>
          <p
            className="mt-2 text-base font-medium text-[#5C5348] md:text-lg"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            Professeure en santé • Psychopédagogue • Certifiée en neuroéducation
          </p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-[#2F2A25]/85 md:text-xl"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
            }}
          >
            J&apos;accompagne les enfants, adolescents, étudiants et familles afin de mieux comprendre leur fonctionnement
            et de développer des stratégies adaptées à leurs besoins.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-[#C6A664]/60 bg-white px-8 py-6 text-base text-[#2F2A25] hover:bg-[#FDF9F3] md:text-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href="#parcours">Découvrir les accompagnements</a>
            </Button>
            <Button
              asChild
              size="lg"
              className="rounded-full bg-[#C6A664] px-8 py-6 text-base text-white hover:bg-[#B88A44] md:text-lg"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
              }}
            >
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Prendre rendez-vous
              </a>
            </Button>
          </motion.div>

          {needsPlay ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-[#C6A664]/40 bg-[#FDF9F3] px-6 py-5 text-sm font-semibold text-[#2F2A25] hover:bg-[#F8F2EA]"
                onClick={() => void tryPlay()}
              >
                Lancer la vidéo
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="rounded-full border border-[#E6D9C6] bg-white/80 px-6 py-5 text-sm font-semibold text-[#5C5348] hover:bg-[#FDF9F3]"
                onClick={() => {
                  const el = videoRef.current;
                  if (!el) return;
                  el.muted = false;
                  void tryPlay();
                }}
              >
                Activer le son
              </Button>
            </div>
          ) : null}
        </motion.div>
      </div>
    </motion.section>
  );
}
