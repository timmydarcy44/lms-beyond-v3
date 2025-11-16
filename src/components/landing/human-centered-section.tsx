"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function HumanCenteredSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-40 bg-[#F8F9FB] relative overflow-hidden">
      {/* Halo Lumineux Subtil */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#D1D5FF] rounded-full blur-[120px]"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-5xl md:text-7xl font-medium text-[#0B0B0C] mb-12 leading-[1.1] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
              Pensé avec l'humain,
              <br />
              <span className="text-[#0B0B0C]/70">guidé par la science.</span>
            </h2>

            <div className="space-y-6 text-[#0B0B0C]/70 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
              <p className="text-xl">
                Beyond est le fruit d'une collaboration entre ingénieurs, designers et une psychopédagogue spécialisée en neuroéducation et santé mentale.
              </p>
              <p className="text-lg">
                Chaque fonctionnalité a été pensée pour s'adapter au fonctionnement naturel du cerveau :
                gestion du stress, attention sélective, mémoire de travail, émotions.
              </p>
              <p className="text-lg italic text-[#0B0B0C]/60">
                Résultat : un environnement numérique apaisé, intuitif et profondément humain.
              </p>
            </div>
          </motion.div>

          {/* Right Visual - Image réelle de personne en méditation ou yoga dans la nature */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
            transition={{ duration: 1.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-[500px] rounded-3xl overflow-hidden border border-[#0B0B0C]/5 shadow-2xl"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop')`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

