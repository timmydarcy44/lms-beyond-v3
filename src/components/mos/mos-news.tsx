"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { NEWS } from "@/components/mos/constants";
import { MosButton } from "@/components/mos/mos-button";
import { Reveal, staggerContainer, fadeUp } from "@/components/mos/motion";

export function MosNews() {
  return (
    <section id="actualites" className="scroll-mt-24 bg-white px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">Actualités</p>
          <h2 className="mt-4 max-w-2xl text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[1.05] tracking-[-0.03em] text-[#111111]">
            Des nouvelles de la MOS
          </h2>
        </Reveal>

        <motion.div
          className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {NEWS.map((item) => (
            <motion.article
              key={item.id}
              variants={fadeUp}
              className="group cursor-pointer"
            >
              <Link href={item.href} className="block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F5F5F5]">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    className="object-cover transition duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-90" />
                  <span className="absolute left-5 top-5 rounded-full bg-[#C8102E] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    {item.category}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold leading-snug text-[#111111] transition-colors group-hover:text-[#C8102E]">
                  {item.title}
                </h3>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-[#111111]/45 transition-colors group-hover:text-[#C8102E]">
                  Lire la suite
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </motion.article>
          ))}
        </motion.div>

        <Reveal className="mt-16 flex justify-center" delay={0.2}>
          <MosButton href="#actualites" variant="outline-red">
            Voir toutes les actualités
          </MosButton>
        </Reveal>
      </div>
    </section>
  );
}
