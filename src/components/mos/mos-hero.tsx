"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MosButton } from "@/components/mos/mos-button";

export function MosHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.25]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-end overflow-hidden bg-[#111111]">
      <motion.div style={{ y: yBg }} className="absolute inset-0">
        <Image
          src="/mos/hero.png"
          alt="Joueurs MOS — maillot rouge sous néons"
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
      </motion.div>

      <div
        className="absolute inset-0 bg-gradient-to-t from-[#111111]/95 via-[#111111]/25 to-[#111111]/10"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#8B0000]/30 via-transparent to-[#C8102E]/20"
        aria-hidden
      />

      <motion.div
        style={{ opacity }}
        className="relative z-10 mx-auto w-full max-w-[1400px] px-5 pb-20 pt-32 sm:px-10 sm:pb-28 lg:pb-36"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60"
        >
          Depuis 1965
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-4xl text-[clamp(3.5rem,11vw,8rem)] font-black uppercase leading-[0.92] tracking-[-0.04em] text-white"
        >
          Ici c&apos;est
          <br />
          <span className="text-white/95">La MOS</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mt-6 text-lg font-light tracking-wide text-white/70 sm:text-xl"
        >
          Maladrerie OmniSports Caen
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="mt-12"
        >
          <MosButton href="#adn" variant="outline-white">
            Découvrir le club
          </MosButton>
        </motion.div>
      </motion.div>
    </section>
  );
}
