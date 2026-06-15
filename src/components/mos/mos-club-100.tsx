"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { PARTNERS } from "@/components/mos/constants";
import { MosButton } from "@/components/mos/mos-button";
import { Reveal, staggerContainer, fadeUp } from "@/components/mos/motion";

export function MosClub100() {
  return (
    <section id="les-100" className="relative scroll-mt-24 overflow-hidden px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
      <Image
        src="/mos/les-100-brique.jpg"
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority
        unoptimized
      />
      <div className="absolute inset-0 bg-[#8B0000]/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/70 via-[#111111]/35 to-transparent" />

      <div className="relative mx-auto grid max-w-[1400px] gap-16 lg:grid-cols-2 lg:items-center lg:gap-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">Partenaires</p>
          <h2 className="mt-4 text-[clamp(3rem,8vw,5.5rem)] font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-lg">
            Les 100
          </h2>
          <p className="mt-4 text-xl font-light text-white/90">Ils soutiennent le projet de la MOS.</p>
          <p className="mt-8 max-w-md text-base leading-relaxed text-white/80">
            Le Club des 100 rassemble les entreprises et acteurs locaux qui croient au football de quartier, à la
            formation des jeunes et à l&apos;ambition sportive de Caen. Ensemble, ils portent le projet au plus haut.
          </p>
          <div className="mt-10">
            <MosButton href="#contact" variant="white">
              Découvrir les 100
            </MosButton>
          </div>
        </Reveal>

        <motion.div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {PARTNERS.map((partner) => (
            <motion.div
              key={partner.name}
              variants={fadeUp}
              whileHover={{ y: -4, scale: 1.02 }}
              className="flex aspect-[3/2] items-center justify-center rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-sm transition-shadow hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={160}
                height={48}
                className="h-9 w-auto max-w-[130px] object-contain sm:h-11"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
