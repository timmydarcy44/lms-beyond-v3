"use client";

import { motion } from "framer-motion";

import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

const OPEN_BADGES_VIDEO_URL =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/presentation%20OB.mp4";

export function EdgeOpenBadgesHero() {
  return (
    <section className="relative min-h-[min(92svh,880px)] overflow-hidden bg-edge-black-deep">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <LazyBandwidthVideo
          src={OPEN_BADGES_VIDEO_URL}
          eager
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center opacity-90"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-r from-edge-black-deep via-edge-black-deep/88 to-edge-black-deep/25" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_30%,rgba(99,91,255,0.14),transparent_55%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[min(92svh,880px)] max-w-7xl items-center px-5 pb-20 pt-28 sm:px-8 lg:px-10 lg:pb-24 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl lg:max-w-2xl"
        >
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Développer</p>
          <h1 className="mt-4 text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em] text-white">
            Rendez visible l&apos;invisible
          </h1>
          <p className="mt-6 text-base leading-relaxed text-white/55 sm:text-lg">
            Attribuez des badges certifiants pour rendre visibles les compétences acquises et partagées.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
