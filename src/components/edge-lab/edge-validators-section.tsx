"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const VALIDATORS = [
  {
    name: "Miguel FARINA",
    role: "Head of Sales at Olympique Lyonnais",
    image: "/edge-lab/experts/miguel-farina.png",
  },
  {
    name: "Jonathan LIBERT",
    role: "Directeur commercial à l'AS Nancy Lorraine",
    image: "/edge-lab/experts/jonathan-libert.png",
  },
  {
    name: "Philippe Corrot",
    role: "Ancien directeur commercial Nike Europe",
    image: "/edge-lab/experts/philippe-corrot.png",
  },
  {
    name: "Nicolas MEL",
    role: "Fondateur de Silence IA, intervenant à Sciences Po",
    image: "/edge-lab/experts/nicolas-mel.png",
  },
  {
    name: "Emilien Carde",
    role: "Pilote automobile professionnel",
    image: "/edge-lab/experts/emilien-carde.png",
  },
] as const;

export function EdgeValidatorsSection() {
  return (
    <section id="validateurs" className="scroll-mt-20 border-t border-white/[0.06] bg-[#08080f] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/35">Experts</p>
          <h2 className="mt-4 text-3xl font-medium tracking-[-0.02em] text-white sm:text-4xl md:text-[2.5rem] md:leading-tight">
            Ils valident les parcours
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
            Entrepreneurs, commerciaux, spécialistes…{" "}
            <span className="block text-white/45">
              Des profils qui ont validé leurs compétences sur EDGE.
            </span>
          </p>
        </motion.div>

        <div className="mt-12 flex gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {VALIDATORS.map((p, i) => (
            <motion.figure
              key={p.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="group relative w-[260px] shrink-0 overflow-hidden rounded-[32px] border border-white/[0.10] bg-[#0c0c12] shadow-[0_28px_80px_-28px_rgba(0,0,0,0.85)] sm:w-[300px]"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5]">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover object-center transition duration-700 ease-out group-hover:scale-[1.04]"
                  sizes="(min-width: 1280px) 23vw, (min-width: 640px) 45vw, 100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060a] from-[18%] via-[#06060a]/35 via-[55%] to-transparent to-[82%]" />
                <figcaption className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-12 sm:px-6 sm:pb-7">
                  <p className="text-lg font-semibold tracking-tight text-white sm:text-xl">{p.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/68 sm:text-[15px]">{p.role}</p>
                </figcaption>
              </div>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
