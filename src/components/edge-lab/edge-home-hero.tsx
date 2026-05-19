"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  EDGE_LAB_HERO_VIDEO_URL,
  EDGE_MARKETING_HREFS,
  edgeLabHeroImageSrc,
} from "@/lib/edge-lab-marketing";
import { EdgeHeroFaqBar } from "@/components/edge-lab/edge-hero-faq-bar";
import { LazyBandwidthVideo } from "@/components/media/lazy-bandwidth-video";

export function EdgeHomeHero() {
  return (
    <section className="relative -mt-14 flex min-h-[min(100dvh,920px)] flex-col overflow-hidden bg-black pt-14">
      {/* Calque vidéo sous le masque : une partie du cadre (côté gauche du média) reste dans la zone lisible à la jointure */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <LazyBandwidthVideo
          src={EDGE_LAB_HERO_VIDEO_URL}
          poster={edgeLabHeroImageSrc()}
          eager
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-left opacity-95"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Moitié gauche noir plein, puis dégradé jusqu’à transparent — la vidéo n’apparaît nettement que vers la droite */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_0%,#000_50%,rgba(0,0,0,0.88)_58%,rgba(0,0,0,0.45)_73%,rgba(0,0,0,0.12)_87%,transparent_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/45" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-5 py-12 sm:px-8 lg:py-16">
          <div className="w-full max-w-xl lg:mr-auto lg:w-[calc(50%-1.5rem)] lg:max-w-none">
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 max-w-[18ch] text-[2.4rem] font-medium leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl md:leading-[1.02]"
            >
              Devenez réellement compétent.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 max-w-xl space-y-1 text-lg leading-relaxed text-white/65 md:text-xl"
            >
              <p className="text-white/80">IA, vente, management, comportement…</p>
              <p>
                Des compétences validées par des professionnels terrain — via des Open Badges, ou certifiées par
                l&apos;État selon vos parcours.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <Link
                href={EDGE_MARKETING_HREFS.onlineCatalog}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-blue-600 px-8 text-sm font-semibold text-white shadow-[0_0_36px_-10px_rgba(37,99,235,0.65)] transition hover:bg-blue-500 hover:shadow-[0_0_44px_-8px_rgba(59,130,246,0.55)]"
              >
                Découvrir les parcours
              </Link>
              <Link
                href={EDGE_MARKETING_HREFS.quiz}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border-2 border-blue-500 bg-blue-600/20 px-8 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-blue-400 hover:bg-blue-500/30"
              >
                Faire le test
              </Link>
            </motion.div>
          </div>
        </div>

        <EdgeHeroFaqBar />
      </div>
    </section>
  );
}
