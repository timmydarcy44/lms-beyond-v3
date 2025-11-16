"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function ProblemSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="py-40 bg-[#F8F9FB] relative overflow-hidden">
      {/* Halo Lumineux Subtil */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.06, 0.1, 0.06],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D1D5FF] rounded-full blur-[100px]"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-5xl md:text-7xl font-normal text-[#0B0B0C] mb-12 leading-[1.1] tracking-[-0.02em] max-w-5xl mx-auto" style={{ fontFamily: '"Playfair Display", serif' }}>
            Nous avons fait de l'apprentissage
            <br />
            <span className="text-[#0B0B0C]/70">une course à la performance.</span>
            <br />
            <span className="text-4xl md:text-6xl mt-6 block">
              Il est temps de remettre l'humain au centre.
            </span>
          </h2>

          {/* Visual Transition - Overloaded to Calm */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-20 relative h-80 md:h-96 rounded-3xl overflow-hidden bg-white/40 backdrop-blur-xl border border-[#0B0B0C]/5"
          >
            {/* Overloaded State */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={isInView ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center p-8"
            >
              <div className="grid grid-cols-3 gap-4 w-full">
                {[...Array(9)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8, opacity: 0.4 }}
                    animate={isInView ? { scale: 1, opacity: 0.6 } : { scale: 0.8, opacity: 0.4 }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-20 bg-[#0B0B0C]/10 rounded-xl"
                  />
                ))}
              </div>
            </motion.div>

            {/* Calm State */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 2, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={isInView ? { scale: 1 } : { scale: 0.8 }}
                  transition={{ duration: 1.5, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  className="w-32 h-32 mx-auto bg-white/80 backdrop-blur-xl rounded-full flex items-center justify-center border border-[#0B0B0C]/5 shadow-lg"
                >
                  <svg className="w-16 h-16 text-[#99A7FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ duration: 1.2, delay: 2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[#0B0B0C]/60 text-lg font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}
                >
                  Espace calme
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
