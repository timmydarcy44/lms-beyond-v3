"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";

import { LaptopDashboardUI } from "@/components/beyond-studio/ui/laptop-dashboard";
import { cinematicEase } from "@/components/beyond-studio/motion/cinematic";

export function MonumentLaptop() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotateX = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [14, 4, -6]), {
    stiffness: 70,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(scrollYProgress, [0, 1], [-8, 8]), {
    stiffness: 70,
    damping: 22,
  });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [60, -50]), {
    stiffness: 70,
    damping: 22,
  });
  const scale = useTransform(scrollYProgress, [0, 0.45, 1], [0.92, 1, 0.96]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[min(1100px,96vw)] perspective-[1400px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[90%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,99,220,0.2),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-20 w-[75%] -translate-x-1/2 rounded-full bg-black blur-[90px]" />

      <motion.div style={{ rotateX, rotateY, y, scale }} className="relative">
        <div className="relative mx-auto w-full">
          <div className="absolute -inset-x-6 -top-6 bottom-8 rounded-[2.5rem] bg-gradient-to-b from-white/[0.04] to-transparent blur-sm" />
          <div className="relative overflow-hidden rounded-t-[1.75rem] border border-white/[0.08] bg-[#12131a] px-5 pt-4 shadow-[0_60px_140px_rgba(0,0,0,0.75),0_0_80px_rgba(59,99,220,0.12)]">
            <div className="mb-4 flex gap-2">
              <span className="h-3 w-3 rounded-full bg-zinc-700/80" />
              <span className="h-3 w-3 rounded-full bg-zinc-700/80" />
              <span className="h-3 w-3 rounded-full bg-zinc-700/80" />
            </div>
            <div className="aspect-[16/9] overflow-hidden rounded-t-xl border border-white/[0.05] bg-[#07080d]">
              <LaptopDashboardUI />
            </div>
          </div>
          <div className="h-4 rounded-b-2xl bg-gradient-to-b from-[#12131a] to-[#08090e]" />
          <div className="mx-auto mt-3 h-1.5 w-40 rounded-full bg-zinc-800/80" />
        </div>
      </motion.div>
    </div>
  );
}

export function MonumentLaptopSection() {
  return (
    <section
      id="systemes"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-32 sm:py-40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(37,56,120,0.15),transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15%" }}
        transition={{ duration: 1.1, ease: cinematicEase }}
        className="relative z-10 mb-16 max-w-3xl px-6 text-center"
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-sky-400/70">
          Systèmes cognitivement fluides
        </p>
        <h2 className="mt-5 text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-white">
          Nous construisons des systèmes cognitivement fluides.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          Un bon système ne doit pas seulement être puissant. Il doit être naturellement utilisable — et
          réduire la friction mentale là où vos équipes décident, agissent et adoptent.
        </p>
      </motion.div>

      <MonumentLaptop />

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 1 }}
        className="relative z-10 mt-20 max-w-lg px-6 text-center text-sm leading-relaxed text-zinc-500"
      >
        Dashboards, workflows, copilotes IA — conçus comme un environnement de travail, pas comme une
        accumulation d’écrans.
      </motion.p>
    </section>
  );
}
