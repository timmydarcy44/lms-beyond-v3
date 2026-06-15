"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LIFESTYLE } from "@/components/mos/constants";
import { Reveal, staggerContainer, fadeUp } from "@/components/mos/motion";

export function MosLifestyle() {
  return (
    <section className="bg-white px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">Lifestyle</p>
          <h2 className="mt-4 max-w-xl text-[clamp(2rem,5vw,3.5rem)] font-black uppercase leading-[1.05] tracking-[-0.03em] text-[#111111]">
            Caen en rouge
          </h2>
          <p className="mt-4 max-w-lg text-base text-[#666666]">
            Le maillot MOS au-delà du terrain. Un style editorial, ancré dans la ville.
          </p>
        </Reveal>

        <motion.div
          className="mt-16 grid auto-rows-[280px] grid-cols-1 gap-4 sm:auto-rows-[360px] lg:auto-rows-[480px] lg:grid-cols-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {LIFESTYLE.map((item, i) => (
            <motion.figure
              key={item.title}
              variants={fadeUp}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-[#111111]",
                i === 0 && "lg:col-span-7",
                i === 1 && "lg:col-span-5",
              )}
            >
              <Image
                src={item.image}
                alt={item.caption}
                fill
                className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.03]"
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/70 via-transparent to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50">{item.title}</p>
                <p className="mt-2 text-lg font-bold text-white sm:text-xl">{item.caption}</p>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
