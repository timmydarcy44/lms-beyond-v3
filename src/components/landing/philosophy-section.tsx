"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

export function PhilosophySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} id="philosophie" className="py-40 bg-[#F8F9FB] relative overflow-hidden">
      {/* Background Image - Personne en train de méditer ou faire du yoga dans la nature */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1999&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F9FB]/80 via-[#F8F9FB]/60 to-[#F8F9FB]" />
      </div>

      {/* Halo Lumineux Subtil */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.06, 0.1, 0.06],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#D1D5FF] rounded-full blur-[120px] z-10"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          {/* Main Heading */}
          <h2 className="text-5xl md:text-7xl font-medium text-[#0B0B0C] mb-16 leading-[1.1] tracking-[-0.02em] max-w-4xl mx-auto" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Nous avons fait de l'apprentissage
            <br />
            <span className="text-[#0B0B0C]/70">une course à la performance.</span>
            <br />
            <span className="text-4xl md:text-6xl mt-8 block">
              Il est temps de remettre l'humain au centre.
            </span>
          </h2>

          {/* Supporting Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-left max-w-3xl mx-auto space-y-6"
          >
            <p className="text-xl md:text-2xl text-[#0B0B0C]/70 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
              Beyond n'est pas un simple LMS.
              <br />
              C'est une philosophie qui réconcilie science, émotion et technologie.
            </p>
            <p className="text-lg md:text-xl text-[#0B0B0C]/60 leading-relaxed font-light" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
              En s'appuyant sur les neurosciences, la psychologie cognitive et le design humain, Beyond crée des environnements d'apprentissage apaisés, efficaces et durables.
            </p>
            <p className="text-lg md:text-xl text-[#0B0B0C]/60 leading-relaxed font-light italic" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif', letterSpacing: '-0.01em' }}>
              Parce qu'un esprit surchargé n'apprend pas — il résiste.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
