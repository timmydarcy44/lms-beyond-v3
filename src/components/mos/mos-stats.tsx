"use client";

import { motion } from "framer-motion";
import { STATS } from "@/components/mos/constants";
import { useCountUp } from "@/components/mos/use-count-up";
import { Reveal, staggerContainer, fadeUp } from "@/components/mos/motion";

function StatItem({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, value: count } = useCountUp(value);

  return (
    <motion.div variants={fadeUp} className="text-center">
      <p className="text-[clamp(3rem,8vw,5rem)] font-black tabular-nums leading-none tracking-[-0.04em] text-white">
        <span ref={ref}>{count.toLocaleString("fr-FR")}</span>
        {suffix}
      </p>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/65">{label}</p>
    </motion.div>
  );
}

export function MosStats() {
  return (
    <section
      id="chiffres"
      className="scroll-mt-24 px-5 py-24 sm:px-10 sm:py-32 lg:py-40"
      style={{ backgroundColor: "#8B0000" }}
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal className="mb-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">En chiffres</p>
          <h2 className="mt-4 text-[clamp(2rem,5vw,3rem)] font-black uppercase tracking-[-0.03em] text-white">
            La MOS en un coup d&apos;œil
          </h2>
        </Reveal>

        <motion.div
          className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
        >
          {STATS.map((stat) => (
            <StatItem key={stat.label} value={stat.value} suffix={stat.suffix} label={stat.label} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
