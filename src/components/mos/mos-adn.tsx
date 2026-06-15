"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ADN_CARDS } from "@/components/mos/constants";
import { Reveal, staggerContainer, fadeUp } from "@/components/mos/motion";

export function MosAdn() {
  return (
    <section id="adn" className="scroll-mt-24 bg-[#F5F5F5] px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">ADN</p>
          <h2 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[1.05] tracking-[-0.03em] text-[#111111]">
            L&apos;esprit MOS
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[#666666]">
            Plus qu&apos;un club de football : un projet humain, inclusif et ancré dans la Maladrerie depuis 1965.
          </p>
        </Reveal>

        <motion.div
          className="mt-14 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {ADN_CARDS.map((card) => (
            <motion.article
              key={card.id}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="group relative min-h-[420px] w-[min(300px,78vw)] shrink-0 snap-start overflow-hidden rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] lg:min-h-[480px] lg:w-auto"
            >
              <Image
                src={card.image}
                alt=""
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width:1024px) 78vw, 25vw"
                unoptimized={/\.(png|jpe?g)$/i.test(card.image)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/90 via-[#111111]/35 to-[#111111]/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#C8102E]">{card.tag}</p>
                <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-white lg:text-[1.35rem]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{card.text}</p>
                <Link
                  href="#contact"
                  className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  En savoir plus
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
