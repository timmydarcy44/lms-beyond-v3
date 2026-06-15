"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MosButton } from "@/components/mos/mos-button";
import { Reveal } from "@/components/mos/motion";

export function MosBoutique() {
  return (
    <section id="boutique" className="scroll-mt-24 bg-[#F5F5F5] px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal variant="fadeIn">
          <motion.div
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#F5F5F5] shadow-[0_40px_80px_rgba(0,0,0,0.15)]"
          >
            <Image
              src="/mos/boutique-maillot-2026.png"
              alt="Maillot domicile MOS 2026 — boutique officielle"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
            <div className="absolute bottom-8 left-8 right-8">
              <span className="rounded-full bg-[#C8102E] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                Nouveau 2026
              </span>
            </div>
          </motion.div>
        </Reveal>

        <Reveal delay={0.15}>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">Boutique officielle</p>
          <h2 className="mt-4 text-[clamp(2.5rem,6vw,4rem)] font-black uppercase leading-[1.05] tracking-[-0.03em] text-[#111111]">
            Le maillot MOS 2026
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-[#666666]">
            Rouge éclatant. Coupe moderne. L&apos;identité de la Maladrerie portée fièrement sur le terrain et dans les
            rues de Caen.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-medium text-[#111111]/70">
            <li>— Maillot domicile officiel</li>
            <li>— Flocage personnalisable</li>
            <li>— Livraison & retrait au club</li>
          </ul>
          <div className="mt-12">
            <MosButton href="/mos/boutique">Découvrir la boutique</MosButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
